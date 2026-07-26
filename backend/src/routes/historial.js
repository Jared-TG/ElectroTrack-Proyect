module.exports = async function (fastify) {
  fastify.get('/historial', async (request, reply) => {
    const { usuario_id } = request.query;

    if (!usuario_id) {
      return reply.status(400).send({ error: 'usuario_id es requerido' });
    }

    let [rows] = await fastify.mysql.query(
      'SELECT * FROM consumo_mensual WHERE usuario_id = ? ORDER BY anio DESC, id DESC',
      [usuario_id]
    );

    return rows;
  });
};
