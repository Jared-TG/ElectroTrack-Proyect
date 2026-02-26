// mobile/app/services/historialService.ts
import { API_URL } from '../config/api.config';

export interface MonthData {
    id: number;
    mes: string;
    anio: number;
    kwh: number;
    costo: number;
}

export async function getHistorial(): Promise<MonthData[]> {
    const res = await fetch(`${API_URL}/historial`);
    if (!res.ok) throw new Error('Error al cargar historial');
    const data = await res.json();

    // MySQL DECIMAL viene como string, convertir a número
    return data.map((item: any) => ({
        ...item,
        kwh: Number(item.kwh),
        costo: Number(item.costo),
    }));
}
