import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBLESetup } from '../hooks/useBLESetup';

interface BLESetupModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BLESetupModal({ visible, onClose, onSuccess }: BLESetupModalProps) {
    const { isScanning, connectedDevice, error, status, scanAndConnect, sendWiFiCredentials, disconnect } = useBLESetup();
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (visible) {
            scanAndConnect();
        } else {
            disconnect();
        }
    }, [visible]);

    const handleSend = async () => {
        if (!ssid || !password) return;
        setSending(true);
        const success = await sendWiFiCredentials(ssid, password);
        setSending(false);
        if (success) {
            setTimeout(() => {
                onSuccess();
            }, 2000); // Dar tiempo al ESP32 para procesar
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Configuración Wi-Fi</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.statusText}>{status}</Text>

                    {isScanning && (
                        <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#FF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={scanAndConnect}>
                                <Text style={styles.retryText}>Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {connectedDevice && !sending && !error && (
                        <View style={styles.form}>
                            <Text style={styles.instruction}>
                                Ingresa la red Wi-Fi a la que se conectará el dispositivo:
                            </Text>
                            
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de la red Wi-Fi (SSID)"
                                placeholderTextColor="#666"
                                value={ssid}
                                onChangeText={setSsid}
                            />
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Contraseña del Wi-Fi"
                                    placeholderTextColor="#666"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeIcon} 
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons 
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={24} 
                                        color="#FFD700" 
                                    />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.sendButton, (!ssid || !password) && styles.sendButtonDisabled]}
                                onPress={handleSend}
                                disabled={!ssid || !password}
                            >
                                <Text style={styles.sendButtonText}>Enviar y Configurar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {sending && (
                        <View style={styles.sendingContainer}>
                            <ActivityIndicator size="large" color="#FFD700" />
                            <Text style={styles.statusText}>Enviando credenciales...</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
        color: '#FFD700',
    },
    statusText: {
        fontSize: 16,
        color: '#FFF',
        textAlign: 'center',
        marginVertical: 10,
        fontFamily: 'Inter_400Regular',
    },
    loader: {
        marginTop: 20,
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    errorText: {
        color: '#FF4444',
        textAlign: 'center',
        marginTop: 8,
        fontFamily: 'Inter_400Regular',
    },
    retryButton: {
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#333',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFF',
        fontFamily: 'Inter_600SemiBold',
    },
    form: {
        marginTop: 20,
    },
    instruction: {
        color: '#AAA',
        marginBottom: 16,
        fontFamily: 'Inter_400Regular',
    },
    input: {
        backgroundColor: '#0D0D0D',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12,
        color: '#FFF',
        marginBottom: 16,
        fontFamily: 'Inter_400Regular',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        backgroundColor: '#0D0D0D',
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        color: '#FFF',
        fontFamily: 'Inter_400Regular',
    },
    eyeIcon: {
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButton: {
        backgroundColor: '#FFD700',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#000',
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
    },
    sendingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
});
