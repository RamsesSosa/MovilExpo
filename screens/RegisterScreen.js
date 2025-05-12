  import React, { useState } from 'react';
  import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
  import Icon from 'react-native-vector-icons/FontAwesome'; 

  const RegisterScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña

    const handleRegister = () => {
      if (!fullName || !email || !password || !confirmPassword) {
        Alert.alert('Error', 'Por favor, completa todos los campos.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden.');
        return;
      }
      // Aquí llamarás a la API para registrar al usuario
      console.log('Nombre completo:', fullName);
      console.log('Correo:', email);
      console.log('Contraseña:', password);
      navigation.navigate('Login'); // Redirige a la pantalla de login después del registro
    };
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Registro de usuario</Text>
        {/* Campo de nombre completo */}
        <View style={styles.inputContainer}>
          <Icon name="user" size={20} color="#999" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>
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
            secureTextEntry={!showPassword} // Alternar visibilidad
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#999" />
          </TouchableOpacity>
        </View>
        {/* Campo de confirmar contraseña */}
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#999" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirmar Contraseña"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword} // Alternar visibilidad
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#999" />
          </TouchableOpacity>
        </View>
        {/* Botón de registro personalizado */}
        <TouchableOpacity style={styles.customButton} onPress={handleRegister}>
          <Text style={styles.customButtonText}>Crear</Text>
        </TouchableOpacity>
        {/* Enlace para iniciar sesión */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>¿Ya tienes una cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    );
  };
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
      backgroundColor: '#f5f5f5', // Fondo claro
    },
    title: {
      fontSize: 24,
      marginBottom: 16,
      textAlign: 'center',
      color: '#333', // Color de texto oscuro
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: '#ccc',
      borderWidth: 1,
      marginBottom: 12,
      paddingHorizontal: 8,
      borderRadius: 30,
      backgroundColor: '#fff', // Fondo blanco para los inputs
    },
    icon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      height: 40,
      color: '#333', // Color de texto oscuro
    },
    customButton: {
      backgroundColor: '#FF8F00', // Color naranja
      paddingVertical: 12,
      borderRadius: 30,
      alignItems: 'center',
      marginTop: 16,
    },
    customButtonText: {
      color: '#fff', // Texto blanco
      fontSize: 16,
      fontWeight: 'bold',
    },
    link: {
      color: '#007BFF',
      marginTop: 12,
      textAlign: 'center',
    },
  });
  export default RegisterScreen;