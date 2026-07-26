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

    // Si no hay datos, generar datos de prueba para este usuario (simulación)
    if (rows.length === 0) {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const anioActual = new Date().getFullYear();
      
      const insertQuery = 'INSERT INTO consumo_mensual (mes, anio, kwh, costo, usuario_id) VALUES ?';
      const values = [];
      
      // Generar 12 meses hacia atrás (mezclando año actual y anterior si es necesario)
      let mesIndex = new Date().getMonth(); // Mes actual
      let currentYear = anioActual;

      for (let i = 0; i < 12; i++) {
        // Generar kwh aleatorio entre 250 y 550
        const kwh = Math.floor(Math.random() * (550 - 250 + 1)) + 250;
        // Costo aproximado (simulado rápido)
        const costo = kwh * 1.5; 
        
        values.push([meses[mesIndex], currentYear, kwh, costo, usuario_id]);
        
        mesIndex--;
        if (mesIndex < 0) {
          mesIndex = 11;
          currentYear--;
        }
      }

      // Insertar todo de golpe
      await fastify.mysql.query(insertQuery, [values]);

      // Volver a consultar
      const [newRows] = await fastify.mysql.query(
        'SELECT * FROM consumo_mensual WHERE usuario_id = ? ORDER BY anio DESC, id DESC',
        [usuario_id]
      );
      rows = newRows;
    }

    return rows;
  });
};
