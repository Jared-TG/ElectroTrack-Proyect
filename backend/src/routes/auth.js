async function authRoutes(fastify, options) {
    // POST /auth/register
    fastify.post('/auth/register', async (request, reply) => {
        const { email, nombre_usuario, contrasena } = request.body;

        // Validar campos requeridos
        if (!email || !nombre_usuario || !contrasena) {
            return reply.status(400).send({ error: 'Todos los campos son requeridos' });
        }

        try {
            // Verificar si el email ya existe
            const [existingEmail] = await fastify.mysql.query(
                'SELECT id FROM usuarios WHERE email = ?',
                [email]
            );
            if (existingEmail.length > 0) {
                return reply.status(400).send({ error: 'El email ya está registrado' });
            }

            // Verificar si el nombre de usuario ya existe
            const [existingUser] = await fastify.mysql.query(
                'SELECT id FROM usuarios WHERE nombre_usuario = ?',
                [nombre_usuario]
            );
            if (existingUser.length > 0) {
                return reply.status(400).send({ error: 'El nombre de usuario ya está en uso' });
            }

            // Insertar nuevo usuario
            const [result] = await fastify.mysql.query(
                'INSERT INTO usuarios (email, nombre_usuario, contrasena) VALUES (?, ?, ?)',
                [email, nombre_usuario, contrasena]
            );

            return reply.status(201).send({
                message: 'Usuario registrado exitosamente',
                userId: result.insertId,
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al registrar usuario' });
        }
    });

    // POST /auth/login
    fastify.post('/auth/login', async (request, reply) => {
        const { email, contrasena } = request.body;

        // Validar campos requeridos
        if (!email || !contrasena) {
            return reply.status(400).send({ error: 'Email y contraseña son requeridos' });
        }

        try {
            const [rows] = await fastify.mysql.query(
                'SELECT id, email, nombre_usuario FROM usuarios WHERE email = ? AND contrasena = ?',
                [email, contrasena]
            );

            if (rows.length === 0) {
                return reply.status(401).send({ error: 'Credenciales incorrectas' });
            }

            return reply.status(200).send({
                message: 'Login exitoso',
                user: rows[0],
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al iniciar sesión' });
        }
    });
}

module.exports = authRoutes;
