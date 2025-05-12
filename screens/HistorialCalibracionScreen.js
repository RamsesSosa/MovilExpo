import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, Modal, ActivityIndicator, Alert, Button 
} from 'react-native';
import axios from 'axios';

const HistorialCalibracionScreen = () => {
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [consecutivoBusqueda, setConsecutivoBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://192.168.0.114:8000/api';

  const fetchEquipos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/equipos`);
      const equiposFormateados = response.data.map(equipo => ({
        id: equipo.id,
        nombre_equipo: equipo.nombre_equipo,
        marca: equipo.marca,
        modelo: equipo.modelo,
        numero_serie: equipo.numero_serie,
        consecutivo: equipo.consecutivo,
        accesorios: equipo.accesorios,
        observaciones: equipo.observaciones,
        cliente_id: equipo.cliente,
        fecha_entrada: equipo.fecha_entrada
      }));
      setEquipos(equiposFormateados);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los equipos');
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/clientes`);
      setClientes(response.data.map(cliente => ({
        id: cliente.id,
        nombres: cliente.nombre_cliente
      })));
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const filtrarEquipos = () => {
    if (!clienteSeleccionado) {
      return equipos.filter(equipo => 
        !consecutivoBusqueda || 
        equipo.consecutivo.toLowerCase().includes(consecutivoBusqueda.toLowerCase())
      );
    }
    const equiposDelCliente = equipos.filter(
      equipo => equipo.cliente_id === clienteSeleccionado.id
    );
    return equiposDelCliente.filter(equipo => 
      !consecutivoBusqueda || 
      equipo.consecutivo.toLowerCase().includes(consecutivoBusqueda.toLowerCase())
    );
  };

  const handleEquipoPress = (equipo) => {
    setEquipoSeleccionado(equipo);
    setModalDetalleVisible(true);
  };

  useEffect(() => {
    fetchEquipos();
    fetchClientes();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleEquipoPress(item)}>
      <View style={styles.row}>
        <Text style={styles.cell}>{item.nombre_equipo}</Text>
        <Text style={styles.cell}>{item.marca}</Text>
        <Text style={styles.cell}>{item.consecutivo}</Text>
        <Text style={styles.cell}>
          {new Date(item.fecha_entrada).toLocaleDateString('es-ES')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Calibración</Text>

      <Text style={styles.label}>Filtrar por Cliente</Text>
      <TouchableOpacity 
        style={styles.selector} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectorText}>
          {clienteSeleccionado ? clienteSeleccionado.nombres : 'Todos los clientes'}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Seleccione un cliente</Text>
          <FlatList
            data={[{id: null, nombres: 'Todos los clientes'}, ...clientes]}
            keyExtractor={item => item.id ? item.id.toString() : 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.item} 
                onPress={() => {
                  setClienteSeleccionado(item.id ? item : null);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.itemText}>{item.nombres}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Cerrar" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>

      <Text style={styles.label}>Buscar por Consecutivo</Text>
      <TextInput
        value={consecutivoBusqueda}
        onChangeText={setConsecutivoBusqueda}
        placeholder="Ingrese el consecutivo"
        style={styles.input}
      />

      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Equipo</Text>
        <Text style={styles.headerCell}>Marca</Text>
        <Text style={styles.headerCell}>Consecutivo</Text>
        <Text style={styles.headerCell}>Fecha Entrada</Text>
      </View>

      <FlatList
        data={filtrarEquipos()}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { alignItems: 'center', marginTop: 40 }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#555', marginBottom: 10 }}>
              ⚠️ No se encontraron equipos
            </Text>
            {clienteSeleccionado && (
              <Text style={{ fontSize: 16, color: '#777', textAlign: 'center' }}>
                para el cliente:{" "}
                <Text style={{ fontWeight: 'bold', color: '#333' }}>
                  {clienteSeleccionado.nombres}
                </Text>
              </Text>
            )}
          </View>
        }
      />

      {/* Modal con estilo bonito para mostrar detalles */}
      <Modal
        visible={modalDetalleVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalDetalleVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalCardTitle}>🛠️ Detalles del Equipo</Text>
            {equipoSeleccionado && (
              <View style={styles.detailGrid}>
                <Text style={styles.detailLabel}>Nombre:</Text>
                <Text style={styles.detailValue}>{equipoSeleccionado.nombre_equipo}</Text>

                <Text style={styles.detailLabel}>Marca:</Text>
                <Text style={styles.detailValue}>{equipoSeleccionado.marca}</Text>

                <Text style={styles.detailLabel}>Modelo:</Text>
                <Text style={styles.detailValue}>{equipoSeleccionado.modelo}</Text>

                <Text style={styles.detailLabel}>N° Serie:</Text>
                <Text style={styles.detailValue}>{equipoSeleccionado.numero_serie}</Text>

                <Text style={styles.detailLabel}>Accesorios:</Text>
                <Text style={styles.detailValue}>{equipoSeleccionado.accesorios}</Text>

                <Text style={styles.detailLabel}>Observaciones:</Text>
                <Text style={styles.detailValue}>{equipoSeleccionado.observaciones}</Text>

                <Text style={styles.detailLabel}>Fecha Entrada:</Text>
                <Text style={styles.detailValue}>
                  {new Date(equipoSeleccionado.fecha_entrada).toLocaleDateString('es-ES')}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setModalDetalleVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  selector: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    elevation: 2,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FC9511',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 4,
    elevation: 3,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#444',
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#222',
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FFD699',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FC9511',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailLabel: {
    width: '45%',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  detailValue: {
    width: '50%',
    marginBottom: 8,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#FC9511',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HistorialCalibracionScreen;
