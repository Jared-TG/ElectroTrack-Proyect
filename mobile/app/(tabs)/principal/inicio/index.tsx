import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import CircularMeter from '@/components/CircularMeter';
import { useAuth } from '@/app/context/AuthContext';
import { getLocalDevices, LocalDispositivo } from '@/app/services/localDeviceService';

export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [devices, setDevices] = useState<LocalDispositivo[]>([]);
    
    // Para simplificar la demo, mantendremos un estado local de encendido/apagado para los interruptores
    // En el sistema real esto debería venir del dispositivo (estado 'en_linea' o similar) y enviar comandos por WiFi
    const [toggles, setToggles] = useState<Record<string, boolean>>({});

    const fetchDevices = async () => {
        const local = await getLocalDevices();
        setDevices(local);
        
        // Inicializar toggles para los nuevos dispositivos que no estén en el estado
        setToggles(prev => {
            const newToggles = { ...prev };
            local.forEach(d => {
                if (newToggles[d.qr_code] === undefined) {
                    newToggles[d.qr_code] = true; // Por defecto encendidos en la UI para la demo
                }
            });
            return newToggles;
        });
    };

    useFocusEffect(
        useCallback(() => {
            fetchDevices();
        }, [])
    );

    // Calcular consumo total de dispositivos encendidos
    const totalWatts = devices.reduce((sum, device) => {
        const isOn = toggles[device.qr_code] ?? true;
        return isOn ? sum + (device.watts || 0) : sum;
    }, 0);

    // Calcular costo estimado (ejemplo: $0.35 MXN por kWh)
    const kwhCost = 0.35;
    const hoursPerMonth = 720; // 30 días x 24 horas
    const monthlyKwh = (totalWatts / 1000) * hoursPerMonth;
    const estimatedCost = `$${Math.round(monthlyKwh * kwhCost)} MXN`;

    const toggleDevice = (deviceId: string) => {
        setToggles(prev => ({
            ...prev,
            [deviceId]: !prev[deviceId]
        }));
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
                    <TouchableOpacity>
                        <Ionicons name="notifications-outline" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Medidor Circular */}
                <CircularMeter
                    currentWatts={totalWatts}
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
                            const isOn = toggles[device.qr_code] ?? true;
                            return (
                                <View key={device.qr_code} style={styles.deviceCard}>
                                    <TouchableOpacity
                                        style={styles.deviceLeft}
                                        activeOpacity={0.7}
                                        onPress={() => router.push({
                                            pathname: '/principal/inicio/device-detail' as any,
                                            params: {
                                                qr_code: device.qr_code,
                                                nombre: device.nombre,
                                                icono: device.icono || 'default',
                                                watts: String(device.watts || 0),
                                            },
                                        })}
                                    >
                                        <View style={styles.iconContainer}>
                                            {getDeviceIcon(device.icono || 'hardware-chip')}
                                        </View>
                                        <View style={styles.deviceInfo}>
                                            <Text style={styles.deviceName}>{device.nombre}</Text>
                                            <Text style={styles.deviceWatts}>{device.watts || 0}w</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#555" />
                                    </TouchableOpacity>

                                    <Switch
                                        value={isOn}
                                        onValueChange={() => toggleDevice(device.qr_code)}
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
});
