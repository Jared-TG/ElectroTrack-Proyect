module.exports = async function (fastify) {
  // GET /dispositivos — listar todos
  fastify.get('/dispositivos', async (request, reply) => {
    const [rows] = await fastify.mysql.query(
      'SELECT * FROM dispositivos ORDER BY created_at DESC'
    );
    return rows;
  });

  // POST /dispositivos — crear nuevo
  fastify.post('/dispositivos', async (request, reply) => {
    const { nombre, icono, estado, watts } = request.body;

    if (!nombre) {
      return reply.status(400).send({ error: 'El nombre es requerido' });
    }

    const [result] = await fastify.mysql.query(
      'INSERT INTO dispositivos (nombre, icono, estado, online, watts) VALUES (?, ?, ?, ?, ?)',
      [
        nombre,
        icono || 'tv',
        estado || 'en_espera',
        true,
        watts || 0,
      ]
    );

    const [newDevice] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE id = ?',
      [result.insertId]
    );

    return reply.status(201).send(newDevice[0]);
  });

  // DELETE /dispositivos/:id — eliminar
  fastify.delete('/dispositivos/:id', async (request, reply) => {
    const { id } = request.params;
    await fastify.mysql.query('DELETE FROM dispositivos WHERE id = ?', [id]);
    return { message: 'Dispositivo eliminado' };
  });
};
