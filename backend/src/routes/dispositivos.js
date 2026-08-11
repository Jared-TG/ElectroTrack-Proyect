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
    let query = 'SELECT id, nombre, qr_code, ip_local, icono, watts as db_watts, kwh_total, relay_state, online FROM dispositivos';
    const params = [];
    if (usuario_id) {
      query += ' WHERE usuario_id = ?';
      params.push(usuario_id);
    }
    const [devices] = await fastify.mysql.query(query, params);

    // Consultar directamente de la BD en lugar de hacer FETCH a los ESP32
    // ya que ahora usan el modelo Push
    const deviceData = devices.map(d => ({
      id: d.id,
      qr_code: d.qr_code,
      watts: d.db_watts || 0,
      kwh_total: d.kwh_total || 0,
      relay_state: d.relay_state === 'ON',
      online: d.online === 1
    }));

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
  // POST /dispositivos/sync — Endpoint PUSH para el ESP32
  // Recibe datos en tiempo real cada 5 segundos
  // ============================================================
  fastify.post('/dispositivos/sync', async (request, reply) => {
    const { 
      mac_address, ip_local, voltage, current, power, 
      energy, frequency, power_factor, relay_state, anomaly_detected 
    } = request.body;

    if (!mac_address) {
      return reply.status(400).send({ error: 'mac_address es requerido' });
    }

    // 1. Buscar el dispositivo y su estado_deseado_relay
    const [rows] = await fastify.mysql.query(
      'SELECT id, relay_state, estado_deseado_relay FROM dispositivos WHERE qr_code = ? OR mac_address = ?',
      [mac_address, mac_address]
    );

    let relay_command = null;

    if (rows.length > 0) {
      const dbDevice = rows[0];
      
      // Si el ESP32 nos reporta un estado distinto al que el usuario solicitó,
      // le devolvemos el comando para que lo cambie.
      if (dbDevice.estado_deseado_relay !== null && dbDevice.estado_deseado_relay !== relay_state) {
        relay_command = dbDevice.estado_deseado_relay;
      }

      // 2. Actualizar los datos del dispositivo en la base de datos
      await fastify.mysql.query(
        `UPDATE dispositivos
         SET ip_local = ?, 
             watts = ?, 
             kwh_total = ?, 
             relay_state = ?, 
             estado_deseado_relay = CASE WHEN estado_deseado_relay = ? THEN NULL ELSE estado_deseado_relay END,
             online = 1,
             estado = 'en_linea',
             ultimo_reporte = NOW(),
             voltaje = ?,
             corriente = ?,
             factor_potencia = ?,
             frecuencia = ?,
             anomalia = ?
         WHERE id = ?`,
        [
          ip_local || null, power || 0, energy || 0, relay_state === 'ON' ? 'ON' : 'OFF', 
          relay_state === 'ON' ? 'ON' : 'OFF',
          voltage || 0, current || 0, power_factor || 0, frequency || 0, anomaly_detected ? 1 : 0,
          dbDevice.id
        ]
      );
    }

    // Retornamos 200 OK, incluyendo el comando si existe
    return reply.status(200).send({
      status: 'ok',
      relay_command: relay_command // Será "ON", "OFF" o null
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
      'SELECT * FROM dispositivos WHERE id = ? OR qr_code = ?',
      [isNaN(id) ? -1 : Number(id), id]
    );

    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Dispositivo no encontrado' });
    }

    const dev = rows[0];

    // Leemos directamente desde la base de datos (modelo Push)
    return {
      timestamp:   new Date().toISOString(),
      voltaje:     dev.voltaje || 0,
      watts:       dev.watts || 0,
      corriente:   dev.corriente || 0,
      kwh_total:   dev.kwh_total || 0,
      frecuencia:  dev.frecuencia || 0,
      factor_pot:  dev.factor_potencia || 0,
      relay_state: dev.relay_state === 'ON',
      anomaly:     dev.anomalia === 1,
      online:      dev.online === 1,
      ip_local:    dev.ip_local,
    };
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

    // Guardamos el estado deseado en la base de datos para que el ESP32 lo lea en su proximo Push (sync)
    // También actualizamos relay_state para que la UI responda inmediatamente sin rebotar
    await fastify.mysql.query(
      'UPDATE dispositivos SET estado_deseado_relay = ?, relay_state = ? WHERE id = ? OR qr_code = ?',
      [state, state, isNaN(id) ? -1 : Number(id), id]
    );

    return reply.status(200).send({ status: 'pending_sync', message: 'Comando encolado para el dispositivo' });
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
