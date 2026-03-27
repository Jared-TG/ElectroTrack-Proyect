// mobile/app/services/localDeviceService.ts
// Servicio CRUD para dispositivos almacenados localmente en SQLite
import { getDb } from './database';

export interface LocalDispositivo {
  id?: number;
  qr_code: string;
  nombre: string;
  icono: string | null;
  tipo: string;
  modelo: string | null;
  serial: string | null;
  estado: string;
  watts: number;
  synced: number;
  added_at?: string;
}

/**
 * Agrega un dispositivo escaneado a la base de datos local.
 * Si ya existe (mismo qr_code), no lo duplica.
 */
export async function addLocalDevice(device: Omit<LocalDispositivo, 'id' | 'synced' | 'added_at'>): Promise<boolean> {
  const db = getDb();

  try {
    await db.runAsync(
      `INSERT OR IGNORE INTO mis_dispositivos (qr_code, nombre, icono, tipo, modelo, serial, estado, watts, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        device.qr_code,
        device.nombre,
        device.icono ?? null,
        device.tipo || 'general',
        device.modelo ?? null,
        device.serial ?? null,
        device.estado || 'en_espera',
        device.watts || 0,
      ]
    );
    console.log('[SQLite] Dispositivo agregado:', device.qr_code);
    return true;
  } catch (error) {
    console.error('[SQLite] Error al agregar dispositivo:', error);
    return false;
  }
}

/**
 * Obtiene todos los dispositivos almacenados localmente.
 */
export async function getLocalDevices(): Promise<LocalDispositivo[]> {
  const db = getDb();

  try {
    const result = await db.getAllAsync<LocalDispositivo>(
      'SELECT * FROM mis_dispositivos ORDER BY added_at DESC'
    );
    return result;
  } catch (error) {
    console.error('[SQLite] Error al obtener dispositivos:', error);
    return [];
  }
}

/**
 * Elimina un dispositivo local por su qr_code.
 */
export async function deleteLocalDevice(qrCode: string): Promise<boolean> {
  const db = getDb();

  try {
    await db.runAsync(
      'DELETE FROM mis_dispositivos WHERE qr_code = ?',
      [qrCode]
    );
    console.log('[SQLite] Dispositivo eliminado:', qrCode);
    return true;
  } catch (error) {
    console.error('[SQLite] Error al eliminar dispositivo:', error);
    return false;
  }
}

/**
 * Obtiene los dispositivos que aún no se han sincronizado con el servidor.
 */
export async function getUnsyncedDevices(): Promise<LocalDispositivo[]> {
  const db = getDb();

  try {
    const result = await db.getAllAsync<LocalDispositivo>(
      'SELECT * FROM mis_dispositivos WHERE synced = 0'
    );
    return result;
  } catch (error) {
    console.error('[SQLite] Error al obtener dispositivos no sincronizados:', error);
    return [];
  }
}

/**
 * Marca un dispositivo como sincronizado con el servidor.
 */
export async function markAsSynced(qrCode: string): Promise<boolean> {
  const db = getDb();

  try {
    await db.runAsync(
      'UPDATE mis_dispositivos SET synced = 1 WHERE qr_code = ?',
      [qrCode]
    );
    console.log('[SQLite] Dispositivo marcado como sincronizado:', qrCode);
    return true;
  } catch (error) {
    console.error('[SQLite] Error al marcar como sincronizado:', error);
    return false;
  }
}
