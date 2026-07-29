module.exports = async function (fastify) {
    // GET /usuarios/:id/preferencias
    fastify.get('/usuarios/:id/preferencias', async (request, reply) => {
        const { id } = request.params;
        const [rows] = await fastify.mysql.query(
            'SELECT notif_activas, notif_alto_consumo, limite_alto_consumo_watts, actualizacion_automatica, tarifa_actual FROM usuarios WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return reply.status(404).send({ error: 'Usuario no encontrado' });
        }
        return reply.status(200).send(rows[0]);
    });

    // PUT /usuarios/:id/preferencias
    fastify.put('/usuarios/:id/preferencias', async (request, reply) => {
        const { id } = request.params;
        const { notif_activas, notif_alto_consumo, limite_alto_consumo_watts, actualizacion_automatica, tarifa_actual } = request.body;

        try {
            await fastify.mysql.query(
                `UPDATE usuarios 
                 SET notif_activas = COALESCE(?, notif_activas),
                     notif_alto_consumo = COALESCE(?, notif_alto_consumo),
                     limite_alto_consumo_watts = COALESCE(?, limite_alto_consumo_watts),
                     actualizacion_automatica = COALESCE(?, actualizacion_automatica),
                     tarifa_actual = COALESCE(?, tarifa_actual)
                 WHERE id = ?`,
                [notif_activas, notif_alto_consumo, limite_alto_consumo_watts, actualizacion_automatica, tarifa_actual, id]
            );
            return reply.status(200).send({ message: 'Preferencias actualizadas' });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al actualizar preferencias' });
        }
    });
    // PUT /usuarios/:id/fcm-token
    fastify.put('/usuarios/:id/fcm-token', async (request, reply) => {
        const { id } = request.params;
        const { fcm_token } = request.body;
        try {
            await fastify.mysql.query(
                'UPDATE usuarios SET fcm_token = ? WHERE id = ?',
                [fcm_token, id]
            );
            return reply.status(200).send({ message: 'Token actualizado' });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al guardar token' });
        }
    });
};
