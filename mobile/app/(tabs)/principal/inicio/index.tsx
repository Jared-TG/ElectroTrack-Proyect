import React, { useState, useCallback, useEffect } from 'react';
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
import { useDispositivos } from '@/app/hooks/useDispositivos';

export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { dispositivos: devices, refresh } = useDispositivos();

    // Para simplificar la demo, mantendremos un estado local de encendido/apagado para los interruptores
    // En el sistema real esto debería venir del dispositivo (estado 'en_linea' o similar) y enviar comandos por WiFi
    const [toggles, setToggles] = useState<Record<number, boolean>>({});

    // Inicializar toggles cuando cambian los dispositivos
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

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );
    //esto es de modo de pruba sera borrado despues
    // Calcular consumo base total de dispositivos encendidos
    const baseTotalWatts = devices.reduce((sum, device) => {
        const isOn = toggles[device.id] ?? true;
        // Si el dispositivo tiene 0 watts en la BD, le asignamos 40W base por defecto para la demo
        const wattsToAdd = (device.watts && device.watts > 0) ? device.watts : 40;
        return isOn ? sum + wattsToAdd : sum;
    }, 0);

    const [liveTotalWatts, setLiveTotalWatts] = useState(baseTotalWatts);

    // Efecto para simular variación en tiempo real del medidor principal
    useEffect(() => {
        let isMounted = true;

        if (baseTotalWatts === 0) {
            setLiveTotalWatts(0);
            return;
        }

        const applyVariation = () => {
            if (!isMounted) return;
            // Variación aleatoria entre -4% y +4% para que se note
            const variation = baseTotalWatts * (Math.random() * 0.08 - 0.04);
            // Añadir un pequeño ruido base independiente de si los watts son bajos
            const noise = (Math.random() - 0.5) * 4;
            const newLiveWatts = Math.max(0, Math.round(baseTotalWatts + variation + noise));
            setLiveTotalWatts(newLiveWatts);
        };

        applyVariation();
        const intervalId = setInterval(applyVariation, 2000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [baseTotalWatts]);

    // Calcular costo estimado (ejemplo: $0.35 MXN por kWh) usando consumo base para estabilidad
    const kwhCost = 0.35;
    const hoursPerMonth = 720; // 30 días x 24 horas
    const monthlyKwh = (baseTotalWatts / 1000) * hoursPerMonth;
    const estimatedCost = `$${Math.round(monthlyKwh * kwhCost)} MXN`;

    const toggleDevice = (deviceId: number) => {
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
                                                {(device.watts && device.watts > 0) ? device.watts : 40}w
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#555" />
                                    </TouchableOpacity>

                                    <Switch
                                        value={isOn}
                                        onValueChange={() => toggleDevice(device.id)}
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
