import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/context/AuthContext';

export default function ConfiguracionScreen() {
    const router = useRouter();
    const { logout } = useAuth();

    // Toggle states
    const [notificaciones, setNotificaciones] = useState(true);
    const [alertaConsumo, setAlertaConsumo] = useState(true);
    const [autoUpdate, setAutoUpdate] = useState(false);
    const [modoAhorro, setModoAhorro] = useState(false);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>ELECTROTRACK</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Configuracion</Text>

                {/* Notificaciones */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="notifications-outline" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Notificaciones</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingName}>Activar notificaciones</Text>
                            <Text style={styles.settingDesc}>Recibe alertas del la notificacion</Text>
                        </View>
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>{notificaciones ? 'ON' : 'OFF'}</Text>
                            <Switch
                                value={notificaciones}
                                onValueChange={setNotificaciones}
                                trackColor={{ false: '#333', true: '#FFD700' }}
                                thumbColor="#FFF"
                                ios_backgroundColor="#333"
                            />
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingName}>Alert por alto consumo</Text>
                            <Text style={styles.settingDesc}>Recibe alerta por un alto consumo</Text>
                        </View>
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>{alertaConsumo ? 'ON' : 'OFF'}</Text>
                            <Switch
                                value={alertaConsumo}
                                onValueChange={setAlertaConsumo}
                                trackColor={{ false: '#333', true: '#FFD700' }}
                                thumbColor="#FFF"
                                ios_backgroundColor="#333"
                            />
                        </View>
                    </View>
                </View>

                {/* Gestor de energía */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Gestor de energia</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingName}>Actualizacion automatica</Text>
                            <Text style={styles.settingDesc}>Refrescar cada 5 minutos</Text>
                        </View>
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabelOff}>{autoUpdate ? 'ON' : 'OFF'}</Text>
                            <Switch
                                value={autoUpdate}
                                onValueChange={setAutoUpdate}
                                trackColor={{ false: '#333', true: '#FFD700' }}
                                thumbColor="#FFF"
                                ios_backgroundColor="#333"
                            />
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingName}>Modo ahorro de energia</Text>
                            <Text style={styles.settingDesc}>Reduce el consumo de energia</Text>
                        </View>
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabelOff}>{modoAhorro ? 'ON' : 'OFF'}</Text>
                            <Switch
                                value={modoAhorro}
                                onValueChange={setModoAhorro}
                                trackColor={{ false: '#333', true: '#FFD700' }}
                                thumbColor="#FFF"
                                ios_backgroundColor="#333"
                            />
                        </View>
                    </View>
                </View>

                {/* Preferencias */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="globe-outline" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Preferencias</Text>
                    </View>

                    <TouchableOpacity style={styles.navRow}>
                        <View>
                            <Text style={styles.settingName}>Idioma</Text>
                            <Text style={styles.settingDesc}>Español</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.navRow}>
                        <View>
                            <Text style={styles.settingName}>Unidades</Text>
                            <Text style={styles.settingDesc}>Watts, kWh</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Facturación */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="currency-usd" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Facturacion</Text>
                    </View>

                    <TouchableOpacity style={styles.navRow}>
                        <View>
                            <Text style={styles.settingName}>Ratio electrico</Text>
                            <Text style={styles.settingDesc}>$0.15 per kWh</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.navRow}>
                        <View>
                            <Text style={styles.settingName}>Ciclo de gastos</Text>
                            <Text style={styles.settingDesc}>Mensual</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Sobre la app */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="information-circle-outline" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Sobre la app</Text>
                    </View>

                    <TouchableOpacity style={styles.navRow}>
                        <View>
                            <Text style={styles.settingName}>Version</Text>
                            <Text style={styles.settingDesc}>1.0.0</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.navRow}>
                        <Text style={styles.settingName}>Politicas de privacidad</Text>
                        <Ionicons name="chevron-forward" size={22} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.navRow}>
                        <Text style={styles.settingName}>Terminos y servicios</Text>
                        <Ionicons name="chevron-forward" size={22} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Botón Salir */}
                <TouchableOpacity style={styles.logoutButton} onPress={() => { logout(); router.replace('/(tabs)/Login'); }}>
                    <Text style={styles.logoutText}>Salir</Text>
                </TouchableOpacity>

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
        paddingBottom: 30,
        paddingTop: 50,
    },
    // Header
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
    // Section Title
    sectionTitle: {
        fontSize: 22,
        fontFamily: 'Inter_700Bold',
        color: '#FFD700',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    // Card
    card: {
        marginHorizontal: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
    },
    // Setting Row (with toggle)
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    settingInfo: {
        flex: 1,
        marginRight: 12,
    },
    settingName: {
        fontSize: 15,
        color: '#FFF',
        fontFamily: 'Inter_500Medium',
    },
    settingDesc: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
        fontFamily: 'Inter_400Regular',
    },
    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    toggleLabel: {
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
        color: '#FFD700',
    },
    toggleLabelOff: {
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
        color: '#888',
    },
    // Navigation Row (with chevron)
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    // Divider
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 8,
    },
    // Logout Button
    logoutButton: {
        marginHorizontal: 20,
        backgroundColor: '#B8960A',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    logoutText: {
        fontSize: 16,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
    },
});
