const cron = require('node-cron');
const { sendPushNotification } = require('./firebase');

const TARIFA = {
  basico: 0.75,
  intermedioBajo: 0.94,
  intermedioAlto: 2.29,
  excedente: 3.60,
  iva: 0.16,
};

const LIMITES = {
  basico: 300,
  intBajo: 1200,
  intAlto: 2500,
};

function calcularCostoCFE(consumoTotalKwh) {
  let subtotal = 0;
  if (consumoTotalKwh <= 0) return 0;
  
  if (consumoTotalKwh <= LIMITES.basico) {
    subtotal = consumoTotalKwh * TARIFA.basico;
  } else if (consumoTotalKwh <= LIMITES.intBajo) {
    subtotal = LIMITES.basico * TARIFA.basico + (consumoTotalKwh - LIMITES.basico) * TARIFA.intermedioBajo;
  } else if (consumoTotalKwh <= LIMITES.intAlto) {
    subtotal = LIMITES.basico * TARIFA.basico + (LIMITES.intBajo - LIMITES.basico) * TARIFA.intermedioBajo + (consumoTotalKwh - LIMITES.intBajo) * TARIFA.intermedioAlto;
  } else {
    subtotal = LIMITES.basico * TARIFA.basico + (LIMITES.intBajo - LIMITES.basico) * TARIFA.intermedioBajo + (LIMITES.intAlto - LIMITES.intBajo) * TARIFA.intermedioAlto + (consumoTotalKwh - LIMITES.intAlto) * TARIFA.excedente;
  }
  
  return subtotal + (subtotal * TARIFA.iva);
}

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

async function crearNotificacion(fastify, usuarioId, titulo, mensaje) {
  // Evitar spam: no enviar la misma alerta (mismo título) si se envió hace menos de 1 minuto (para pruebas)
  const [recent] = await fastify.mysql.query(
    "SELECT id FROM notificaciones WHERE usuario_id = ? AND titulo = ? AND fecha >= NOW() - INTERVAL 1 MINUTE",
    [usuarioId, titulo]
  );
  if (recent.length === 0) {
    await fastify.mysql.query(
      "INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES (?, ?, ?)",
      [usuarioId, titulo, mensaje]
    );
    
    // Enviar notificación Push (Firebase)
    const [users] = await fastify.mysql.query("SELECT fcm_token FROM usuarios WHERE id = ?", [usuarioId]);
    if (users.length > 0 && users[0].fcm_token) {
      await sendPushNotification(users[0].fcm_token, titulo, mensaje, { type: 'alert' });
    }
  }
}

class CronService {
  constructor(fastify) {
    this.fastify = fastify;
  }

  start() {
    console.log('[Cron] Inicializando monitores (Health Check 1m, Consumo 5m)...');

    // ----------------------------------------------------
    // MONITOR DE SALUD (Health Check) - Cada 1 Minuto
    // ----------------------------------------------------
    cron.schedule('*/1 * * * *', async () => {
      try {
        const [dispositivos] = await this.fastify.mysql.query(
          `SELECT d.ip_local, d.nombre, d.usuario_id, u.notif_activas
           FROM dispositivos d 
           JOIN usuarios u ON d.usuario_id = u.id 
           WHERE d.ip_local IS NOT NULL AND u.notif_activas = 1`
        );

        if (!dispositivos || dispositivos.length === 0) return;

        for (const disp of dispositivos) {
          if (!disp.usuario_id) continue;
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // Ping rápido de 2 seg
            
            const res = await fetch(`http://${disp.ip_local}/api/status`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error('Bad Status');
          } catch (e) {
            // Falla el ping: Dispositivo fuera de línea
            await crearNotificacion(
                this.fastify, 
                disp.usuario_id, 
                'Dispositivo Desconectado', 
                `Se perdió la conexión con tu dispositivo "${disp.nombre}". Verifica que tenga energía y acceso al WiFi.`
            );
          }
        }
      } catch (err) {
        console.error('[HealthCheck Error]', err);
      }
    });

    // ----------------------------------------------------
    // RECOLECTOR DE ENERGÍA - Cada 5 Minutos
    // ----------------------------------------------------
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('[Cron] Ejecutando recolección de energía...');
        const [dispositivos] = await this.fastify.mysql.query(
          `SELECT d.ip_local, d.nombre, d.usuario_id, 
                  u.notif_activas, u.notif_alto_consumo, u.limite_alto_consumo_watts, u.actualizacion_automatica 
           FROM dispositivos d 
           JOIN usuarios u ON d.usuario_id = u.id 
           WHERE d.ip_local IS NOT NULL`
        );

        if (!dispositivos || dispositivos.length === 0) {
            return;
        }

        const currentMonthString = meses[new Date().getMonth()];
        const currentYear = new Date().getFullYear();

        for (const disp of dispositivos) {
          if (!disp.usuario_id) continue;
          
          // Si el usuario desactivó la actualización automática, saltamos este dispositivo
          if (!disp.actualizacion_automatica) continue;

          try {
            // Request data with 5 seconds timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const res = await fetch(`http://${disp.ip_local}/api/status`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) continue;

            const data = await res.json();
            const watts = data.power || 0;
            const anomalyDetected = data.anomaly_detected || false;

            // --- Lógica de Notificaciones ---
            if (disp.notif_activas) {
                if (anomalyDetected) {
                    await crearNotificacion(
                        this.fastify, 
                        disp.usuario_id, 
                        'Anomalía Eléctrica', 
                        `El dispositivo "${disp.nombre}" detectó un comportamiento inusual (consumo fuera de perfil).`
                    );
                }

                if (disp.notif_alto_consumo && watts > disp.limite_alto_consumo_watts) {
                    await crearNotificacion(
                        this.fastify, 
                        disp.usuario_id, 
                        'Alto Consumo', 
                        `El dispositivo "${disp.nombre}" está consumiendo ${watts.toFixed(1)}W, superando tu límite de ${disp.limite_alto_consumo_watts}W.`
                    );
                }
            }
            // --------------------------------

            if (watts <= 0) continue;

            // (Watts / 1000) = kW * (5/60 horas) = kWh
            const kwhConsumidos = (watts / 1000) * (5 / 60);

            // Fetch current record for this user and month
            const [rows] = await this.fastify.mysql.query(
              'SELECT id, kwh FROM consumo_mensual WHERE usuario_id = ? AND mes = ? AND anio = ?',
              [disp.usuario_id, currentMonthString, currentYear]
            );

            if (rows.length > 0) {
              const currentKwh = Number(rows[0].kwh);
              const newKwh = currentKwh + kwhConsumidos;
              
              // Calcular el costo exacto con la tarifa escalonada completa para los kWh totales
              const newCosto = calcularCostoCFE(newKwh);

              await this.fastify.mysql.query(
                'UPDATE consumo_mensual SET kwh = ?, costo = ? WHERE id = ?',
                [newKwh, newCosto, rows[0].id]
              );
            } else {
              const newCosto = calcularCostoCFE(kwhConsumidos);
              await this.fastify.mysql.query(
                'INSERT INTO consumo_mensual (mes, anio, kwh, costo, usuario_id) VALUES (?, ?, ?, ?, ?)',
                [currentMonthString, currentYear, kwhConsumidos, newCosto, disp.usuario_id]
              );
            }
          } catch (e) {
            // Ignorar dispositivos que no responden, el Health Check de 1 minuto se encarga de esto
          }
        }
      } catch (err) {
        console.error('[Cron Error]', err);
      }
    });
  }
}

module.exports = CronService;
