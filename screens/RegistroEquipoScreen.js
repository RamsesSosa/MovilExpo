import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Alert, ScrollView,
  StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform } from 'react-native';

const RegistroEquipoScreen = () => {
  const navigation = useNavigation();
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [consecutivo, setConsecutivo] = useState('');
  const [accesorios, setAccesorios] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://192.168.0.114:8000/api/clientes/');
        const data = await response.json();
        if (response.ok) {
          setClientes(data);
        } else {
          throw new Error(data.message || 'Error al cargar clientes');
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  const handleSubmit = async () => {
    if (!clienteSeleccionado) {
      Alert.alert('Error', 'Debe seleccionar un cliente');
      return;
    }

    const equipo = {
      nombre_equipo: nombreEquipo,
      numero_serie: numeroSerie,
      marca: marca,
      modelo: modelo,
      consecutivo: consecutivo,
      accesorios: accesorios,
      observaciones: observaciones,
      cliente: clienteSeleccionado.id,
    };

    try {
      setLoading(true);
      const response = await fetch('http://192.168.0.114:8000/api/equipos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipo),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      Alert.alert('Éxito', 'Equipo registrado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Error al registrar equipo');
    } finally {
      setLoading(false);
    }
  };

  if (loading && clientes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Registro de Equipo</Text>

        <Text style={styles.label}>Cliente*</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: clienteSeleccionado ? '#000' : '#999' }}>
            {clienteSeleccionado?.nombre_cliente || 'Seleccione un cliente'}
          </Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <FlatList
              data={clientes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    setClienteSeleccionado(item);
                    setModalVisible(false);
                  }}
                >
                  <Text>{item.nombre_cliente}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {[
          { label: 'Nombre del Equipo*', value: nombreEquipo, onChange: setNombreEquipo, placeholder: 'Ej: Bomba centrífuga' },
          { label: 'Número de Serie*', value: numeroSerie, onChange: setNumeroSerie, placeholder: 'Ej: SN12345678' },
          { label: 'Marca*', value: marca, onChange: setMarca, placeholder: 'Ej: Siemens' },
          { label: 'Modelo*', value: modelo, onChange: setModelo, placeholder: 'Ej: Model X2000' },
          { label: 'Consecutivo*', value: consecutivo, onChange: setConsecutivo, placeholder: 'Ej: C-001-2023' },
          { label: 'Accesorios', value: accesorios, onChange: setAccesorios, placeholder: 'Lista de accesorios incluidos' },
          { label: 'Observaciones', value: observaciones, onChange: setObservaciones, placeholder: 'Detalles adicionales del equipo', multiline: true, height: 100 },
        ].map(({ label, ...inputProps }, index) => (
          <View key={index}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={[styles.input, inputProps.multiline && { height: inputProps.height }]}
              placeholder={inputProps.placeholder}
              value={inputProps.value}
              onChangeText={inputProps.onChange}
              multiline={!!inputProps.multiline}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Registrando...' : 'Registrar Equipo'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F9FAFB',
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
  selector: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#D32F2F',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RegistroEquipoScreen;
