import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useDispositivos } from '@/app/hooks/useDispositivos';
import { addLocalDevice } from '@/app/services/localDeviceService';

// Íconos disponibles para seleccionar
const DEVICE_ICONS = [
    { key: 'tv', label: 'TV', component: (color: string) => <Ionicons name="tv-outline" size={26} color={color} /> },
    { key: 'laptop', label: 'Laptop', component: (color: string) => <Ionicons name="laptop-outline" size={26} color={color} /> },
    { key: 'camera', label: 'Cámara', component: (color: string) => <Ionicons name="camera-outline" size={26} color={color} /> },
    { key: 'headset', label: 'Headset', component: (color: string) => <Ionicons name="headset-outline" size={26} color={color} /> },
    { key: 'wifi', label: 'Router', component: (color: string) => <Ionicons name="wifi-outline" size={26} color={color} /> },
    { key: 'settings', label: 'Otro', component: (color: string) => <Ionicons name="options-outline" size={26} color={color} /> },
];

// Renderizar ícono del dispositivo por key
function DeviceIcon({ iconKey, size = 28, color = '#FFD700' }: { iconKey: string; size?: number; color?: string }) {
    switch (iconKey) {
        case 'tv':
            return <Ionicons name="tv-outline" size={size} color={color} />;
        case 'laptop':
            return <Ionicons name="laptop-outline" size={size} color={color} />;
        case 'camera':
            return <Ionicons name="camera-outline" size={size} color={color} />;
        case 'headset':
            return <Ionicons name="headset-outline" size={size} color={color} />;
        case 'wifi':
            return <Ionicons name="wifi-outline" size={size} color={color} />;
        case 'settings':
            return <Ionicons name="options-outline" size={size} color={color} />;
        default:
            return <Ionicons name="hardware-chip-outline" size={size} color={color} />;
    }
}

export default function DispositivosScreen() {
    const { dispositivos, loading, error, addDispositivo, refresh } = useDispositivos();

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState('tv');
    const [deviceName, setDeviceName] = useState('');
    const [saving, setSaving] = useState(false);

    // QR Scanner state
    const [scannerVisible, setScannerVisible] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    // ID del dispositivo (obtenido por QR o manual)
    const [scannedDeviceId, setScannedDeviceId] = useState('');

    // Manual ID state
    const [manualIdVisible, setManualIdVisible] = useState(false);
    const [manualId, setManualId] = useState('');

    const handleOpenModal = () => {
        setSelectedIcon('tv');
        setDeviceName('');
        setScannedDeviceId('');
        setModalVisible(true);
    };

    // ===== QR SCANNER =====
    const handleOpenScanner = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert(
                    'Permiso requerido',
                    'Se necesita acceso a la cámara para escanear códigos QR'
                );
                return;
            }
        }
        setScanned(false);
        setScannerVisible(true);
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        setScannerVisible(false);

        // El QR contiene solo el ID del dispositivo ElectroTrack
        const deviceId = data.trim();
        setScannedDeviceId(deviceId);

        Alert.alert(
            '✅ Dispositivo detectado',
            `ID: ${deviceId}\n\nAhora ponle un nombre a tu dispositivo.`,
            [{ text: 'OK' }]
        );
    };

    // ===== MANUAL ID =====
    const handleOpenManualId = () => {
        setManualId('');
        setManualIdVisible(true);
    };

    const handleManualIdSubmit = () => {
        if (!manualId.trim()) {
            Alert.alert('Error', 'Ingresa el ID del dispositivo');
            return;
        }

        setScannedDeviceId(manualId.trim());
        setManualIdVisible(false);
        setManualId('');

        Alert.alert(
            '✅ ID registrado',
            `ID: ${manualId.trim()}\n\nAhora ponle un nombre a tu dispositivo.`,
            [{ text: 'OK' }]
        );
    };

    // ===== VINCULAR (guardar en SQLite + servidor) =====
    const handleVincular = async () => {
        if (!deviceName.trim()) {
            Alert.alert('Error', 'Ingresa el nombre del dispositivo');
            return;
        }

        if (!scannedDeviceId) {
            Alert.alert('Error', 'Primero escanea un código QR o introduce el ID manualmente');
            return;
        }

        setSaving(true);
        try {
            // Guardar en SQLite local
            await addLocalDevice({
                qr_code: scannedDeviceId,
                nombre: deviceName.trim(),
                icono: selectedIcon !== 'tv' ? selectedIcon : null,
                tipo: 'general',
                modelo: null,
                serial: null,
                estado: 'en_espera',
                watts: 0,
            });

            // También crear en el servidor
            await addDispositivo({
                nombre: deviceName.trim(),
                icono: selectedIcon !== 'tv' ? selectedIcon : null,
                qr_code: scannedDeviceId,
                tipo: 'general',
                modelo: null,
                serial: null,
                estado: 'en_espera',
                online: true,
                watts: 0,
            });

            setModalVisible(false);
            Alert.alert('✅ Dispositivo vinculado', `${deviceName.trim()} se agregó correctamente`);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo vincular el dispositivo');
        } finally {
            setSaving(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Cargando dispositivos...</Text>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={refresh} style={styles.retryButton}>
                    <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.sectionTitle}>Dispositivos</Text>
                    <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
                        <Ionicons name="add" size={22} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Lista de dispositivos */}
                {dispositivos.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="devices" size={64} color="#333" />
                        <Text style={styles.emptyText}>No hay dispositivos vinculados</Text>
                        <Text style={styles.emptySubtext}>Presiona + para agregar uno</Text>
                    </View>
                ) : (
                    dispositivos.map((device) => (
                        <View key={device.id} style={styles.deviceCard}>
                            <View style={styles.deviceLeft}>
                                <View style={styles.iconContainer}>
                                    <DeviceIcon iconKey={device.icono || 'default'} size={28} color="#FFD700" />
                                </View>
                                <View style={styles.deviceInfo}>
                                    <Text style={styles.deviceName}>{device.nombre}</Text>
                                    <Text style={styles.deviceStatus}>
                                        {device.estado === 'en_linea' ? 'en línea' : 'en espera'}
                                    </Text>
                                    <View style={styles.deviceMeta}>
                                        <View style={[
                                            styles.onlineDot,
                                            { backgroundColor: device.online ? '#4CAF50' : '#888' }
                                        ]} />
                                        <Text style={styles.onlineLabel}>
                                            {device.online ? 'Online' : 'Offline'}
                                        </Text>
                                        <Text style={styles.separator}>•</Text>
                                        <Text style={styles.wattsLabel}>{device.watts} W</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* ===== Modal Agregar Dispositivo ===== */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <ScrollView contentContainerStyle={styles.modalScrollContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#FFD700" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>ELECTROTRACK</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {/* Modal Title */}
                        <Text style={styles.modalTitle}>Dispositivos</Text>

                        {/* Seleccionar ícono */}
                        <Text style={styles.label}>Selecciona un ícono</Text>
                        <View style={styles.iconsRow}>
                            {DEVICE_ICONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon.key}
                                    style={[
                                        styles.iconOption,
                                        selectedIcon === icon.key && styles.iconOptionSelected,
                                    ]}
                                    onPress={() => setSelectedIcon(icon.key)}
                                >
                                    {icon.component(selectedIcon === icon.key ? '#FFD700' : '#888')}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Nombre del dispositivo */}
                        <Text style={styles.label}>Nombre del dispositivo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Televisión/Dispositivo 1"
                            placeholderTextColor="#666"
                            value={deviceName}
                            onChangeText={setDeviceName}
                        />

                        {/* Opciones QR / Manual */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity style={styles.optionCard} onPress={handleOpenScanner}>
                                <MaterialCommunityIcons name="qrcode-scan" size={36} color="#FFD700" />
                                <Text style={styles.optionText}>Escanear Código QR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.optionCard} onPress={handleOpenManualId}>
                                <Ionicons name="book-outline" size={36} color="#FFD700" />
                                <Text style={styles.optionText}>Introducir Id{'\n'}manualmente</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ID del dispositivo escaneado */}
                        {scannedDeviceId ? (
                            <View style={styles.scannedIdBadge}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.scannedIdText}>ID: {scannedDeviceId}</Text>
                            </View>
                        ) : (
                            <View style={styles.scannedIdBadge}>
                                <Ionicons name="information-circle-outline" size={20} color="#666" />
                                <Text style={[styles.scannedIdText, { color: '#666' }]}>
                                    Escanea un QR o introduce el ID
                                </Text>
                            </View>
                        )}

                        {/* Botón Vincular */}
                        <TouchableOpacity
                            style={[styles.vincularButton, saving && styles.vincularButtonDisabled]}
                            onPress={handleVincular}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.vincularText}>Vincular Dispositivo</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* ===== Modal Escáner QR ===== */}
            <Modal
                visible={scannerVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setScannerVisible(false)}
            >
                <View style={styles.scannerContainer}>
                    {/* Scanner Header */}
                    <View style={styles.scannerHeader}>
                        <TouchableOpacity onPress={() => setScannerVisible(false)} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.scannerTitle}>Escanear QR</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Camera */}
                    <View style={styles.cameraContainer}>
                        <CameraView
                            style={styles.camera}
                            barcodeScannerSettings={{
                                barcodeTypes: ['qr'],
                            }}
                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        />

                        {/* Overlay con marco */}
                        <View style={styles.overlay}>
                            <View style={styles.scanFrame}>
                                {/* Esquinas del marco */}
                                <View style={[styles.corner, styles.cornerTL]} />
                                <View style={[styles.corner, styles.cornerTR]} />
                                <View style={[styles.corner, styles.cornerBL]} />
                                <View style={[styles.corner, styles.cornerBR]} />
                            </View>
                            <Text style={styles.scanInstruction}>
                                Apunta la cámara al código QR del dispositivo
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ===== Modal ID Manual ===== */}
            <Modal
                visible={manualIdVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setManualIdVisible(false)}
            >
                <View style={styles.manualIdOverlay}>
                    <View style={styles.manualIdCard}>
                        <Text style={styles.manualIdTitle}>Introducir ID del dispositivo</Text>
                        <Text style={styles.manualIdSubtitle}>
                            Ingresa el código que aparece en la etiqueta del dispositivo
                        </Text>
                        <TextInput
                            style={styles.manualIdInput}
                            placeholder="Ej: ET-2026-001"
                            placeholderTextColor="#666"
                            value={manualId}
                            onChangeText={setManualId}
                            autoCapitalize="characters"
                            autoFocus
                        />
                        <View style={styles.manualIdButtons}>
                            <TouchableOpacity
                                style={styles.manualIdCancel}
                                onPress={() => setManualIdVisible(false)}
                            >
                                <Text style={styles.manualIdCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.manualIdConfirm}
                                onPress={handleManualIdSubmit}
                            >
                                <Text style={styles.manualIdConfirmText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    // ===== PANTALLA PRINCIPAL =====
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 30,
        paddingTop: 50,
    },
    loadingText: {
        color: '#AAA',
        marginTop: 12,
        fontFamily: 'Inter_400Regular',
    },
    errorText: {
        color: '#FF4444',
        marginTop: 12,
        textAlign: 'center',
        paddingHorizontal: 20,
        fontFamily: 'Inter_400Regular',
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    retryText: {
        color: '#FFD700',
        fontFamily: 'Inter_600SemiBold',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontFamily: 'Inter_700Bold',
        color: '#FFD700',
    },
    addButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#555',
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
        marginTop: 6,
    },

    // Device Card
    deviceCard: {
        marginHorizontal: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    deviceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        color: '#FFF',
        fontFamily: 'Inter_600SemiBold',
    },
    deviceStatus: {
        fontSize: 13,
        color: '#B8960A',
        fontFamily: 'Inter_500Medium',
        marginTop: 2,
    },
    deviceMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    onlineLabel: {
        fontSize: 12,
        color: '#AAA',
        fontFamily: 'Inter_400Regular',
    },
    separator: {
        fontSize: 12,
        color: '#555',
    },
    wattsLabel: {
        fontSize: 12,
        color: '#AAA',
        fontFamily: 'Inter_400Regular',
    },

    // ===== MODAL AGREGAR =====
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
    modalTitle: {
        fontSize: 22,
        fontFamily: 'Inter_700Bold',
        color: '#FFD700',
        paddingHorizontal: 20,
        marginBottom: 24,
    },

    // Selector de íconos
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

    // Input
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
        marginBottom: 24,
    },

    // Opciones QR / Manual
    optionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 32,
    },
    optionCard: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        paddingVertical: 24,
        alignItems: 'center',
        gap: 10,
    },
    optionText: {
        fontSize: 12,
        color: '#CCC',
        fontFamily: 'Inter_500Medium',
        textAlign: 'center',
    },

    // Botón Vincular
    vincularButton: {
        marginHorizontal: 20,
        backgroundColor: '#B8960A',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    vincularButtonDisabled: {
        opacity: 0.6,
    },
    vincularText: {
        fontSize: 16,
        fontFamily: 'Inter_700Bold',
        color: '#000',
    },

    // ===== SCANNER QR =====
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    scannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#000',
    },
    scannerTitle: {
        fontSize: 18,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#FFD700',
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    scanInstruction: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
        textAlign: 'center',
        marginTop: 24,
        paddingHorizontal: 40,
    },

    // ===== MODAL ID MANUAL =====
    manualIdOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    manualIdCard: {
        width: '100%',
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        padding: 24,
    },
    manualIdTitle: {
        fontSize: 18,
        fontFamily: 'Inter_700Bold',
        color: '#FFD700',
        marginBottom: 8,
    },
    manualIdSubtitle: {
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
        color: '#888',
        marginBottom: 20,
    },
    manualIdInput: {
        backgroundColor: '#0D0D0D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        padding: 16,
        fontSize: 16,
        color: '#FFF',
        fontFamily: 'Inter_500Medium',
        letterSpacing: 1,
        marginBottom: 20,
    },
    manualIdButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    manualIdCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#555',
        alignItems: 'center',
    },
    manualIdCancelText: {
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        color: '#888',
    },
    manualIdConfirm: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FFD700',
        alignItems: 'center',
    },
    manualIdConfirmText: {
        fontSize: 14,
        fontFamily: 'Inter_700Bold',
        color: '#000',
    },

    // ID escaneado badge
    scannedIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 8,
    },
    scannedIdText: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
        color: '#4CAF50',
    },
});
