import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const estados = [
  'Ingreso',
  'En espera',
  'Calibrando',
  'Calibrado',
  'Etiquetado',
  'Certificado emitido',
  'Lista para entrega',
  'Entregado'
];

const ActualizarEquipoScreen = ({ equipoInicial = '', fechaEntradaInicial = '', estadoInicial = '' }) => {
  const [equipo, setEquipo] = useState(equipoInicial);
  const [fechaEntrada, setFechaEntrada] = useState(fechaEntradaInicial);
  const [estadoActual, setEstadoActual] = useState(estadoInicial);
  const [nuevoEstado, setNuevoEstado] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flujo de cambio de estado</Text>

      <Text style={styles.label}>Equipo:</Text>
      <TextInput style={styles.input} value={equipo} onChangeText={setEquipo} placeholder="Nombre del equipo" />

      <Text style={styles.label}>Fecha de entrada:</Text>
      <TextInput style={styles.input} value={fechaEntrada} onChangeText={setFechaEntrada} placeholder="DD/MM/AAAA" />

      <Text style={styles.label}>Estado actual:</Text>
      <Text style={styles.estadoActual}>{estadoActual || 'No definido'}</Text>

      <Text style={styles.label}>Nuevo estado:</Text>
      {estados.map((estado) => (
        <TouchableOpacity key={estado} style={styles.radioContainer} onPress={() => setNuevoEstado(estado)}>
          <View style={[styles.radioButton, nuevoEstado === estado && styles.radioSelected]} />
          <Text>{estado}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => nuevoEstado && setEstadoActual(nuevoEstado)}
        disabled={!nuevoEstado}
      >
        <Text style={styles.buttonText}>Actualizar estado</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 5,
  },
  estadoActual: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 10,
  },
  radioSelected: {
    backgroundColor: '#000',
  },
  button: {
    backgroundColor: '#fdbf00',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ActualizarEquipoScreen;
