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

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    // Lógica de registro
    console.log('Register:', { email, username, password });
    // Regresar al Login
    router.back();
  };

  const handleTermsPress = () => {
    // Navegar a términos y condiciones
    console.log('Terms and conditions');
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

       

        {/* Título Registro */}
        <Text style={styles.registroTitle}>Registro</Text>

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

          {/* Nombre de Usuario */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="ElectroTrack"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
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

          {/* Términos y condiciones */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              Al registrarte aceptas los{' '}
              <Text style={styles.termsLink} onPress={handleTermsPress}>
                Términos y condiciones
              </Text>
              {'\n'}de servicio.
            </Text>
          </View>

          {/* Botón Registrarse */}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Registrarse</Text>
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
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  titleYellow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 2,
  },
  registroTitle: {
    fontSize: 20,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
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
  },
  termsContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4A9EFF',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
