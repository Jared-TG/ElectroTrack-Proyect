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
    Image,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { API_URL } from '@/app/config/api.config';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa email y contraseña');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, contrasena: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                Alert.alert('Error', data.error || 'Credenciales incorrectas');
                return;
            }

            router.replace('/(tabs)/principal/inicio');
            login(data.user);
        } catch (error) {
            Alert.alert('Error', 'No se pudo conectar al servidor');
        }
    };

    const handleForgotPassword = () => {
        // Navegar a recuperar contraseña
        console.log('Forgot password');
    };

    const handleRegister = () => {
        router.push('/(tabs)/Login/Register' as any);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="light" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../../assets/images/LogoApp.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Bienvenida */}
                <Text style={styles.welcomeText}>Bienvenido a ElectroTrack</Text>

                {/* Formulario */}
                <View style={styles.formContainer}>
                    {/* Email */}
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

                    {/* Contraseña */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu contraseña"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Olvidé mi contraseña */}
                    <TouchableOpacity
                        style={styles.forgotPasswordContainer}
                        onPress={handleForgotPassword}
                    >
                        <Text style={styles.forgotPasswordText}>Olvidé mi contraseña</Text>
                    </TouchableOpacity>

                    {/* Botón Iniciar sesión */}
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>Iniciar sesión</Text>
                    </TouchableOpacity>

                    {/* Registro */}
                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                        <TouchableOpacity onPress={handleRegister}>
                            <Text style={styles.registerLink}>Regístrate</Text>
                        </TouchableOpacity>
                    </View>
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
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 50,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 200,
        height: 200,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    titleWhite: {
        fontSize: 24,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
        letterSpacing: 2,
    },
    titleYellow: {
        fontSize: 24,
        fontFamily: 'Inter_700Bold',
        color: '#FFD700',
        letterSpacing: 2,
    },
    welcomeText: {
        fontSize: 18,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 40,
        fontFamily: 'Inter_500Medium',
    },
    formContainer: {
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
    input: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#FFF',
        fontFamily: 'Inter_400Regular',
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 30,
    },
    forgotPasswordText: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    loginButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#FFF',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 30,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerText: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    registerLink: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Inter_700Bold',
    },
});
