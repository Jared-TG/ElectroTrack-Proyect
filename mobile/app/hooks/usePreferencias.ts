import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';

export interface Preferencias {
    notif_activas: boolean;
    notif_alto_consumo: boolean;
    limite_alto_consumo_watts: number;
    actualizacion_automatica: boolean;
}

export function usePreferencias() {
    const { user } = useAuth();
    const [preferencias, setPreferencias] = useState<Preferencias | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPreferencias = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`${API_URL}/usuarios/${user.id}/preferencias`);
            if (res.ok) {
                const data = await res.json();
                setPreferencias({
                    notif_activas: Boolean(data.notif_activas),
                    notif_alto_consumo: Boolean(data.notif_alto_consumo),
                    limite_alto_consumo_watts: data.limite_alto_consumo_watts,
                    actualizacion_automatica: Boolean(data.actualizacion_automatica)
                });
            }
        } catch (e) {
            console.error('Error fetching preferencias', e);
        } finally {
            setLoading(false);
        }
    };

    const updatePreferencia = async (key: keyof Preferencias, value: boolean | number) => {
        if (!user?.id) return;
        
        // Optimistic update
        setPreferencias(prev => prev ? { ...prev, [key]: value } : null);

        try {
            await fetch(`${API_URL}/usuarios/${user.id}/preferencias`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });
        } catch (e) {
            console.error('Error updating preferencia', e);
            // Revert on error
            fetchPreferencias();
        }
    };

    useEffect(() => {
        fetchPreferencias();
    }, [user?.id]);

    return { preferencias, loading, updatePreferencia };
}
