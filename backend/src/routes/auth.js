const crypto = require('crypto');
const mailService = require('../services/mailService');

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

            // Generar código de 6 dígitos
            const verification_code = Math.floor(100000 + Math.random() * 900000).toString();

            // Insertar nuevo usuario
            const [result] = await fastify.mysql.query(
                'INSERT INTO usuarios (email, nombre_usuario, contrasena, is_verified, verification_code) VALUES (?, ?, ?, ?, ?)',
                [email, nombre_usuario, contrasena, false, verification_code]
            );

            // Enviar correo asíncronamente
            mailService.sendVerificationCode(email, verification_code);

            return reply.status(201).send({
                message: 'Usuario registrado exitosamente. Por favor verifica tu correo.',
                userId: result.insertId,
                email: email
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al registrar usuario' });
        }
    });

    // POST /auth/verify
    fastify.post('/auth/verify', async (request, reply) => {
        const { email, code } = request.body;
        if (!email || !code) {
            return reply.status(400).send({ error: 'Email y código son requeridos' });
        }

        try {
            const [rows] = await fastify.mysql.query(
                'SELECT id, verification_code FROM usuarios WHERE email = ?',
                [email]
            );

            if (rows.length === 0) {
                return reply.status(404).send({ error: 'Usuario no encontrado' });
            }

            if (rows[0].verification_code !== code) {
                return reply.status(400).send({ error: 'Código incorrecto' });
            }

            await fastify.mysql.query(
                'UPDATE usuarios SET is_verified = true, verification_code = NULL WHERE email = ?',
                [email]
            );

            return reply.status(200).send({ message: 'Correo verificado exitosamente' });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al verificar correo' });
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
                'SELECT id, email, nombre_usuario, is_verified FROM usuarios WHERE email = ? AND contrasena = ?',
                [email, contrasena]
            );

            if (rows.length === 0) {
                return reply.status(401).send({ error: 'Credenciales incorrectas' });
            }

            if (!rows[0].is_verified) {
                return reply.status(403).send({ error: 'Correo no verificado', email: email });
            }

            return reply.status(200).send({
                message: 'Login exitoso',
                user: {
                    id: rows[0].id,
                    email: rows[0].email,
                    nombre_usuario: rows[0].nombre_usuario
                },
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al iniciar sesión' });
        }
    });

    // POST /auth/google
    fastify.post('/auth/google', async (request, reply) => {
        const { email, name, google_id } = request.body;

        if (!email || !google_id) {
            return reply.status(400).send({ error: 'Email y Google ID son requeridos' });
        }

        try {
            const [rows] = await fastify.mysql.query(
                'SELECT id, email, nombre_usuario FROM usuarios WHERE email = ?',
                [email]
            );

            if (rows.length > 0) {
                // Usuario ya existe, loguear
                // Actualizar google_id por si no lo tenía y marcar como verificado (si no lo estaba)
                await fastify.mysql.query(
                    'UPDATE usuarios SET google_id = ?, is_verified = true WHERE email = ?',
                    [google_id, email]
                );
                return reply.status(200).send({
                    message: 'Login con Google exitoso',
                    user: rows[0],
                });
            } else {
                // Registrar nuevo usuario
                // Generar un nombre de usuario si ya está en uso (ej. juan -> juan1234)
                const baseName = (name || email.split('@')[0]).replace(/\s+/g, '').toLowerCase();
                let username = baseName;
                
                // Verificar si existe el nombre de usuario base
                const [existingUser] = await fastify.mysql.query(
                    'SELECT id FROM usuarios WHERE nombre_usuario = ?',
                    [username]
                );
                
                if (existingUser.length > 0) {
                    username = `${baseName}${Math.floor(Math.random() * 10000)}`;
                }

                const randomPassword = crypto.randomBytes(16).toString('hex'); // Contraseña dummy
                
                const [result] = await fastify.mysql.query(
                    'INSERT INTO usuarios (email, nombre_usuario, contrasena, is_verified, google_id) VALUES (?, ?, ?, ?, ?)',
                    [email, username, randomPassword, true, google_id]
                );

                return reply.status(201).send({
                    message: 'Cuenta creada con Google exitosamente',
                    user: {
                        id: result.insertId,
                        email: email,
                        nombre_usuario: username
                    },
                });
            }
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error al iniciar sesión con Google' });
        }
    });
}

module.exports = authRoutes;
