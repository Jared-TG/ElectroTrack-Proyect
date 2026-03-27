module.exports = async function (fastify) {
  // Estado por dispositivo para simular datos continuos y suaves
  const deviceStates = {};

  function getDeviceState(id) {
    if (!deviceStates[id]) {
      deviceStates[id] = {
        startTime: Date.now(),
        kwhAccum: Math.random() * 10 + 20, // kWh acumulados iniciales (20-30)
        lastUpdate: Date.now(),
      };
    }
    return deviceStates[id];
  }

  // GET /dispositivos/:id/realtime — datos simulados de IoT
  fastify.get('/dispositivos/:id/realtime', async (request, reply) => {
    const { id } = request.params;
    const state = getDeviceState(id);
    const now = Date.now();

    // Onda sinusoidal suave para watts (simula variación de consumo)
    const elapsed = (now - state.startTime) / 1000; // segundos
    const baseWatts = 40;
    const amplitude = 25;
    const wave = Math.sin(elapsed * 0.15) * amplitude;
    const noise = (Math.random() - 0.5) * 6; // pequeño ruido
    const watts = Math.max(5, Math.round(baseWatts + wave + noise));

    // Voltaje oscila ligeramente alrededor de 127V (realista para México)
    const voltaje = +(127 + (Math.random() - 0.5) * 2).toFixed(1);

    // Corriente = watts / voltaje
    const corriente = +(watts / voltaje).toFixed(2);

    // Acumular kWh (watts * horas transcurridas desde último update)
    const hoursElapsed = (now - state.lastUpdate) / (1000 * 60 * 60);
    state.kwhAccum += (watts / 1000) * hoursElapsed;
    state.lastUpdate = now;

    return {
      timestamp: new Date(now).toISOString(),
      watts,
      voltaje,
      corriente,
      kwh_total: +state.kwhAccum.toFixed(1),
    };
  });
};
