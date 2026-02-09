require('dotenv').config();
const fastify = require('fastify')({ logger: true });

const PORT = process.env.PORT || 3000;

// Registrar plugins
fastify.register(require('@fastify/cors'), {
  origin: true
});

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