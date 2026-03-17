module.exports = async function (fastify) {
  // GET /dispositivos — listar dispositivos (opcionalmente filtrar por usuario)
  fastify.get('/dispositivos', async (request, reply) => {
    const { usuario_id } = request.query;

    let query = 'SELECT * FROM dispositivos';
    const params = [];

    if (usuario_id) {
      query += ' WHERE usuario_id = ?';
      params.push(usuario_id);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await fastify.mysql.query(query, params);
    return rows;
  });

  // GET /dispositivos/qr/:qr_code — buscar dispositivo por código QR
  fastify.get('/dispositivos/qr/:qr_code', async (request, reply) => {
    const { qr_code } = request.params;

    const [rows] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE qr_code = ?',
      [qr_code]
    );

    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Dispositivo no encontrado' });
    }

    return rows[0];
  });

  // POST /dispositivos — crear nuevo dispositivo
  fastify.post('/dispositivos', async (request, reply) => {
    const { nombre, icono, tipo, modelo, serial, qr_code, estado, watts, usuario_id } = request.body;

    if (!nombre) {
      return reply.status(400).send({ error: 'El nombre es requerido' });
    }

    const [result] = await fastify.mysql.query(
      `INSERT INTO dispositivos (nombre, icono, tipo, modelo, serial, qr_code, estado, online, watts, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        icono || null,
        tipo || 'general',
        modelo || null,
        serial || null,
        qr_code || null,
        estado || 'en_espera',
        true,
        watts || 0,
        usuario_id || null,
      ]
    );

    const [newDevice] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE id = ?',
      [result.insertId]
    );

    return reply.status(201).send(newDevice[0]);
  });

  // POST /dispositivos/vincular — vincular dispositivo existente a un usuario (por QR)
  fastify.post('/dispositivos/vincular', async (request, reply) => {
    const { qr_code, usuario_id } = request.body;

    if (!qr_code || !usuario_id) {
      return reply.status(400).send({ error: 'qr_code y usuario_id son requeridos' });
    }

    // Verificar que el dispositivo existe
    const [existing] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE qr_code = ?',
      [qr_code]
    );

    if (existing.length === 0) {
      // Si no existe en MySQL, crear uno nuevo con los datos del QR
      const { nombre, icono, tipo, modelo, serial, watts } = request.body;

      const [result] = await fastify.mysql.query(
        `INSERT INTO dispositivos (nombre, icono, tipo, modelo, serial, qr_code, estado, online, watts, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre || 'Dispositivo',
          icono || null,
          tipo || 'general',
          modelo || null,
          serial || null,
          qr_code,
          'en_espera',
          true,
          watts || 0,
          usuario_id,
        ]
      );

      const [newDevice] = await fastify.mysql.query(
        'SELECT * FROM dispositivos WHERE id = ?',
        [result.insertId]
      );

      return reply.status(201).send(newDevice[0]);
    }

    // Si ya existe, actualizar el usuario_id
    await fastify.mysql.query(
      'UPDATE dispositivos SET usuario_id = ? WHERE qr_code = ?',
      [usuario_id, qr_code]
    );

    const [updated] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE qr_code = ?',
      [qr_code]
    );

    return reply.status(200).send(updated[0]);
  });

  // DELETE /dispositivos/:id — eliminar
  fastify.delete('/dispositivos/:id', async (request, reply) => {
    const { id } = request.params;
    await fastify.mysql.query('DELETE FROM dispositivos WHERE id = ?', [id]);
    return { message: 'Dispositivo eliminado' };
  });
};
