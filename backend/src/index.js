require('dotenv').config();
const fastify = require('fastify')({ logger: true });

const PORT = process.env.PORT || 3000;

// Conexión a MySQL
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

fastify.decorate('mysql', pool);

// Registrar plugins
fastify.register(require('@fastify/cors'), {
  origin: true
});

// Registrar rutas
fastify.register(require('./routes/historial'));

// Rutas básicas
fastify.get('/', async (request, reply) => {
  return {
    message: 'ElectroTrack API',
    status: 'running',
    version: '1.0.0'
  };
});

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date() };
});

// Iniciar servidor
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();