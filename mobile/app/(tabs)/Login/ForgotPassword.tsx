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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/app/config/api.config';
import { useAlert } from '@/app/context/AlertContext';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();

    const handleSendCode = async () => {
        if (!email) {
            showAlert({ type: 'error', title: 'Campo incompleto', message: 'Por favor ingresa tu correo electrónico.' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                showAlert({ type: 'error', title: 'Error', message: data.error || 'Ocurrió un error.' });
            } else {
                showAlert({ type: 'success', title: 'Código enviado', message: 'Revisa tu bandeja de entrada.' });
                router.push({ pathname: '/(tabs)/Login/VerifyOtp', params: { email } });
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
                    <Ionicons name="lock-closed-outline" size={60} color="#FFD700" style={styles.icon} />
                    <Text style={styles.title}>Recuperar Cuenta</Text>
                    <Text style={styles.subtitle}>
                        Ingresa el correo electrónico asociado a tu cuenta para recibir un código de recuperación.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ElectroTrack@gmail.com"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
                        onPress={handleSendCode}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Enviar Código</Text>
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
    },
    input: {
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 14,
        fontSize: 16,
        color: '#FFF',
        fontFamily: 'Inter_400Regular',
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
