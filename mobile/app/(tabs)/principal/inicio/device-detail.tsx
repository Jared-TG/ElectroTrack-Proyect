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
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RealtimeChart from '@/components/RealtimeChart';
import { API_URL } from '@/app/config/api.config';
import { useAlert } from '@/app/context/AlertContext';
import BLESetupModal from '@/app/components/BLESetupModal';
import OnlineWiFiModal from '@/app/components/OnlineWiFiModal';
import ConfirmRelayModal from '@/app/components/ConfirmRelayModal';
import ConfirmDeleteModal from '@/app/components/ConfirmDeleteModal';

// Catálogo de perfiles de consumo eléctrico por tipo de aparato
const DEVICE_PROFILES: Record<string, { device_type: string; standby_power_max: number; active_power_min: number; active_power_max: number } | null> = {
    tv:        { device_type: 'tv',        standby_power_max: 1.0,  active_power_min: 60,  active_power_max: 200 },
    laptop:    { device_type: 'laptop',    standby_power_max: 0.5,  active_power_min: 20,  active_power_max: 100 },
    fan:       { device_type: 'fan',       standby_power_max: 0.5,  active_power_min: 25,  active_power_max: 75 },
    phone:     { device_type: 'phone',     standby_power_max: 0.0,  active_power_min: 5,   active_power_max: 25 },
    ac:        { device_type: 'ac',        standby_power_max: 2.0,  active_power_min: 500, active_power_max: 2000 },
    microwave: { device_type: 'microwave', standby_power_max: 0.5,  active_power_min: 800, active_power_max: 1500 },
    fridge:    { device_type: 'fridge',    standby_power_max: 2.0,  active_power_min: 80,  active_power_max: 350 },
    bulb:      { device_type: 'bulb',      standby_power_max: 0.0,  active_power_min: 3,   active_power_max: 20 },
    wifi:      { device_type: 'wifi',      standby_power_max: 0.0,  active_power_min: 5,   active_power_max: 20 },
    settings:  null, // "Otro" — sin perfil, no evalúa anomalías
};

const DEVICE_ICONS = [
    { key: 'tv', label: 'TV', component: (color: string) => <Ionicons name="tv-outline" size={26} color={color} /> },
    { key: 'laptop', label: 'Laptop', component: (color: string) => <Ionicons name="laptop-outline" size={26} color={color} /> },
    { key: 'fan', label: 'Ventilador', component: (color: string) => <Ionicons name="snow-outline" size={26} color={color} /> },
    { key: 'phone', label: 'Celular', component: (color: string) => <Ionicons name="phone-portrait-outline" size={26} color={color} /> },
    { key: 'ac', label: 'A/C', component: (color: string) => <Ionicons name="thermometer-outline" size={26} color={color} /> },
    { key: 'microwave', label: 'Microondas', component: (color: string) => <Ionicons name="fast-food-outline" size={26} color={color} /> },
    { key: 'fridge', label: 'Refrigerador', component: (color: string) => <Ionicons name="snow-outline" size={26} color={color} /> },
    { key: 'bulb', label: 'Foco', component: (color: string) => <Ionicons name="bulb-outline" size={26} color={color} /> },
    { key: 'wifi', label: 'Router', component: (color: string) => <Ionicons name="wifi-outline" size={26} color={color} /> },
    { key: 'settings', label: 'Otro', component: (color: string) => <Ionicons name="options-outline" size={26} color={color} /> },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 40;
const MAX_POINTS = 60;
const POLL_INTERVAL = 3000; // 3 segundos

interface DataPoint {
    x: number;
    y: number;
}

interface RealtimeData {
    timestamp:   string;
    watts:       number;
    voltaje:     number;
    corriente:   number;
    kwh_total:   number;
    frecuencia:  number;   // Hz
    factor_pot:  number;   // 0-1
    relay_state: string;   // "ON" | "OFF"
    anomaly:     boolean;  // anomalía detectada
    ip_local?:   string;   // IP local para comandos directos
}

export default function DeviceDetailScreen() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { qr_code, nombre: initNombre, icono: initIcono, watts: initialWatts, id, relay_state } = useLocalSearchParams<{
        qr_code: string;
        nombre: string;
        icono: string;
        watts: string;
        id: string;
        relay_state?: string;
    }>();

    const [displayNombre, setDisplayNombre] = useState(initNombre || 'Dispositivo');
    const [displayIcono, setDisplayIcono] = useState(initIcono || 'tv');

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editNombre, setEditNombre] = useState(initNombre || '');
    const [editIcono, setEditIcono] = useState(initIcono || 'tv');
    const [isUpdating, setIsUpdating] = useState(false);
    const [bleModalVisible, setBleModalVisible] = useState(false);
    const [onlineWifiModalVisible, setOnlineWifiModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [pendingState, setPendingState] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const [isOn, setIsOn] = useState(relay_state !== 'false');
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [currentData, setCurrentData] = useState<RealtimeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pointCounter = useRef(0);
    const isToggling = useRef(false);

    const handleUpdateDevice = async () => {
        if (!editNombre.trim()) {
            showAlert({ type: 'error', title: 'Error', message: 'El nombre es requerido' });
            return;
        }
        setIsUpdating(true);
        try {
            // 1. Guardar nombre e icono en la base de datos (AWS)
            const res = await fetch(`${API_URL}/dispositivos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: editNombre.trim(), icono: editIcono }),
            });
            if (!res.ok) throw new Error('Error al actualizar en servidor');
            
            // 2. Enviar el Perfil de Consumo DIRECTAMENTE al ESP32 (Red Local)
            if (currentData?.ip_local && DEVICE_PROFILES[editIcono]) {
                try {
                    await fetch(`http://${currentData.ip_local}/api/update_profile`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(DEVICE_PROFILES[editIcono]),
                    });
                    console.log("Perfil inyectado exitosamente en el ESP32 (Local)");
                } catch (e) {
                    // Fallo silencioso: el usuario no estaba en la misma red
                    console.log("No se pudo contactar al ESP32 localmente:", e);
                }
            } else if (currentData?.ip_local && editIcono === 'settings') {
                // Si eligió "Otro", podemos enviar un perfil vacío o ignorar
                try {
                    await fetch(`http://${currentData.ip_local}/api/update_profile`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ device_type: 'Ninguno' }),
                    });
                } catch (e) {}
            }

            setDisplayNombre(editNombre.trim());
            setDisplayIcono(editIcono);
            setEditModalVisible(false);
            showAlert({ type: 'success', title: 'Éxito', message: 'Dispositivo actualizado correctamente' });
        } catch(err: any) {
            showAlert({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setIsUpdating(false);
        }
    };

    // Polling para datos en tiempo real
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/dispositivos/${qr_code}/realtime`);
                if (!res.ok) throw new Error('Error al obtener datos');
                const data: RealtimeData = await res.json();

                if (!isMounted) return;

                setCurrentData(data);
                if (data.relay_state !== undefined && !isToggling.current) {
                    setIsOn(data.relay_state === true || data.relay_state === 'ON');
                }
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
    }, [qr_code]);

    const handleToggle = async () => {
        const newState = !isOn;
        setPendingState(newState);
        setConfirmModalVisible(true);
    };

    const executeToggle = async () => {
        const newState = pendingState;
        setIsOn(newState);
        isToggling.current = true;

        // Controlar el relé físico via backend
        try {
            const res = await fetch(`${API_URL}/dispositivos/${qr_code}/relay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: newState ? 'ON' : 'OFF' }),
            });
            if (!res.ok) throw new Error('Error al cambiar estado del relé');
            showAlert({
                type: 'success',
                title: newState ? 'Encendido' : 'Apagado',
                message: `El dispositivo se ha ${newState ? 'encendido' : 'apagado'} correctamente.`,
            });
        } catch (e: any) {
            console.error('[Relay] Error al cambiar estado:', e);
            setIsOn(!newState); // revertir
            showAlert({
                type: 'error',
                title: 'Error',
                message: 'No se pudo cambiar el estado del relé. Verifica que el dispositivo esté en línea.',
            });
        } finally {
            // Permitir que el polling actualice el estado de nuevo después de un breve delay
            // para asegurar que la DB ya tiene el nuevo estado.
            setTimeout(() => {
                isToggling.current = false;
            }, 2000);
        }
    };

    const confirmDeleteDevice = () => {
        setDeleteModalVisible(true);
    };

    const executeDelete = async () => {
        try {
            const res = await fetch(`${API_URL}/dispositivos/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Error al eliminar');
            
            showAlert({ type: 'success', title: 'Eliminado', message: 'El dispositivo ha sido eliminado correctamente.' });
            router.back();
        } catch (e) {
            console.error('[Delete] Error:', e);
            showAlert({ type: 'error', title: 'Error', message: 'No se pudo eliminar el dispositivo.' });
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={confirmDeleteDevice} style={[styles.backButton, { marginRight: 15 }]}>
                            <Ionicons name="trash-outline" size={24} color="#FF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            setEditNombre(displayNombre);
                            setEditIcono(displayIcono);
                            setEditModalVisible(true);
                        }} style={styles.backButton}>
                            <Ionicons name="create-outline" size={24} color="#FFD700" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Desempeño del equipo</Text>

                {/* Real-time watts label */}
                <Text style={styles.wattsLabel}>
                    Consumo en tiempo real{' '}
                    <Text style={styles.wattsValue}>
                        {currentData?.watts != null ? currentData.watts.toFixed(1) : '--'}
                    </Text>
                    {' '}Watts
                </Text>

                {/* Chart */}
                <View style={styles.chartContainer}>
                    {loading ? (
                        <View style={styles.loadingChart}>
                            <ActivityIndicator size="large" color="#FFD700" />
                            <Text style={styles.loadingText}>Conectando al dispositivo...</Text>
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

                {/* Stats Row — Voltaje, Corriente, kWh */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Voltaje</Text>
                        <Text style={styles.statValue}>
                            {currentData?.voltaje != null ? `${currentData.voltaje.toFixed(1)}V` : '--'}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#FFD700' }]}>Corriente</Text>
                        <Text style={[styles.statValue, { color: '#FFD700' }]}>
                            {currentData?.corriente != null ? `${currentData.corriente.toFixed(3)}A` : '--'}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total kWh</Text>
                        <Text style={[styles.statValue, { color: '#FFD700' }]}>
                            {currentData?.kwh_total != null ? currentData.kwh_total.toFixed(3) : '--'}
                        </Text>
                    </View>
                </View>

                {/* Stats Row 2 — Frecuencia y Factor de Potencia */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Frecuencia</Text>
                        <Text style={styles.statValue}>
                            {currentData?.frecuencia != null ? `${currentData.frecuencia.toFixed(1)} Hz` : '--'}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Factor Pot.</Text>
                        <Text style={[styles.statValue, { color: '#FFD700' }]}>
                            {currentData?.factor_pot != null ? currentData.factor_pot.toFixed(2) : '--'}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Anom.</Text>
                        <Text style={[styles.statValue, {
                            color: currentData?.anomaly ? '#FF4444' : '#44FF88'
                        }]}>
                            {currentData != null ? (currentData.anomaly ? 'SI' : 'NO') : '--'}
                        </Text>
                    </View>
                </View>

                {/* Toggle Switch */}
                <View style={styles.toggleContainer}>
                    <View style={[styles.togglePill, { backgroundColor: isOn ? '#B8960A' : '#2A2A2A' }]}>
                        <Text style={[styles.toggleLabel, { color: isOn ? '#000' : '#AAA' }]}>
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
                <Text style={styles.deviceNameLabel}>{displayNombre}</Text>
            </ScrollView>

            <BLESetupModal 
                visible={bleModalVisible} 
                onClose={() => setBleModalVisible(false)} 
                onSuccess={() => {
                    setBleModalVisible(false);
                    showAlert({ type: 'success', title: 'Configuración exitosa', message: 'El Wi-Fi se ha actualizado por Bluetooth correctamente.' });
                }} 
            />

            <OnlineWiFiModal 
                visible={onlineWifiModalVisible}
                onClose={() => setOnlineWifiModalVisible(false)}
                deviceId={id as string}
                deviceIp={currentData?.ip_local}
                onSuccess={() => {
                    setOnlineWifiModalVisible(false);
                    showAlert({ type: 'success', title: 'Éxito', message: 'Wi-Fi actualizado correctamente' });
                }}
            />

            <ConfirmRelayModal 
                visible={confirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={executeToggle}
                deviceName={displayNombre}
                isTurningOn={pendingState}
            />

            <ConfirmDeleteModal
                visible={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={executeDelete}
                deviceName={displayNombre}
            />

            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <ScrollView contentContainerStyle={styles.modalScrollContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#FFD700" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>EDITAR</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <Text style={styles.label}>Selecciona un ícono</Text>
                        <View style={styles.iconsRow}>
                            {DEVICE_ICONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon.key}
                                    style={[
                                        styles.iconOption,
                                        editIcono === icon.key && styles.iconOptionSelected,
                                    ]}
                                    onPress={() => setEditIcono(icon.key)}
                                >
                                    {icon.component(editIcono === icon.key ? '#FFD700' : '#888')}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Nombre del dispositivo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Televisión"
                            placeholderTextColor="#666"
                            value={editNombre}
                            onChangeText={setEditNombre}
                        />

                        <TouchableOpacity
                            style={[styles.vincularButton, isUpdating && styles.vincularButtonDisabled]}
                            onPress={handleUpdateDevice}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.vincularText}>Guardar Cambios</Text>
                            )}
                        </TouchableOpacity>

                        <View style={{ marginTop: 40, paddingHorizontal: 20 }}>
                            <Text style={[styles.label, { paddingHorizontal: 0 }]}>¿Problemas de conexión?</Text>
                            <Text style={{ color: '#888', marginBottom: 16, fontSize: 13 }}>
                                Si cambiaste la contraseña de tu internet o el dispositivo no se conecta, presiona aquí para volver a enviarle el Wi-Fi por Bluetooth.
                            </Text>
                            <TouchableOpacity
                                style={styles.wifiButton}
                                onPress={() => {
                                    setEditModalVisible(false);
                                    setTimeout(() => {
                                        // Si tenemos datos actuales y no hay error, el dispositivo está conectado (Online)
                                        if (currentData && !error) {
                                            setOnlineWifiModalVisible(true);
                                        } else {
                                            // Si hay error o no responde, asumimos que está Offline y usamos Bluetooth
                                            setBleModalVisible(true);
                                        }
                                    }, 500);
                                }}
                            >
                                <Ionicons name="wifi" size={20} color="#000" />
                                <Text style={styles.vincularText}>Actualizar Wi-Fi del equipo</Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </Modal>
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
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalScrollContent: {
        paddingBottom: 40,
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    label: {
        fontSize: 14,
        color: '#AAA',
        fontFamily: 'Inter_500Medium',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    iconsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 24,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        borderWidth: 1.5,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconOptionSelected: {
        borderColor: '#FFD700',
        backgroundColor: '#1A1A00',
    },
    input: {
        marginHorizontal: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        padding: 16,
        fontSize: 15,
        color: '#FFF',
        fontFamily: 'Inter_400Regular',
        marginBottom: 32,
    },
    vincularButton: {
        marginHorizontal: 20,
        backgroundColor: '#B8960A',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    wifiButton: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vincularButtonDisabled: {
        opacity: 0.6,
    },
    vincularText: {
        fontSize: 16,
        fontFamily: 'Inter_700Bold',
        color: '#000',
    },
});
