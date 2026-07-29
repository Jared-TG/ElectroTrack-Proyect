import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../config/api.config';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (code.length !== 6) {
            Alert.alert('Error', 'El código debe tener 6 dígitos');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });
            const data = await response.json();
            
            if (response.ok) {
                Alert.alert('Éxito', 'Correo verificado correctamente. ¡Ya puedes iniciar sesión!');
                router.replace('/(tabs)/Login');
            } else {
                Alert.alert('Error', data.error || 'Código incorrecto');
            }
        } catch (error) {
            console.error('Error verificando correo:', error);
            Alert.alert('Error', 'Problema de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Verificar Correo</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-unread-outline" size={80} color="#FFD700" />
                </View>
                
                <Text style={styles.subtitle}>Hemos enviado un código a:</Text>
                <Text style={styles.emailText}>{email}</Text>
                
                <Text style={styles.instruction}>
                    Por favor, revisa tu bandeja de entrada (y la carpeta de spam) e ingresa el código de 6 dígitos aquí.
                </Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="keypad-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="000000"
                        placeholderTextColor="#9ca3af"
                        value={code}
                        onChangeText={setCode}
                        keyboardType="numeric"
                        maxLength={6}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.button, (!code || loading) && styles.buttonDisabled]} 
                    onPress={handleVerify}
                    disabled={!code || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.buttonText}>Verificar Cuenta</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        marginRight: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 20,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 30,
        padding: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 60,
    },
    subtitle: {
        fontSize: 16,
        color: '#d1d5db',
        textAlign: 'center',
        marginBottom: 5,
    },
    emailText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    instruction: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3a3a3a',
        paddingHorizontal: 15,
        marginBottom: 30,
        width: '100%',
        maxWidth: 300,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 60,
        color: '#FFF',
        fontSize: 32,
        letterSpacing: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        maxWidth: 300,
    },
    buttonDisabled: {
        backgroundColor: '#666',
        opacity: 0.7,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
