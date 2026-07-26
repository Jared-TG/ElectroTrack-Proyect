// mobile/app/hooks/useHistorial.ts
import { useState, useEffect } from 'react';
import { getHistorial, MonthData } from '../services/historialService';
import { useAuth } from '../context/AuthContext';

export function useHistorial() {
    const { user } = useAuth();
    const [months, setMonths] = useState<MonthData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);
        getHistorial(user.id)
            .then(setMonths)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [user?.id]);

    const totalKwh = months.reduce((sum, m) => sum + Number(m.kwh), 0);
    const totalCost = months.reduce((sum, m) => sum + Number(m.costo), 0);
    const avgKwh = months.length ? Math.round(totalKwh / months.length) : 0;

    return { months, totalKwh, totalCost, avgKwh, loading, error };
}
