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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/app/config/api.config';
import { useAuth } from '@/app/context/AuthContext';
import { useAlert } from '@/app/context/AlertContext';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
    webClientId: '601517274308-h55g1282pp1fo4rraetekrjevk93u0qt.apps.googleusercontent.com',
});

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { showAlert } = useAlert();

    const handleGoogleLogin = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            
            if (userInfo.type === 'cancelled') {
                return;
            }
            
            const user = userInfo.data.user;
            
            const backendRes = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    name: user.name,
                    google_id: user.id
                })
            });
            const data = await backendRes.json();
            
            if (backendRes.ok) {
                router.replace('/(tabs)/principal/inicio');
                login(data.user);
            } else {
                showAlert({ type: 'error', title: 'Error', message: data.error });
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // El usuario canceló
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // Operación en progreso
            } else {
                showAlert({ type: 'error', title: 'Sin conexión', message: 'No se pudo conectar con Google Play Services' });
                console.error('Google Sign-In Error:', error);
            }
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert({ type: 'error', title: 'Campos incompletos', message: 'Por favor ingresa email y contraseña' });
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, contrasena: password }),
            });

            const data = await res.json();

            if (res.status === 403 && data.email) {
                showAlert({ type: 'error', title: 'Cuenta inactiva', message: 'Por favor verifica tu correo primero.' });
                router.push({ pathname: '/(tabs)/Login/VerifyEmail', params: { email: data.email } });
                return;
            }

            if (!res.ok) {
                showAlert({ type: 'error', title: 'Error de acceso', message: data.error || 'Credenciales incorrectas' });
                return;
            }

            router.replace('/(tabs)/principal/inicio');
            login(data.user);
        } catch (error) {
            showAlert({ type: 'error', title: 'Sin conexión', message: 'No se pudo conectar al servidor' });
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
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Ingresa tu contraseña"
                                placeholderTextColor="#666"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
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

                    {/* Botón Iniciar sesión con Google */}
                    <TouchableOpacity 
                        style={styles.googleButton} 
                        onPress={handleGoogleLogin}
                    >
                        <Ionicons name="logo-google" size={20} color="#000" style={styles.googleIcon} />
                        <Text style={styles.googleButtonText}>Continuar con Google</Text>
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#FFF',
        fontFamily: 'Inter_400Regular',
    },
    eyeIcon: {
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 15,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    googleButton: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    googleIcon: {
        marginRight: 10,
    },
    googleButtonText: {
        color: '#000',
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
