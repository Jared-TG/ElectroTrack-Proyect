import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import { useFocusEffect } from 'expo-router';

export interface Notificacion {
    id: number;
    usuario_id: number;
    titulo: string;
    mensaje: string;
    leida: number;
    fecha: string;
}

export function useNotificaciones() {
    const { user } = useAuth();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotificaciones = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`${API_URL}/notificaciones?usuario_id=${user.id}`);
            if (res.ok) {
                const data: Notificacion[] = await res.json();
                setNotificaciones(data);
                setUnreadCount(data.filter(n => n.leida === 0).length);
            }
        } catch (e) {
            console.error('Error fetching notificaciones', e);
        }
    }, [user?.id]);

    const marcarLeidas = useCallback(async () => {
        if (!user?.id || unreadCount === 0) return;
        try {
            // Optimistic update
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: 1 })));
            setUnreadCount(0);

            await fetch(`${API_URL}/notificaciones/marcar-leidas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
            });
        } catch (e) {
            console.error('Error marking as read', e);
            fetchNotificaciones(); // revert
        }
    }, [user, API_URL, fetchNotificaciones]);

    const marcarUnaLeida = useCallback(async (id: number) => {
        if (!user) return;
        try {
            setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: 1 } : n));

            await fetch(`${API_URL}/notificaciones/${id}/marcar-leida`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
            });
        } catch (e) {
            console.error('Error marking one as read', e);
            fetchNotificaciones(); // revert
        }
    }, [user, API_URL, fetchNotificaciones]);

    const borrarNotificacion = useCallback(async (id: number) => {
        if (!user) return;
        try {
            setNotificaciones(prev => prev.filter(n => n.id !== id));

            await fetch(`${API_URL}/notificaciones/${id}?usuario_id=${user.id}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.error('Error deleting notification', e);
            fetchNotificaciones(); // revert
        }
    }, [user, API_URL, fetchNotificaciones]);

    const borrarTodas = useCallback(async () => {
        if (!user) return;
        try {
            setNotificaciones([]);

            await fetch(`${API_URL}/notificaciones?usuario_id=${user.id}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.error('Error deleting all notifications', e);
            fetchNotificaciones(); // revert
        }
    }, [user, API_URL, fetchNotificaciones]);

    useFocusEffect(
        useCallback(() => {
            fetchNotificaciones();
        }, [fetchNotificaciones])
    );

    return { 
        notificaciones, 
        unreadCount, 
        fetchNotificaciones, 
        marcarLeidas,
        marcarUnaLeida,
        borrarNotificacion,
        borrarTodas 
    };
}
