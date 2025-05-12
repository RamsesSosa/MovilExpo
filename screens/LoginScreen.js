import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// Asegúrate de que esta ruta sea correcta según tu estructura de carpetas
import Logo from '../screens/logo.jpeg';

const api = axios.create({
  baseURL: 'http://192.168.0.114:8000/api/', //Cambiar URL por la ip de quien lo pruebe
  timeout: 10000,
});

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
    setIsLoading(true);

    try {
      const response = await api.post('token/', {
        correo: email,
        password: password,
      });

      await AsyncStorage.multiSet([
        ['access_token', response.data.access],
        ['refresh_token', response.data.refresh]
      ]);

      navigation.replace('Menu');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'ECONNABORTED') {
        Alert.alert('Error', 'Tiempo de espera agotado. Verifica tu conexión.');
      } else if (error.response?.status === 401) {
        Alert.alert('Error', 'Credenciales incorrectas');
      } else {
        Alert.alert('Error', 'No se pudo conectar al servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={Logo} style={styles.logo} />
      <Text style={styles.title}>Bienvenido!</Text>
      <Text style={styles.subtitle}>Inicia sesión con tu correo y contraseña.</Text>

      {/* Campo de correo electrónico */}
      <View style={styles.inputContainer}>
        <Icon name="envelope" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Campo de contraseña */}
      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Botón de inicio de sesión personalizado */}
      <TouchableOpacity style={styles.customButton} onPress={handleLogin}>
        <Text style={styles.customButtonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: -40, // Esto la sube un poco
  },  
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    color: '#333', 
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666', 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 30,
    backgroundColor: '#fff', 
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    color: '#333', 
  },
  customButton: {
    backgroundColor: '#FF8F00',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 16,
  },
  customButtonText: {
    color: '#fff', 
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007BFF',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;
