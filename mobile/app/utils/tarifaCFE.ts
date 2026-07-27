// Tarifa CFE de México — cálculo por escalones
// Fuente: Comisión Federal de Electricidad — Tarifa Doméstica

const TARIFA = {
  basico: 0.75,         // Precio por kWh (Escalón Básico)
  intermedioBajo: 0.94, // Precio por kWh (Escalón Intermedio Bajo)
  intermedioAlto: 2.29, // Precio por kWh (Escalón Intermedio Alto)
  excedente: 3.60,      // Precio por kWh (Escalón Excedente)
  iva: 0.16,            // 16% de IVA
};

const LIMITES = {
  basico: 300,     // kWh — límite del escalón básico
  intBajo: 1200,   // kWh — límite del escalón intermedio bajo
  intAlto: 2500,   // kWh — límite del escalón intermedio alto
};

/**
 * Calcula el costo mensual estimado de energía usando la tarifa CFE de México.
 * @param consumoTotalKwh - Consumo total estimado del mes en kWh
 * @returns Costo total con IVA incluido en MXN
 */
export function calcularCostoCFE(consumoTotalKwh: number): number {
  let subtotal = 0;

  if (consumoTotalKwh <= 0) {
    return 0;
  }

  // 1. Escalón Básico (0 a 300 kWh)
  if (consumoTotalKwh <= LIMITES.basico) {
    subtotal = consumoTotalKwh * TARIFA.basico;
  }
  // 2. Escalón Intermedio Bajo (301 a 1200 kWh)
  else if (consumoTotalKwh <= LIMITES.intBajo) {
    subtotal =
      LIMITES.basico * TARIFA.basico +
      (consumoTotalKwh - LIMITES.basico) * TARIFA.intermedioBajo;
  }
  // 3. Escalón Intermedio Alto (1201 a 2500 kWh)
  else if (consumoTotalKwh <= LIMITES.intAlto) {
    subtotal =
      LIMITES.basico * TARIFA.basico +
      (LIMITES.intBajo - LIMITES.basico) * TARIFA.intermedioBajo +
      (consumoTotalKwh - LIMITES.intBajo) * TARIFA.intermedioAlto;
  }
  // 4. Escalón Excedente (Más de 2500 kWh)
  else {
    subtotal =
      LIMITES.basico * TARIFA.basico +
      (LIMITES.intBajo - LIMITES.basico) * TARIFA.intermedioBajo +
      (LIMITES.intAlto - LIMITES.intBajo) * TARIFA.intermedioAlto +
      (consumoTotalKwh - LIMITES.intAlto) * TARIFA.excedente;
  }

  // Agregar 16% de IVA
  const totalConIva = subtotal + subtotal * TARIFA.iva;

  return totalConIva;
}

/**
 * Estima el consumo mensual en kWh a partir de los watts actuales.
 * Asume uso continuo 24/7 durante 30 días (720 horas).
 * @param wattsActuales - Potencia instantánea total en watts
 * @returns kWh estimados por mes
 */
export function estimarKwhMensual(wattsActuales: number): number {
  const HORAS_POR_MES = 720; // 30 días × 24 horas
  return (wattsActuales / 1000) * HORAS_POR_MES;
}

/**
 * Devuelve el costo formateado como string en MXN.
 * Si se provee una tarifa, se calcula el costo usando exclusivamente esa tarifa.
 * @param wattsActuales - Potencia instantánea total en watts
 * @param tarifa - Opcional. Escalón ('basico', 'intermedio', 'excedente')
 * @returns String formateado ej: "$225 MXN"
 */
export function costoEstimadoFormateado(wattsActuales: number, tarifa?: string): string {
  const kwhMensual = estimarKwhMensual(wattsActuales);
  
  if (tarifa) {
    let precioKwh = TARIFA.basico;
    if (tarifa === 'intermedio') precioKwh = 1.61; // Promedio intermedio
    if (tarifa === 'excedente') precioKwh = TARIFA.excedente;

    const costoPlano = kwhMensual * precioKwh * (1 + TARIFA.iva);
    return `$${Math.round(costoPlano)} MXN`;
  }

  const costo = calcularCostoCFE(kwhMensual);
  return `$${Math.round(costo)} MXN`;
}
