module.exports = async function (fastify) {

  // ============================================================
  // GET /dispositivos — listar dispositivos del usuario
  // ============================================================
  fastify.get('/dispositivos', async (request, reply) => {
    const { usuario_id } = request.query;
    let query = 'SELECT * FROM dispositivos';
    const params = [];
    if (usuario_id) {
      query += ' WHERE usuario_id = ?';
      params.push(usuario_id);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await fastify.mysql.query(query, params);
    return rows;
  });

  // ============================================================
  // GET /dispositivos/dashboard-summary — resumen en tiempo real de todos los dispositivos
  // Consulta cada ESP32 en paralelo y devuelve watts por dispositivo + total
  // ============================================================
  fastify.get('/dispositivos/dashboard-summary', async (request, reply) => {
    const { usuario_id } = request.query;
    let query = 'SELECT id, nombre, qr_code, ip_local, icono, watts as db_watts FROM dispositivos';
    const params = [];
    if (usuario_id) {
      query += ' WHERE usuario_id = ?';
      params.push(usuario_id);
    }
    const [devices] = await fastify.mysql.query(query, params);

    // Consultar cada ESP32 en paralelo (con timeout de 3 seg para no bloquear)
    const results = await Promise.allSettled(
      devices.map(async (device) => {
        if (!device.ip_local) {
          return { id: device.id, qr_code: device.qr_code, watts: 0, kwh_total: 0, online: false };
        }
        try {
          const res = await fetch(`http://${device.ip_local}/api/status`, {
            signal: AbortSignal.timeout(3000),
          });
          if (!res.ok) throw new Error('ESP error');
          const d = await res.json();
          return {
            id: device.id,
            qr_code: device.qr_code,
            watts: d.power || 0,
            kwh_total: d.energy || 0,
            relay_state: d.relay_state === 'ON',
            online: true,
          };
        } catch {
          return { id: device.id, qr_code: device.qr_code, watts: 0, kwh_total: 0, relay_state: false, online: false };
        }
      })
    );

    const deviceData = results.map(r => r.status === 'fulfilled' ? r.value : { watts: 0, kwh_total: 0, relay_state: false, online: false });
    const totalWatts = deviceData.reduce((sum, d) => sum + d.watts, 0);
    const totalKwh = deviceData.reduce((sum, d) => sum + d.kwh_total, 0);

    return {
      totalWatts,
      totalKwh,
      devices: deviceData,
    };
  });

  // ============================================================
  // GET /dispositivos/qr/:qr_code — buscar por código QR (MAC)
  // ============================================================
  fastify.get('/dispositivos/qr/:qr_code', async (request, reply) => {
    const { qr_code } = request.params;
    const [rows] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE qr_code = ?',
      [qr_code]
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Dispositivo no encontrado' });
    }
    return rows[0];
  });

  // ============================================================
  // POST /dispositivos — crear nuevo dispositivo
  // ============================================================
  fastify.post('/dispositivos', async (request, reply) => {
    const { nombre, icono, tipo, modelo, serial, qr_code, mac_address, ip_local, estado, watts, usuario_id } = request.body;
    if (!nombre) {
      return reply.status(400).send({ error: 'El nombre es requerido' });
    }
    const [result] = await fastify.mysql.query(
      `INSERT INTO dispositivos (nombre, icono, tipo, modelo, serial, qr_code, mac_address, ip_local, estado, online, watts, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        icono || null,
        tipo || 'general',
        modelo || null,
        serial || null,
        qr_code || null,
        mac_address || null,
        ip_local || null,
        estado || 'en_espera',
        true,
        watts || 0,
        usuario_id || null,
      ]
    );
    const [newDevice] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE id = ?',
      [result.insertId]
    );
    return reply.status(201).send(newDevice[0]);
  });

  // ============================================================
  // POST /dispositivos/vincular — vincular dispositivo por QR (MAC)
  // ============================================================
  fastify.post('/dispositivos/vincular', async (request, reply) => {
    const { qr_code, usuario_id, mac_address, ip_local, nombre, icono, tipo, modelo, serial, watts } = request.body;
    if (!qr_code || !usuario_id) {
      return reply.status(400).send({ error: 'qr_code y usuario_id son requeridos' });
    }

    const [existing] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE qr_code = ?',
      [qr_code]
    );

    if (existing.length === 0) {
      // Crear nuevo
      const [result] = await fastify.mysql.query(
        `INSERT INTO dispositivos (nombre, icono, tipo, modelo, serial, qr_code, mac_address, ip_local, estado, online, watts, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre || 'Dispositivo',
          icono || null,
          tipo || 'general',
          modelo || null,
          serial || null,
          qr_code,
          mac_address || qr_code, // Si no viene mac_address, usar el qr_code (que es la MAC)
          ip_local || null,
          'en_espera',
          true,
          watts || 0,
          usuario_id,
        ]
      );
      const [newDevice] = await fastify.mysql.query(
        'SELECT * FROM dispositivos WHERE id = ?',
        [result.insertId]
      );
      return reply.status(201).send(newDevice[0]);
    }

    // Actualizar usuario y datos si ya existe
    await fastify.mysql.query(
      `UPDATE dispositivos 
       SET usuario_id = ?, 
           mac_address = COALESCE(?, mac_address), 
           ip_local = COALESCE(?, ip_local),
           nombre = COALESCE(?, nombre),
           icono = COALESCE(?, icono),
           tipo = COALESCE(?, tipo),
           modelo = COALESCE(?, modelo),
           serial = COALESCE(?, serial),
           watts = COALESCE(?, watts)
       WHERE qr_code = ?`,
      [
        usuario_id, 
        mac_address || null, 
        ip_local || null, 
        nombre || null, 
        icono || null, 
        tipo || null, 
        modelo || null, 
        serial || null, 
        watts || null, 
        qr_code
      ]
    );
    const [updated] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE qr_code = ?',
      [qr_code]
    );
    return reply.status(200).send(updated[0]);
  });

  // ============================================================
  // POST /dispositivos/register — el ESP32 registra su IP al arrancar
  // Este endpoint NO requiere autenticación (lo llama el ESP32 directamente)
  // ============================================================
  fastify.post('/dispositivos/register', async (request, reply) => {
    const { mac_address, ip_local } = request.body;

    if (!mac_address || !ip_local) {
      return reply.status(400).send({ error: 'mac_address e ip_local son requeridos' });
    }

    fastify.log.info(`[ESP32] Registrando: MAC=${mac_address} IP=${ip_local}`);

    // Actualizar ip_local y marcar como en línea
    const [result] = await fastify.mysql.query(
      `UPDATE dispositivos
       SET ip_local = ?, mac_address = ?, estado = 'en_linea', online = 1
       WHERE qr_code = ? OR mac_address = ?`,
      [ip_local, mac_address, mac_address, mac_address]
    );

    if (result.affectedRows === 0) {
      // Dispositivo aún no vinculado — guardar la IP para cuando se vincule
      fastify.log.info(`[ESP32] MAC ${mac_address} no vinculada aún. IP guardada temporalmente.`);
      return reply.status(200).send({
        status: 'pending',
        message: 'Dispositivo no vinculado aún. IP registrada.',
        mac_address,
        ip_local,
      });
    }

    return reply.status(200).send({
      status: 'ok',
      message: 'IP actualizada correctamente',
      mac_address,
      ip_local,
    });
  });

  // ============================================================
  // GET /dispositivos/:id/realtime — datos REALES del ESP32
  // Hace proxy a http://{ip_local}/api/status
  // ============================================================
  fastify.get('/dispositivos/:id/realtime', async (request, reply) => {
    const { id } = request.params;

    // Buscar por id numérico o por qr_code (MAC)
    const [rows] = await fastify.mysql.query(
      'SELECT ip_local, nombre FROM dispositivos WHERE id = ? OR qr_code = ?',
      [isNaN(id) ? -1 : Number(id), id]
    );

    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Dispositivo no encontrado' });
    }

    const ip = rows[0].ip_local;
    if (!ip) {
      return reply.status(503).send({
        error: 'Dispositivo sin IP registrada. Asegúrate de que el ESP32 esté encendido y conectado al WiFi.',
      });
    }

    try {
      const esp32Res = await fetch(`http://${ip}/api/status`, {
        signal: AbortSignal.timeout(5000), // timeout 5 seg
      });

      if (!esp32Res.ok) {
        return reply.status(502).send({ error: `ESP32 respondió con error: ${esp32Res.status}` });
      }

      const d = await esp32Res.json();

      // Mapear campos ESP32 → formato esperado por la app
      return {
        timestamp:   new Date().toISOString(),
        voltaje:     d.voltage,
        watts:       d.power,
        corriente:   d.current,
        kwh_total:   d.energy,
        frecuencia:  d.frequency,
        factor_pot:  d.power_factor,
        relay_state: d.relay_state,
        anomaly:     d.anomaly_detected,
      };
    } catch (err) {
      fastify.log.error(`[Realtime] Error al conectar con ESP32 en ${ip}: ${err.message}`);
      return reply.status(504).send({
        error: 'No se pudo conectar al dispositivo. Verifica que el ESP32 esté encendido y en la misma red.',
      });
    }
  });



  // ============================================================
  // POST /dispositivos/:id/relay — controlar relé via proxy
  // ============================================================
  fastify.post('/dispositivos/:id/relay', async (request, reply) => {
    const { id } = request.params;
    const { state } = request.body;

    if (!state || !['ON', 'OFF', 'on', 'off'].includes(state)) {
      return reply.status(400).send({ error: 'state debe ser "ON" o "OFF"' });
    }

    const [rows] = await fastify.mysql.query(
      'SELECT ip_local FROM dispositivos WHERE id = ? OR qr_code = ?',
      [isNaN(id) ? -1 : Number(id), id]
    );

    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Dispositivo no encontrado' });
    }

    const ip = rows[0].ip_local;
    if (!ip) {
      return reply.status(503).send({ error: 'Dispositivo sin IP registrada' });
    }

    try {
      const esp32Res = await fetch(`http://${ip}/api/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
        signal: AbortSignal.timeout(5000),
      });

      const result = await esp32Res.json();
      return result;
    } catch (err) {
      fastify.log.error(`[Relay] Error al conectar con ESP32 en ${ip}: ${err.message}`);
      return reply.status(504).send({ error: 'No se pudo conectar al dispositivo.' });
    }
  });

  // ============================================================
  // POST /dispositivos/:id/wifi — Actualizar WiFi del ESP32
  // ============================================================
  fastify.post('/dispositivos/:id/wifi', async (request, reply) => {
    const { id } = request.params;
    const { ssid, pass } = request.body;

    if (!ssid || !pass) {
      return reply.status(400).send({ error: 'SSID y contraseña son requeridos' });
    }

    try {
      const [rows] = await fastify.mysql.query(
        'SELECT ip_local FROM dispositivos WHERE id = ? AND ip_local IS NOT NULL AND online = 1',
        [id]
      );

      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Dispositivo no encontrado o está offline' });
      }

      const ip = rows[0].ip_local;

      const esp32Res = await fetch(`http://${ip}/api/wifi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, pass }),
        signal: AbortSignal.timeout(5000),
      });

      if (!esp32Res.ok) {
        return reply.status(502).send({ error: `ESP32 respondió con error: ${esp32Res.status}` });
      }

      return { status: 'success', message: 'Credenciales enviadas correctamente' };
    } catch (err) {
      fastify.log.error(`[WiFi Update] Error al conectar con ESP32: ${err.message}`);
      return reply.status(504).send({
        error: 'No se pudo conectar al dispositivo para actualizar el Wi-Fi.',
      });
    }
  });

  // ============================================================
  // PUT /dispositivos/:id — editar dispositivo
  // ============================================================
  fastify.put('/dispositivos/:id', async (request, reply) => {
    const { id } = request.params;
    const { nombre, icono } = request.body;

    if (!nombre) {
      return reply.status(400).send({ error: 'El nombre es requerido' });
    }

    await fastify.mysql.query(
      'UPDATE dispositivos SET nombre = ?, icono = ? WHERE id = ?',
      [nombre, icono || null, id]
    );

    const [updated] = await fastify.mysql.query(
      'SELECT * FROM dispositivos WHERE id = ?',
      [id]
    );

    if (updated.length === 0) {
      return reply.status(404).send({ error: 'Dispositivo no encontrado' });
    }

    return reply.status(200).send(updated[0]);
  });

  // ============================================================
  // DELETE /dispositivos/:id — eliminar
  // ============================================================
  fastify.delete('/dispositivos/:id', async (request, reply) => {
    const { id } = request.params;
    await fastify.mysql.query('DELETE FROM dispositivos WHERE id = ?', [id]);
    return { message: 'Dispositivo eliminado' };
  });
};
