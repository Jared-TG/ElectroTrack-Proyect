import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RealtimeChart from '@/components/RealtimeChart';
import { API_URL } from '@/app/config/api.config';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 40;
const MAX_POINTS = 60;
const POLL_INTERVAL = 2000; // 2 segundos

interface DataPoint {
    x: number;
    y: number;
}

interface RealtimeData {
    timestamp: string;
    watts: number;
    voltaje: number;
    corriente: number;
    kwh_total: number;
}

export default function DeviceDetailScreen() {
    const router = useRouter();
    const { qr_code, nombre, icono, watts: initialWatts } = useLocalSearchParams<{
        qr_code: string;
        nombre: string;
        icono: string;
        watts: string;
    }>();

    const [isOn, setIsOn] = useState(true);
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [currentData, setCurrentData] = useState<RealtimeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pointCounter = useRef(0);

    // Polling para datos en tiempo real
    useEffect(() => {
        if (!isOn) return;

        let isMounted = true;

        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/dispositivos/${qr_code}/realtime`);
                if (!res.ok) throw new Error('Error al obtener datos');
                const data: RealtimeData = await res.json();

                if (!isMounted) return;

                setCurrentData(data);
                setLoading(false);
                setError(null);

                setChartData(prev => {
                    const newPoint = { x: pointCounter.current, y: data.watts };
                    pointCounter.current += 2; // cada punto = 2 segundos
                    const updated = [...prev, newPoint];
                    // Sliding window: mantener solo los últimos MAX_POINTS
                    if (updated.length > MAX_POINTS) {
                        return updated.slice(updated.length - MAX_POINTS);
                    }
                    return updated;
                });
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Error de conexión');
                    setLoading(false);
                }
            }
        };

        // Primera carga inmediata
        fetchData();

        // Polling cada POLL_INTERVAL
        const interval = setInterval(fetchData, POLL_INTERVAL);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isOn, qr_code]);

    const handleToggle = () => {
        setIsOn(prev => !prev);
        if (isOn) {
            // Al apagar, limpiar datos del chart
            setChartData([]);
            pointCounter.current = 0;
            setCurrentData(null);
            setLoading(true);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>ELECTROTRACK</Text>
                    <View style={{ width: 32 }} />
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Desempeño del equipo</Text>

                {/* Real-time watts label */}
                <Text style={styles.wattsLabel}>
                    Consumo en tiempo real{' '}
                    <Text style={styles.wattsValue}>
                        {currentData ? currentData.watts : '--'}
                    </Text>
                    , Watts
                </Text>

                {/* Chart */}
                <View style={styles.chartContainer}>
                    {loading ? (
                        <View style={styles.loadingChart}>
                            <ActivityIndicator size="large" color="#FFD700" />
                            <Text style={styles.loadingText}>Conectando...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.loadingChart}>
                            <Ionicons name="alert-circle-outline" size={32} color="#FF4444" />
                            <Text style={[styles.loadingText, { color: '#FF4444' }]}>{error}</Text>
                        </View>
                    ) : (
                        <RealtimeChart
                            data={chartData}
                            width={CHART_WIDTH}
                            height={220}
                            lineColor="#FFD700"
                        />
                    )}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Voltaje</Text>
                        <Text style={styles.statValue}>
                            ({currentData ? `${currentData.voltaje}V` : '--'})
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#FFD700' }]}>Corriente</Text>
                        <Text style={[styles.statValue, { color: '#FFD700' }]}>
                            ({currentData ? `${currentData.corriente}A` : '--'})
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total kWh</Text>
                        <Text style={[styles.statValue, { color: '#FFD700' }]}>
                            {currentData ? currentData.kwh_total : '--'}
                        </Text>
                    </View>
                </View>

                {/* Toggle Switch */}
                <View style={styles.toggleContainer}>
                    <View style={styles.togglePill}>
                        <Text style={styles.toggleLabel}>
                            {isOn ? 'Encendido' : 'Apagado'}
                        </Text>
                        <Switch
                            value={isOn}
                            onValueChange={handleToggle}
                            trackColor={{ false: '#333', true: '#000' }}
                            thumbColor={isOn ? '#FFF' : '#666'}
                            ios_backgroundColor="#333"
                        />
                    </View>
                </View>

                {/* Device name */}
                <Text style={styles.deviceNameLabel}>{nombre || 'Dispositivo'}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingBottom: 40,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
        letterSpacing: 1.5,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
        color: '#FFD700',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    wattsLabel: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#AAA',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    wattsValue: {
        color: '#FFF',
        fontFamily: 'Inter_600SemiBold',
    },
    chartContainer: {
        marginHorizontal: 20,
        backgroundColor: '#0D0D0D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#222',
        padding: 8,
        marginBottom: 24,
        minHeight: 220,
        justifyContent: 'center',
    },
    loadingChart: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
        color: '#AAA',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 40,
    },
    togglePill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: '#B8960A',
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: '#000000',
        paddingVertical: 14,
        paddingHorizontal: 40,
        width: '100%',
    },
    toggleLabel: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        color: '#000',
    },
    deviceNameLabel: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#666',
        marginTop: 8,
    },
});
