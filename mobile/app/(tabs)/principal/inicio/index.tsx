import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import CircularMeter from '@/components/CircularMeter';
import { useAuth } from '@/app/context/AuthContext';
import { useDispositivos } from '@/app/hooks/useDispositivos';
import { API_URL } from '@/app/config/api.config';
import ConfirmRelayModal from '@/app/components/ConfirmRelayModal';
import { costoEstimadoFormateado } from '@/app/utils/tarifaCFE';
import { useNotificaciones } from '@/app/hooks/useNotificaciones';

export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { dispositivos: devices, refresh } = useDispositivos();

    // Para simplificar la demo, mantendremos un estado local de encendido/apagado para los interruptores
    // En el sistema real esto debería venir del dispositivo (estado 'en_linea' o similar) y enviar comandos por WiFi
    const [toggles, setToggles] = useState<Record<number, boolean>>({});
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<{deviceId: number, deviceName: string, deviceQrCode: string, newState: boolean} | null>(null);

    const [liveTotalWatts, setLiveTotalWatts] = useState(0);
    const [deviceWatts, setDeviceWatts] = useState<Record<number, number>>({});
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Notifications
    const { notificaciones, unreadCount, marcarLeidas } = useNotificaciones();
    const [notifModalVisible, setNotifModalVisible] = useState(false);

    const openNotificaciones = () => {
        setNotifModalVisible(true);
        marcarLeidas();
    };

    // Inicializar toggles cuando cambian los dispositivos (solo la primera vez)
    useEffect(() => {
        setToggles(prev => {
            const newToggles = { ...prev };
            devices.forEach(d => {
                if (newToggles[d.id] === undefined) {
                    newToggles[d.id] = true;
                }
            });
            return newToggles;
        });
    }, [devices]);

    // Polling para datos en tiempo real del dashboard
    const fetchDashboardSummary = useCallback(async () => {
        try {
            const url = user?.id
                ? `${API_URL}/dispositivos/dashboard-summary?usuario_id=${user.id}`
                : `${API_URL}/dispositivos/dashboard-summary`;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();

            setLiveTotalWatts(data.totalWatts || 0);

            // Mapear watts y estado del relay por device id
            const wattsMap: Record<number, number> = {};
            const relayMap: Record<number, boolean> = {};
            
            (data.devices || []).forEach((d: any) => {
                wattsMap[d.id] = d.watts || 0;
                if (d.relay_state !== undefined) {
                    relayMap[d.id] = d.relay_state;
                }
            });
            
            setDeviceWatts(wattsMap);
            setToggles(prev => ({ ...prev, ...relayMap })); // Sincronizar estado real del relevador
        } catch (e) {
            console.warn('[Dashboard] Error al obtener resumen:', e);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            refresh();
            fetchDashboardSummary();

            // Polling cada 3 segundos
            pollRef.current = setInterval(fetchDashboardSummary, 3000);

            return () => {
                if (pollRef.current) clearInterval(pollRef.current);
            };
        }, [refresh, fetchDashboardSummary])
    );

    // Costo estimado usando tarifa CFE de México
    const estimatedCost = costoEstimadoFormateado(liveTotalWatts);

    const toggleDevice = (deviceId: number, deviceName: string, deviceQrCode: string) => {
        const currentState = toggles[deviceId] ?? true;
        const newState = !currentState;

        setPendingToggle({ deviceId, deviceName, deviceQrCode, newState });
        setConfirmModalVisible(true);
    };

    const executeToggle = async () => {
        if (!pendingToggle) return;
        
        const { deviceId, deviceQrCode, newState } = pendingToggle;

        setToggles(prev => ({
            ...prev,
            [deviceId]: newState
        }));

        try {
            const res = await fetch(`${API_URL}/dispositivos/${deviceQrCode}/relay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: newState ? 'ON' : 'OFF' }),
            });
            if (!res.ok) throw new Error('Error');
        } catch (e) {
            console.error('[Relay] Error:', e);
            // Revertir el toggle si falla
            setToggles(prev => ({
                ...prev,
                [deviceId]: !newState
            }));
        }
    };

    const getDeviceIcon = (iconName: string) => {
        switch (iconName) {
            case 'tv':
                return <Ionicons name="tv-outline" size={28} color="#FFD700" />;
            case 'laptop':
                return <Ionicons name="laptop-outline" size={28} color="#FFD700" />;
            case 'camera':
                return <Ionicons name="camera-outline" size={28} color="#FFD700" />;
            case 'headset':
                return <Ionicons name="headset-outline" size={28} color="#FFD700" />;
            case 'wifi':
                return <Ionicons name="wifi-outline" size={28} color="#FFD700" />;
            case 'settings':
                return <Ionicons name="options-outline" size={28} color="#FFD700" />;
            default:
                return <Ionicons name="hardware-chip-outline" size={28} color="#FFD700" />;
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.welcomeText}>
                        Bienvenido, {user?.nombre_usuario || 'Usuario'}
                    </Text>
                    <TouchableOpacity onPress={openNotificaciones} style={styles.bellContainer}>
                        <Ionicons name="notifications-outline" size={28} color="#FFF" />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Medidor Circular */}
                <CircularMeter
                    currentWatts={liveTotalWatts}
                    maxWatts={2000}
                    estimatedCost={estimatedCost}
                />

                {/* Control de Dispositivos */}
                <View style={styles.devicesSection}>
                    <Text style={styles.sectionTitle}>Control de Dispositivos</Text>

                    {devices.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center', opacity: 0.7 }}>
                            <Ionicons name="hardware-chip-outline" size={48} color="#666" style={{ marginBottom: 12 }} />
                            <Text style={{ color: '#FFF', fontFamily: 'Inter_500Medium', textAlign: 'center' }}>
                                No has vinculado ningún dispositivo aún.
                            </Text>
                            <Text style={{ color: '#888', fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8, fontSize: 13 }}>
                                Escanea un código QR desde la pestaña Dispositivos.
                            </Text>
                        </View>
                    ) : (
                        devices.map((device) => {
                            const isOn = toggles[device.id] ?? true;
                            return (
                                <View key={device.id} style={styles.deviceCard}>
                                    <TouchableOpacity
                                        style={styles.deviceLeft}
                                        activeOpacity={0.7}
                                        onPress={() => router.push({
                                            pathname: '/principal/inicio/device-detail' as any,
                                            params: {
                                                id: device.id,
                                                qr_code: device.qr_code,
                                                nombre: device.nombre,
                                                icono: device.icono || 'default',
                                                watts: String((device.watts && device.watts > 0) ? device.watts : 40),
                                            },
                                        })}
                                    >
                                        <View style={styles.iconContainer}>
                                            {getDeviceIcon(device.icono || 'hardware-chip')}
                                        </View>
                                        <View style={styles.deviceInfo}>
                                            <Text style={styles.deviceName}>{device.nombre}</Text>
                                            <Text style={styles.deviceWatts}>
                                                {deviceWatts[device.id] != null && deviceWatts[device.id] > 0
                                                    ? `${deviceWatts[device.id].toFixed(1)}w`
                                                    : '0w'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#555" />
                                    </TouchableOpacity>

                                    <Switch
                                        value={isOn}
                                        onValueChange={() => toggleDevice(device.id, device.nombre, device.qr_code)}
                                        trackColor={{ false: '#333', true: '#FFD700' }}
                                        thumbColor={isOn ? '#FFF' : '#666'}
                                        ios_backgroundColor="#333"
                                    />
                                </View>

                            );
                        })
                    )}
                </View>
            </ScrollView>

            <ConfirmRelayModal 
                visible={confirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={executeToggle}
                deviceName={pendingToggle?.deviceName || ''}
                isTurningOn={pendingToggle?.newState || false}
            />

            {/* Notifications Modal */}
            <Modal
                visible={notifModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setNotifModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notificaciones</Text>
                            <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        {notificaciones.length === 0 ? (
                            <Text style={styles.emptyNotifText}>No tienes notificaciones.</Text>
                        ) : (
                            <FlatList
                                data={notificaciones}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <View style={[styles.notifItem, item.leida === 0 && styles.notifItemUnread]}>
                                        <View style={styles.notifIconContainer}>
                                            <Ionicons 
                                                name={item.titulo.includes('Alto') ? 'warning-outline' : 'flash-outline'} 
                                                size={24} 
                                                color="#FFD700" 
                                            />
                                        </View>
                                        <View style={styles.notifTextContainer}>
                                            <Text style={styles.notifTitle}>{item.titulo}</Text>
                                            <Text style={styles.notifMessage}>{item.mensaje}</Text>
                                            <Text style={styles.notifDate}>
                                                {new Date(item.fecha).toLocaleString('es-MX', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            />
                        )}
                    </View>
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
        paddingBottom: 20,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    welcomeText: {
        fontSize: 18,
        color: '#FFF',
        fontFamily: 'Inter_500Medium',
    },
    bellContainer: {
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: '#FF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Inter_700Bold',
        paddingHorizontal: 2,
    },
    devicesSection: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#FFF',
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 15,
    },
    deviceCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    deviceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        color: '#FFF',
        fontFamily: 'Inter_500Medium',
        marginBottom: 4,
    },
    deviceWatts: {
        fontSize: 13,
        color: '#888',
        fontFamily: 'Inter_400Regular',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
        minHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
    },
    emptyNotifText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 40,
        fontFamily: 'Inter_400Regular',
    },
    notifItem: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    notifItemUnread: {
        borderColor: '#FFD700',
        backgroundColor: '#2A2200',
    },
    notifIconContainer: {
        marginRight: 16,
        justifyContent: 'center',
    },
    notifTextContainer: {
        flex: 1,
    },
    notifTitle: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 4,
    },
    notifMessage: {
        color: '#BBB',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        lineHeight: 20,
    },
    notifDate: {
        color: '#666',
        fontSize: 12,
        marginTop: 8,
        fontFamily: 'Inter_400Regular',
    },
});
