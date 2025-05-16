import React, { useState } from 'react';
import { 
  View, Text, TextInput, Alert, ScrollView, 
  StyleSheet, ActivityIndicator, TouchableOpacity 
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const RegistroClienteScreen = () => {
  const navigation = useNavigation();
  const [nombres, setNombres] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nombres.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    if (nombres.length < 3) {
      Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres');
      return;
    }

    setIsLoading(true);
    const cliente = { nombre_cliente: nombres.trim() };

    try {
      const response = await axios.post(
        'http://192.168.0.26:8000/api/clientes/', //cambiar la ip de tu router
        cliente,
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('Respuesta del servidor:', response);

      if (response.status === 201) {
        Alert.alert('Éxito', 'Cliente registrado correctamente');
        setNombres('');
        navigation.navigate('Menu');
      } else {
        Alert.alert('Error', 'No se pudo registrar el cliente');
      }
    } catch (error) {
      console.error('Error completo:', error);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        Alert.alert('Error', error.response.data?.error || 'Error al registrar el cliente');
      } else if (error.request) {
        Alert.alert('Error', 'No se recibió respuesta del servidor');
      } else {
        Alert.alert('Error', 'Error al realizar la solicitud');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelar = () => {
    Alert.alert(
      'Cancelar',
      '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registro de Cliente</Text>

      <Text style={styles.label}>Nombre de la empresa</Text>
      <TextInput
        style={styles.input}
        placeholder="Grupo Bimbo"
        value={nombres}
        onChangeText={setNombres}
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.disabledButton]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Registrando...' : 'Guardar'}
        </Text>
      </TouchableOpacity>

      {isLoading && <ActivityIndicator size="small" color="#4CAF50" />}
      <View style={{ marginVertical: 20 }} />

      <TouchableOpacity 
        style={[styles.button, styles.cancelButton]} 
        onPress={handleCancelar}
      >
        <Text style={styles.buttonText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB', // Fondo suave
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '500',
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 13,
    borderRadius: 10,
    marginVertical: 3,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#D32F2F', // Rojo más sobrio
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegistroClienteScreen;
