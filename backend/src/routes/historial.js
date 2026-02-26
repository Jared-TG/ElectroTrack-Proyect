module.exports = async function (fastify) {
  fastify.get('/historial', async (request, reply) => {
    const [rows] = await fastify.mysql.query(
      'SELECT * FROM consumo_mensual ORDER BY anio DESC, id DESC'
    );
    return rows;
  });
};
