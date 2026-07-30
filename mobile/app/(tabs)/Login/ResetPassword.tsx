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

export default function ResetPasswordScreen() {
    const { email, code } = useLocalSearchParams<{ email: string, code: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            showAlert({ type: 'error', title: 'Campos incompletos', message: 'Por favor llena ambos campos.' });
            return;
        }

        if (password !== confirmPassword) {
            showAlert({ type: 'error', title: 'Contraseñas no coinciden', message: 'Las contraseñas no son iguales.' });
            return;
        }

        if (password.length < 6) {
            showAlert({ type: 'error', title: 'Contraseña débil', message: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword: password }),
            });

            const data = await res.json();
            
            if (!res.ok) {
                showAlert({ type: 'error', title: 'Error', message: data.error || 'Ocurrió un error al cambiar la contraseña.' });
            } else {
                showAlert({ type: 'success', title: '¡Contraseña actualizada!', message: 'Ya puedes iniciar sesión con tu nueva contraseña.' });
                router.replace('/(tabs)/Login');
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
                    <Ionicons name="key-outline" size={60} color="#FFD700" style={styles.icon} />
                    <Text style={styles.title}>Nueva Contraseña</Text>
                    <Text style={styles.subtitle}>
                        Crea una nueva contraseña segura para tu cuenta.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nueva Contraseña</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Ingresa nueva contraseña"
                                placeholderTextColor="#666"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#FFD700" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirmar Contraseña</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Confirma tu contraseña"
                                placeholderTextColor="#666"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Actualizar Contraseña</Text>
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
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#FFF',
        marginBottom: 8,
        fontFamily: 'Inter_400Regular',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 12,
        backgroundColor: '#111',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 14,
        fontSize: 16,
        color: '#FFF',
        fontFamily: 'Inter_400Regular',
    },
    eyeIcon: {
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
