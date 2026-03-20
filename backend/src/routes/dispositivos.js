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

  // ===== SIMULADOR IoT (datos en tiempo real) =====
  const deviceStates = {};

  function getDeviceState(id) {
    if (!deviceStates[id]) {
      deviceStates[id] = {
        startTime: Date.now(),
        kwhAccum: Math.random() * 10 + 20,
        lastUpdate: Date.now(),
      };
    }
    return deviceStates[id];
  }

  // GET /dispositivos/:id/realtime — datos simulados de IoT
  fastify.get('/dispositivos/:id/realtime', async (request, reply) => {
    const { id } = request.params;
    const state = getDeviceState(id);
    const now = Date.now();

    const elapsed = (now - state.startTime) / 1000;
    const baseWatts = 40;
    const amplitude = 25;
    const wave = Math.sin(elapsed * 0.15) * amplitude;
    const noise = (Math.random() - 0.5) * 6;
    const watts = Math.max(5, Math.round(baseWatts + wave + noise));

    const voltaje = +(127 + (Math.random() - 0.5) * 2).toFixed(1);
    const corriente = +(watts / voltaje).toFixed(2);

    const hoursElapsed = (now - state.lastUpdate) / (1000 * 60 * 60);
    state.kwhAccum += (watts / 1000) * hoursElapsed;
    state.lastUpdate = now;

    return {
      timestamp: new Date(now).toISOString(),
      watts,
      voltaje,
      corriente,
      kwh_total: +state.kwhAccum.toFixed(1),
    };
  });

  // DELETE /dispositivos/:id — eliminar
  fastify.delete('/dispositivos/:id', async (request, reply) => {
    const { id } = request.params;
    await fastify.mysql.query('DELETE FROM dispositivos WHERE id = ?', [id]);
    return { message: 'Dispositivo eliminado' };
  });
};
