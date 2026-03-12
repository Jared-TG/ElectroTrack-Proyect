// mobile/app/services/dispositivoService.ts
import { API_URL } from '../config/api.config';

export interface Dispositivo {
    id: number;
    nombre: string;
    icono: string;
    estado: 'en_linea' | 'en_espera';
    online: boolean;
    watts: number;
}

export async function getDispositivos(): Promise<Dispositivo[]> {
    const res = await fetch(`${API_URL}/dispositivos`);
    if (!res.ok) throw new Error('Error al cargar dispositivos');
    const data = await res.json();

    return data.map((item: any) => ({
        ...item,
        watts: Number(item.watts),
        online: Boolean(item.online),
    }));
}

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
