import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/app/config/api.config';
import { useAlert } from '@/app/context/AlertContext';

export default function VerifyOtpScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();

    const handleVerifyCode = async () => {
        if (!code || code.length !== 6) {
            showAlert({ type: 'error', title: 'Código inválido', message: 'Por favor ingresa el código de 6 dígitos.' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/verify-reset-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                showAlert({ type: 'error', title: 'Error', message: data.error || 'Código incorrecto.' });
            } else {
                router.push({ pathname: '/(tabs)/Login/ResetPassword', params: { email, code } });
            }
        } catch (error) {
            showAlert({ type: 'error', title: 'Sin conexión', message: 'No se pudo conectar al servidor.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Ionicons name="mail-unread-outline" size={60} color="#FFD700" style={styles.icon} />
                    <Text style={styles.title}>Verificar Código</Text>
                    <Text style={styles.subtitle}>
                        Hemos enviado un código de 6 dígitos a <Text style={{ color: '#FFF' }}>{email}</Text>. Ingrésalo a continuación.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Código de Seguridad</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="000000"
                            placeholderTextColor="#666"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            textAlign="center"
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
                        onPress={handleVerifyCode}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Verificar y Continuar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 30,
    },
    label: {
        fontSize: 14,
        color: '#FFF',
        marginBottom: 8,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center'
    },
    input: {
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 14,
        fontSize: 24,
        letterSpacing: 10,
        color: '#FFF',
        fontFamily: 'Inter_700Bold',
    },
    primaryButton: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
