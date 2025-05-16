import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Button,
  Alert
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://192.168.0.26:8000/api';

const HistorialCalibraciones = () => {
  const navigation = useNavigation();
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaConsecutivo, setBusquedaConsecutivo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [equipoDetalle, setEquipoDetalle] = useState(null);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [clientesPage, setClientesPage] = useState(1);
  const [clientesTotalPages, setClientesTotalPages] = useState(1);
  const [clientesLoadingMore, setClientesLoadingMore] = useState(false);

  // Función para cargar equipos con filtros
  const fetchEquipos = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/equipos-proceso/`;
      
      const response = await axios.get(url);
      let equiposData = response.data;

      // Aplicar filtro por cliente si está seleccionado
      if (clienteSeleccionado) {
        equiposData = equiposData.filter(equipo => 
          equipo.cliente === clienteSeleccionado.nombre_cliente
        );
      }

      // Aplicar filtro por consecutivo si hay búsqueda
      if (busquedaConsecutivo.trim() !== '') {
        const searchTerm = busquedaConsecutivo.trim().toLowerCase();
        equiposData = equiposData.filter(equipo => 
          equipo.consecutivo.toLowerCase().includes(searchTerm)
        );
      }

      setEquipos(equiposData);
      setError(null);
    } catch (err) {
      console.error('Error fetching equipos:', err);
      setError('Error al cargar los equipos');
      setEquipos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clienteSeleccionado, busquedaConsecutivo]);

  // Función para cargar clientes con paginación
  const fetchClientes = useCallback(async (page = 1, reset = true) => {
  try {
    if (reset) {
      setLoadingClientes(true);
    } else {
      setClientesLoadingMore(true);
    }
    
    const response = await axios.get(`${API_URL}/clientes/?page=${page}`);
    
    // Verificar si la respuesta tiene datos
    if (!response.data || !response.data.results) {
      throw new Error('Formato de respuesta inválido');
    }

    const nuevosClientes = response.data.results;
    const count = response.data.count || 0;
    const nextPage = response.data.next;
    const hasMore = !!nextPage; // Determina si hay más páginas

    setClientes(reset ? nuevosClientes : [...clientes, ...nuevosClientes]);
    setClientesTotalPages(hasMore ? page + 1 : page); // Actualiza el total de páginas
    setClientesPage(page);
    
  } catch (err) {
    console.error('Error fetching clientes:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: err.config?.url
    });
    
    // Si es error 404 (página no existe), no intentar cargar más
    if (err.response?.status === 404) {
      setClientesTotalPages(clientesPage); // Establece el total de páginas a la página actual
    } else {
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    }
  } finally {
    setLoadingClientes(false);
    setClientesLoadingMore(false);
  }
}, [clientes, clientesPage]);

// Función para cargar más clientes - Versión corregida
const handleLoadMoreClientes = () => {
  // Verificar que no esté cargando y que haya más páginas
  if (!clientesLoadingMore && clientesPage < clientesTotalPages) {
    fetchClientes(clientesPage + 1, false);
  }
};

  // Función para cargar detalles completos del equipo
  const fetchDetallesEquipo = useCallback(async (equipoId) => {
    try {
      setLoadingDetalles(true);
      const response = await axios.get(`${API_URL}/equipos/${equipoId}/`);
      setEquipoDetalle(response.data.equipo);
      setShowEquipoModal(true);
    } catch (err) {
      console.error('Error cargando detalles del equipo:', err);
      Alert.alert('Error', 'No se pudieron cargar todos los detalles del equipo');
      
      // Mostrar al menos los datos básicos que ya tenemos
      const equipoBasico = equipos.find(e => e.id === equipoId);
      if (equipoBasico) {
        setEquipoDetalle({
          nombre_equipo: equipoBasico.nombre_equipo || 'N/A',
          consecutivo: equipoBasico.consecutivo || 'N/A',
          cliente: equipoBasico.cliente || 'N/A',
          marca: 'N/A',
          modelo: 'N/A',
          numero_serie: 'N/A',
          accesorios: 'N/A',
          observaciones: 'N/A'
        });
        setShowEquipoModal(true);
      }
    } finally {
      setLoadingDetalles(false);
    }
  }, [equipos]);

  // Carga inicial
  useEffect(() => {
    fetchEquipos();
    fetchClientes(1, true);
  }, []);

  // Refrescar datos
  const onRefresh = () => {
    setRefreshing(true);
    fetchEquipos();
    fetchClientes(1, true);
  };

  // Buscar equipos
  const handleBuscarConsecutivo = () => {
    fetchEquipos();
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setClienteSeleccionado(null);
    setBusquedaConsecutivo('');
    fetchEquipos();
  };

  // Renderizar equipo
  const renderEquipo = ({ item }) => (
    <TouchableOpacity onPress={() => {
      fetchDetallesEquipo(item.id);
    }}>
      <View style={styles.row}>
        <Text style={styles.cell}>{item.nombre_equipo}</Text>
        <Text style={styles.cell}>{item.consecutivo}</Text>
        <Text style={styles.cell}>{item.cliente}</Text>
        <Text style={styles.cell}>
          {new Date(item.fecha_entrada).toLocaleDateString('es-ES')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
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

      <View style={styles.filterContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.label}>Filtrar por Cliente</Text>
          <TouchableOpacity 
            style={styles.selector} 
            onPress={() => setShowClienteModal(true)}
          >
            <Text style={styles.selectorText}>
              {clienteSeleccionado ? clienteSeleccionado.nombre_cliente : 'Todos los clientes'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.label}>Buscar por Consecutivo</Text>
          <View style={styles.searchContainer}>
            <TextInput
              value={busquedaConsecutivo}
              onChangeText={setBusquedaConsecutivo}
              placeholder="Ingrese el consecutivo"
              style={styles.input}
              onSubmitEditing={handleBuscarConsecutivo}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleBuscarConsecutivo}
            >
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {(clienteSeleccionado || busquedaConsecutivo) && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleLimpiarFiltros}
          >
            <Text style={styles.clearButtonText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showClienteModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Seleccione un cliente</Text>
          <FlatList
            data={[{id: null, nombre_cliente: 'Todos los clientes'}, ...clientes]}
            keyExtractor={item => item.id ? `cliente-${item.id}` : 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.item} 
                onPress={() => {
                  setClienteSeleccionado(item.id ? item : null);
                  setShowClienteModal(false);
                  fetchEquipos();
                }}
              >
                <Text style={styles.itemText}>{item.nombre_cliente}</Text>
              </TouchableOpacity>
            )}
            onEndReached={handleLoadMoreClientes}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              clientesLoadingMore ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : null
            )}
          />
          <Button 
            title="Cerrar" 
            onPress={() => setShowClienteModal(false)} 
            color="#FC9511"
          />
        </View>
      </Modal>

      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Equipo</Text>
        <Text style={styles.headerCell}>Consecutivo</Text>
        <Text style={styles.headerCell}>Cliente</Text>
        <Text style={styles.headerCell}>Fecha Entrada</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchEquipos()}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={equipos}
          keyExtractor={item => `equipo-${item.id}`}
          renderItem={renderEquipo}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {clienteSeleccionado 
                  ? `No se encontraron equipos para el cliente: ${clienteSeleccionado.nombre_cliente}`
                  : busquedaConsecutivo
                  ? `No se encontraron equipos con el consecutivo: ${busquedaConsecutivo}`
                  : 'No se encontraron equipos'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showEquipoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEquipoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalCardTitle}>Detalles del Equipo</Text>
            {loadingDetalles ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : equipoDetalle ? (
              <ScrollView contentContainerStyle={styles.detailContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nombre:</Text>
                  <Text style={styles.detailValue}>{equipoDetalle.nombre_equipo || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Marca:</Text>
                  <Text style={styles.detailValue}>{equipoDetalle.marca || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Modelo:</Text>
                  <Text style={styles.detailValue}>{equipoDetalle.modelo || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>N° Serie:</Text>
                  <Text style={styles.detailValue}>{equipoDetalle.numero_serie || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Consecutivo:</Text>
                  <Text style={styles.detailValue}>{equipoDetalle.consecutivo || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>{equipoDetalle.cliente || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Accesorios:</Text>
                  <Text style={styles.detailValue}>{equipoDetalle.accesorios || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Observaciones:</Text>
                  <Text style={styles.detailValue}>{equipoDetalle.observaciones || 'N/A'}</Text>
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.errorText}>No se pudieron cargar los detalles</Text>
            )}
            <TouchableOpacity
              onPress={() => setShowEquipoModal(false)}
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

// Estilos (se mantienen igual)
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
  filterContainer: {
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 12,
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
    backgroundColor: '#f9f9f9',
    elevation: 2,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    elevation: 2,
    marginRight: 8,
  },
  searchButton: {
    padding: 12,
    backgroundColor: '#FC9511',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    alignItems: 'center',
    marginTop: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center'
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
  detailContainer: {
    padding: 10,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
    width: '40%',
  },
  detailValue: {
    color: '#333',
    width: '55%',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#FC9511',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HistorialCalibraciones;