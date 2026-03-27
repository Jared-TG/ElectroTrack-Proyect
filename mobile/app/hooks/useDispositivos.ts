// mobile/app/hooks/useDispositivos.ts
import { useState, useEffect, useCallback } from 'react';
import {
    getDispositivos,
    createDispositivo,
    Dispositivo,
} from '../services/dispositivoService';
import { useAuth } from '../context/AuthContext';

export function useDispositivos() {
    const { user } = useAuth();
    const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDispositivos = useCallback(() => {
        setLoading(true);
        setError(null);
        getDispositivos(user?.id)
            .then(setDispositivos)
            .catch(err => {
                console.warn('Error al cargar dispositivos:', err.message);
                // Si el API no está disponible, mostrar lista vacía en vez de error
                setDispositivos([]);
            })
            .finally(() => setLoading(false));
    }, [user?.id]);

    useEffect(() => {
        fetchDispositivos();
    }, [fetchDispositivos]);

    const addDispositivo = async (data: Omit<Dispositivo, 'id'>) => {
        const newDevice = await createDispositivo({ ...data, usuario_id: user?.id });
        setDispositivos(prev => [newDevice, ...prev]);
        return newDevice;
    };

    return { dispositivos, loading, error, addDispositivo, refresh: fetchDispositivos };
}
