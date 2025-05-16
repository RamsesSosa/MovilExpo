import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Modal,
  TextInput as RNTextInput,
  Alert,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const TableroScreen = () => {
  const navigation = useNavigation();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [currentObservation, setCurrentObservation] = useState('');
  const [pendingChange, setPendingChange] = useState(null);

  const ordenEstados = [
    "Ingreso",
    "En espera",
    "Calibrando",
    "Calibrado",
    "Etiquetado",
    "Certificado emitido",
    "Listo para entrega",
    "Entregado"
  ];

  const fetchEquipos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch("http://192.168.0.26:8000/api/equipos-proceso/", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Error al cargar equipos");
      
      const data = await response.json();
      
      if (!Array.isArray(data)) throw new Error("Formato de datos incorrecto");

      const processedEquipos = data.map(equipo => ({
        ...equipo,
        estado_actual: equipo.estado_actual?.nombre || "Ingreso",
        cliente_nombre: equipo.cliente || "Cliente no asignado",
        fecha_entrada: formatDate(equipo.fecha_entrada),
        ultima_observacion: equipo.ultima_observacion || "Sin observaciones"
      }));

      setEquipos(processedEquipos);
      await AsyncStorage.setItem('cachedEquipos', JSON.stringify(processedEquipos));
    } catch (err) {
      console.error("Error en fetchEquipos:", err);
      
      // Intentar cargar datos cacheados
      try {
        const cachedData = await AsyncStorage.getItem('cachedEquipos');
        if (cachedData) {
          setEquipos(JSON.parse(cachedData));
          setError(`Error de conexión: ${err.message}. Mostrando datos cacheados.`);
        } else {
          setError(`Error al cargar datos: ${err.message}`);
        }
      } catch (cacheErr) {
        setError(`Error al cargar datos: ${err.message}`);
      }

      if (err.message.includes("autenticación")) {
        navigation.navigate('Login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchEquipos);
    return unsubscribe;
  }, [fetchEquipos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEquipos();
  }, []);

  const fetchEquipoDetalle = async (equipoId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.0.26:8000/api/equipos/${equipoId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Error al cargar detalle");
      return await response.json();
    } catch (err) {
      console.error("Error fetching equipo detail:", err);
      throw err;
    }
  };

  const cambiarEstado = async (equipoId, nuevoEstadoNombre, direction) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    
    // Primero necesitamos obtener el ID del estado basado en su nombre
    const estadoIndex = ordenEstados.indexOf(nuevoEstadoNombre);
    if (estadoIndex === -1) throw new Error("Estado no válido");
    
    // Asumimos que los IDs coinciden con el índice + 1 (esto puede necesitar ajuste según tu backend)
    const estadoId = estadoIndex + 1;

    // Primero actualizamos el estado localmente para una respuesta inmediata
    setEquipos(prev => prev.map(e => {
      if (e.id === equipoId) {
        return {
          ...e,
          estado_actual: nuevoEstadoNombre,
          ultima_observacion: currentObservation || `Cambio ${direction}`
        };
      }
      return e;
    }));

    // Guardamos en caché el cambio
    const updatedEquipos = equipos.map(e => {
      if (e.id === equipoId) {
        return {
          ...e,
          estado_actual: nuevoEstadoNombre,
          ultima_observacion: currentObservation || `Cambio ${direction}`
        };
      }
      return e;
    });
    await AsyncStorage.setItem('cachedEquipos', JSON.stringify(updatedEquipos));

    // Luego hacemos la llamada a la API con el estado_id
    const response = await fetch(`http://192.168.0.26:8000/api/equipos/${equipoId}/cambiar-estado/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        estado_id: estadoId,  // Enviamos el ID en lugar del nombre
        observaciones: currentObservation || `Cambio ${direction}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.error || "Error al cambiar estado");
    }

    // Si la API responde correctamente, actualizamos con los datos frescos
    const updatedEquipo = await response.json();
    setEquipos(prev => prev.map(e => {
      if (e.id === equipoId) {
        return {
          ...e,
          ...updatedEquipo,
          estado_actual: updatedEquipo.estado_actual?.nombre || nuevoEstadoNombre,
          cliente_nombre: updatedEquipo.cliente || e.cliente_nombre,
          fecha_entrada: formatDate(updatedEquipo.fecha_entrada) || e.fecha_entrada,
          ultima_observacion: updatedEquipo.ultima_observacion || currentObservation || `Cambio ${direction}`
        };
      }
      return e;
    }));

    // Actualizamos el caché con los datos frescos
    const freshEquipos = equipos.map(e => {
      if (e.id === equipoId) {
        return {
          ...e,
          ...updatedEquipo,
          estado_actual: updatedEquipo.estado_actual?.nombre || nuevoEstadoNombre,
          cliente_nombre: updatedEquipo.cliente || e.cliente_nombre,
          fecha_entrada: formatDate(updatedEquipo.fecha_entrada) || e.fecha_entrada,
          ultima_observacion: updatedEquipo.ultima_observacion || currentObservation || `Cambio ${direction}`
        };
      }
      return e;
    });
    await AsyncStorage.setItem('cachedEquipos', JSON.stringify(freshEquipos));

    setNotification({
      show: true,
      message: "Estado actualizado correctamente",
      type: "success"
    });
  } catch (err) {
    console.error("Error en cambiarEstado:", err);
    setNotification({
      show: true,
      message: err.message.includes("autenticación") 
        ? "Debes iniciar sesión para realizar esta acción" 
        : err.message,
      type: "error"
    });

    // Revertir el cambio local si falla la API
    fetchEquipos();
  } finally {
    setShowObservationModal(false);
    setCurrentObservation("");
    setPendingChange(null);
    setTimeout(() => setNotification({ show: false }), 3000);
  }
};

  const handleEstadoChange = (equipoId, currentEstadoNombre, direction) => {
    const currentIndex = ordenEstados.indexOf(currentEstadoNombre);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= ordenEstados.length) return;
    
    setPendingChange({ 
      equipoId, 
      nuevoEstadoNombre: ordenEstados[newIndex], 
      direction 
    });
    setShowObservationModal(true);
  };

  const confirmEstadoChange = () => {
    if (!pendingChange) return;
    cambiarEstado(
      pendingChange.equipoId,
      pendingChange.nuevoEstadoNombre,
      pendingChange.direction
    );
  };

  const getEquiposPorEstado = (estadoNombre) => {
    return equipos
      .filter(e => e.estado_actual === estadoNombre)
      .filter(e =>
        e.nombre_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.consecutivo && e.consecutivo.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        e.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const getStatusColor = (statusName) => {
    switch(statusName) {
      case "Ingreso": return "#ff9500";
      case "En espera": return "#a5a5a5";
      case "Calibrando": return "#4fc3f7";
      case "Calibrado": return "#4a6fa5";
      case "Etiquetado": return "#16a085";
      case "Certificado emitido": return "#27ae60";
      case "Listo para entrega": return "#2ecc71";
      case "Entregado": return "#16a085";
      default: return "#cccccc";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('es-ES', options);
    } catch {
      return dateString;
    }
  };

  if (loading && !refreshing) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Cargando datos...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={fetchEquipos}
      >
        <Text style={styles.retryText}>Recargar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {notification.show && (
        <View style={[
          styles.notification, 
          notification.type === 'success' ? styles.notificationSuccess : styles.notificationError
        ]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}

      <Modal
        visible={showObservationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowObservationModal(false);
          setCurrentObservation("");
          setPendingChange(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.observationModal}>
            <Text style={styles.modalTitle}>Agregar Observaciones (Opcional)</Text>
            <RNTextInput
              style={styles.observationInput}
              multiline
              numberOfLines={4}
              value={currentObservation}
              onChangeText={setCurrentObservation}
              placeholder="Ingrese observaciones sobre el cambio de estado..."
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowObservationModal(false);
                  setCurrentObservation("");
                  setPendingChange(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmEstadoChange}
              >
                <Text style={styles.modalButtonText}>Confirmar Cambio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.headerSection}>
        <Text style={styles.title}>Equipos en Proceso de Calibración</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar equipos..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView 
        horizontal 
        style={styles.boardContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {ordenEstados.map((estadoNombre) => {
          const equiposEnEstado = getEquiposPorEstado(estadoNombre);
          const estadoIndex = ordenEstados.indexOf(estadoNombre);

          return (
            <View 
              key={estadoNombre} 
              style={[styles.statusColumn, { borderTopColor: getStatusColor(estadoNombre) }]}
            >
              <View style={styles.columnHeader}>
                <Text style={styles.columnTitle}>{estadoNombre}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{equiposEnEstado.length}</Text>
                </View>
              </View>
              <ScrollView style={styles.equiposList}>
                {equiposEnEstado.length > 0 ? (
                  equiposEnEstado.map(equipo => (
                    <TouchableOpacity 
                      key={equipo.id} 
                      style={styles.equipoCard}
                      onPress={async () => {
                        try {
                          const detalle = await fetchEquipoDetalle(equipo.id);
                          navigation.navigate('DetalleEquipo', { 
                            equipoId: equipo.id,
                            equipoData: detalle?.equipo || equipo,
                            historialData: detalle?.historial || []
                          });
                        } catch (error) {
                          console.error("Error al cargar detalle:", error);
                          Alert.alert("Error", "No se pudo cargar el detalle del equipo");
                        }
                      }}
                    >
                      <View style={styles.equipoHeader}>
                        <Text style={styles.equipoName}>{equipo.nombre_equipo || "Nombre no disponible"}</Text>
                        {equipo.consecutivo && (
                          <Text style={styles.consecutivo}>#{equipo.consecutivo}</Text>
                        )}
                      </View>
                      <View style={styles.equipoDetails}>
                        <Text>
                          <Text style={styles.detailLabel}>Cliente: </Text>
                          {equipo.cliente_nombre || "No especificado"}
                        </Text>
                        <Text>
                          <Text style={styles.detailLabel}>Entrada: </Text>
                          {equipo.fecha_entrada}
                        </Text>
                        {equipo.ultima_observacion && (
                          <Text style={styles.lastObservation}>
                            <Text style={styles.detailLabel}>Última observación: </Text>
                            {equipo.ultima_observacion}
                          </Text>
                        )}
                      </View>
                      <View style={styles.equipoActions}>
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            estadoIndex <= 0 && styles.disabledBtn
                          ]}
                          onPress={(e) => { 
                            e.stopPropagation(); 
                            handleEstadoChange(equipo.id, equipo.estado_actual, 'prev'); 
                          }}
                          disabled={estadoIndex <= 0}
                        >
                          <Text style={styles.actionBtnText}>◄ Anterior</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            estadoIndex >= ordenEstados.length - 1 && styles.disabledBtn
                          ]}
                          onPress={(e) => { 
                            e.stopPropagation(); 
                            handleEstadoChange(equipo.id, equipo.estado_actual, 'next'); 
                          }}
                          disabled={estadoIndex >= ordenEstados.length - 1}
                        >
                          <Text style={styles.actionBtnText}>Siguiente ►</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyStateText}>No hay equipos en este estado</Text>
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Los estilos permanecen igual que en tu código original
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  notification: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 5,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  notificationSuccess: {
    backgroundColor: '#4CAF50',
  },
  notificationError: {
    backgroundColor: '#F44336',
  },
  notificationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  observationModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  observationInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#007bff',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  boardContainer: {
    flexGrow: 0,
  },
  statusColumn: {
    width: 320,
    backgroundColor: '#fff',
    marginRight: 10,
    borderRadius: 8,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 10,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  countBadge: {
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  equiposList: {
    maxHeight: 500,
  },
  equipoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  equipoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  equipoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  consecutivo: {
    fontSize: 14,
    color: '#666',
  },
  equipoDetails: {
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  lastObservation: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 5,
  },
  equipoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default TableroScreen;