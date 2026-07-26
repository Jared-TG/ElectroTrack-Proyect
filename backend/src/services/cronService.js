const cron = require('node-cron');

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

class CronService {
  constructor(fastify) {
    this.fastify = fastify;
  }

  start() {
    console.log('[Cron] Inicializando recolector de consumo (cada 5 minutos)...');
    
    // Ejecutar cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('[Cron] Ejecutando recolección de energía...');
        const [dispositivos] = await this.fastify.mysql.query(
          'SELECT ip_local, usuario_id FROM dispositivos WHERE ip_local IS NOT NULL'
        );

        if (!dispositivos || dispositivos.length === 0) {
            return;
        }

        const currentMonthString = meses[new Date().getMonth()];
        const currentYear = new Date().getFullYear();

        for (const disp of dispositivos) {
          if (!disp.usuario_id) continue;

          try {
            // Request data with 5 seconds timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const res = await fetch(`http://${disp.ip_local}/api/status`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) continue;

            const data = await res.json();
            const watts = data.power || 0;

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
            // Ignorar dispositivos que no responden
          }
        }
      } catch (err) {
        console.error('[Cron Error]', err);
      }
    });
  }
}

module.exports = CronService;
