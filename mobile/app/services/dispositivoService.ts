// mobile/app/services/dispositivoService.ts
// Servicio para dispositivos — combina API remota (MySQL) con local (SQLite)
import { API_URL } from '../config/api.config';
import { getUnsyncedDevices, markAsSynced } from './localDeviceService';

export interface Dispositivo {
    id: number;
    qr_code: string;
    nombre: string;
    icono: string | null;
    tipo: string;
    modelo: string | null;
    serial: string | null;
    estado: 'en_linea' | 'en_espera';
    online: boolean;
    watts: number;
    usuario_id?: number;
}

/**
 * Obtiene los dispositivos del servidor, opcionalmente filtrados por usuario.
 */
export async function getDispositivos(usuarioId?: number): Promise<Dispositivo[]> {
    let url = `${API_URL}/dispositivos`;
    if (usuarioId) {
        url += `?usuario_id=${usuarioId}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar dispositivos');
    const data = await res.json();

    return data.map((item: any) => ({
        ...item,
        watts: Number(item.watts),
        online: Boolean(item.online),
    }));
}

/**
 * Busca un dispositivo en el servidor por su código QR.
 */
export async function getDispositivoByQR(qrCode: string): Promise<Dispositivo | null> {
    try {
        const res = await fetch(`${API_URL}/dispositivos/qr/${encodeURIComponent(qrCode)}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Error al buscar dispositivo');
        return res.json();
    } catch (error) {
        console.error('[API] Error al buscar por QR:', error);
        return null;
    }
}

/**
 * Crea un nuevo dispositivo en el servidor.
 */
export async function createDispositivo(
    dispositivo: Omit<Dispositivo, 'id'>
): Promise<Dispositivo> {
    const res = await fetch(`${API_URL}/dispositivos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispositivo),
    });
    if (!res.ok) throw new Error('Error al crear dispositivo');
    return res.json();
}

/**
 * Vincula un dispositivo (escaneado por QR) a un usuario en el servidor.
 */
export async function vincularDispositivo(
    qrCode: string,
    usuarioId: number,
    deviceData?: Partial<Dispositivo>
): Promise<Dispositivo> {
    const res = await fetch(`${API_URL}/dispositivos/vincular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            qr_code: qrCode,
            usuario_id: usuarioId,
            ...deviceData,
        }),
    });
    if (!res.ok) throw new Error('Error al vincular dispositivo');
    return res.json();
}

/**
 * Sincroniza los dispositivos locales pendientes con el servidor.
 * Intenta subir cada dispositivo no sincronizado a MySQL.
 */
export async function syncDevicesToServer(usuarioId: number): Promise<number> {
    const unsynced = await getUnsyncedDevices();
    let syncedCount = 0;

    for (const device of unsynced) {
        try {
            await vincularDispositivo(device.qr_code, usuarioId, {
                nombre: device.nombre,
                icono: device.icono,
                tipo: device.tipo,
                modelo: device.modelo,
                serial: device.serial,
                watts: device.watts,
            });
            await markAsSynced(device.qr_code);
            syncedCount++;
        } catch (error) {
            console.error(`[Sync] Error al sincronizar ${device.qr_code}:`, error);
            // Continúa con el siguiente — se reintentará después
        }
    }

    if (syncedCount > 0) {
        console.log(`[Sync] ${syncedCount} dispositivo(s) sincronizado(s)`);
    }

    return syncedCount;
}
