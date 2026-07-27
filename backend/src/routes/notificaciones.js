module.exports = async function (fastify) {
    // GET /notificaciones?usuario_id=1
    fastify.get('/notificaciones', async (request, reply) => {
        const { usuario_id } = request.query;
        if (!usuario_id) {
            return reply.status(400).send({ error: 'usuario_id es requerido' });
        }
        
        try {
            const [rows] = await fastify.mysql.query(
                'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 50',
                [usuario_id]
            );
            return reply.status(200).send(rows);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al obtener notificaciones' });
        }
    });

    // PUT /notificaciones/marcar-leidas
    fastify.put('/notificaciones/marcar-leidas', async (request, reply) => {
        const { usuario_id } = request.body;
        if (!usuario_id) {
            return reply.status(400).send({ error: 'usuario_id es requerido' });
        }

        try {
            await fastify.mysql.query(
                'UPDATE notificaciones SET leida = 1 WHERE usuario_id = ? AND leida = 0',
                [usuario_id]
            );
            return reply.status(200).send({ message: 'Notificaciones marcadas como leídas' });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al marcar notificaciones' });
        }
    });
};
