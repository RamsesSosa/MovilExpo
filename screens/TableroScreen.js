import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Alert,
  Modal,
  TextInput as RNTextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const TableroScreen = () => {
  const navigation = useNavigation();
  const [equipos, setEquipos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [currentObservation, setCurrentObservation] = useState('');
  const [pendingChange, setPendingChange] = useState(null);

  // Orden de estados (debe coincidir con tu backend)
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

  // Función optimizada para obtener datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('access_token');
      
      const [equiposRes, estadosRes, clientesRes, historialRes] = await Promise.all([
        fetch("http://192.168.0.114:8000/api/equipos/", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch("http://192.168.0.114:8000/api/estados-calibracion/", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch("http://192.168.0.114:8000/api/clientes/", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch("http://192.168.0.114:8000/api/historial-equipos/", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (!equiposRes.ok || !estadosRes.ok || !clientesRes.ok || !historialRes.ok) {
        throw new Error("Error al cargar datos");
      }

      const [equiposData, estadosData, clientesData, historialData] = await Promise.all([
        equiposRes.json(),
        estadosRes.json(),
        clientesRes.json(),
        historialRes.json()
      ]);

      // Procesar estados manteniendo el orden definido
      const processedEstados = ordenEstados
        .map(nombre => estadosData.find(e => e.nombre_estado === nombre))
        .filter(Boolean)
        .map((estado, index) => ({
          ...estado,
          color: getStatusColor(estado.nombre_estado)
        }));

      // Organizar historial por equipo
      const historialPorEquipo = historialData.reduce((acc, item) => {
        acc[item.equipo] = acc[item.equipo] || [];
        acc[item.equipo].push(item);
        return acc;
      }, {});

      // Procesar equipos con su estado actual y cliente
      const processedEquipos = equiposData.map(equipo => {
        const historialEquipo = (historialPorEquipo[equipo.id] || [])
          .sort((a, b) => new Date(b.fecha_cambio) - new Date(a.fecha_cambio));
        
        const estadoActual = historialEquipo[0]?.estado || equipo.estado_actual?.id || processedEstados[0]?.id;
        const cliente = clientesData.find(c => c.id === equipo.cliente) || null;

        return {
          ...equipo,
          estado_actual: estadoActual,
          estado: estadoActual, // Mantener compatibilidad
          cliente_nombre: cliente?.nombre_cliente || "Cliente no asignado",
          fecha_entrada: formatDate(equipo.fecha_entrada),
          historial: historialEquipo
        };
      });

      setEstados(processedEstados);
      setClientes(clientesData);
      setEquipos(processedEquipos);
    } catch (err) {
      setError(`Error al cargar datos: ${err.message}`);
      if (err.message.includes("autenticación")) {
        navigation.navigate('Login');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [fetchData, navigation]);

  const cambiarEstado = async (equipoId, nuevoEstadoId, direction) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userString = await AsyncStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      
      const response = await fetch(`http://192.168.0.114:8000/api/historial-equipos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipo: equipoId,
          estado: nuevoEstadoId,
          responsable: user?.id || 1,
          observaciones: currentObservation || `Cambio ${direction}`,
          fecha_cambio: new Date().toISOString()
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Error al cambiar estado");
      }

      // Actualizar el estado local
      const updatedHistorial = await response.json();
      
      setEquipos(prev => prev.map(e => {
        if (e.id === equipoId) {
          return {
            ...e,
            estado_actual: nuevoEstadoId,
            estado: nuevoEstadoId,
            historial: [updatedHistorial, ...e.historial]
          };
        }
        return e;
      }));
  
      setNotification({
        show: true,
        message: "Estado actualizado correctamente",
        type: "success"
      });
    } catch (err) {
      setNotification({
        show: true,
        message: err.message.includes("autenticación") 
          ? "Debes iniciar sesión para realizar esta acción" 
          : err.message,
        type: "error"
      });
      
      if (err.message.includes("autenticación")) {
        navigation.navigate("Login");
      }
    } finally {
      setShowObservationModal(false);
      setCurrentObservation("");
      setPendingChange(null);
      setTimeout(() => setNotification({ show: false }), 3000);
    }
  };

  const handleEstadoChange = (equipoId, currentEstadoId, direction) => {
    const currentIndex = estados.findIndex(e => e.id === currentEstadoId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= estados.length) return;
    
    const nuevoEstado = estados[newIndex];
    if (!nuevoEstado) return;
    
    setPendingChange({ equipoId, nuevoEstadoId: nuevoEstado.id, direction });
    setShowObservationModal(true);
  };

  const confirmEstadoChange = () => {
    if (!pendingChange) return;
    cambiarEstado(
      pendingChange.equipoId,
      pendingChange.nuevoEstadoId,
      pendingChange.direction
    );
  };

  // Función para agrupar equipos por estado
  const getEquiposPorEstado = (estadoId) => {
    return equipos
      .filter(e => e.estado_actual === estadoId)
      .filter(e =>
        e.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.consecutivo && e.consecutivo.toString().includes(searchTerm)) ||
        e.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  // Helper functions
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
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  if (loading) return (
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
        onPress={fetchData}
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

      <ScrollView horizontal style={styles.boardContainer}>
        {estados.map((estado) => {
          const equiposEnEstado = getEquiposPorEstado(estado.id);
          const estadoIndex = estados.findIndex(e => e.id === estado.id);

          return (
            <View 
              key={estado.id} 
              style={[styles.statusColumn, { borderTopColor: estado.color }]}
            >
              <View style={styles.columnHeader}>
                <Text style={styles.columnTitle}>{estado.nombre_estado}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{equiposEnEstado.length}</Text>
                </View>
              </View>
              <ScrollView style={styles.equiposList}>
                {equiposEnEstado.map(equipo => (
                  <TouchableOpacity 
                    key={equipo.id} 
                    style={styles.equipoCard}
                    onPress={() => navigation.navigate('DetalleEquipo', { id: equipo.id })}
                  >
                    <View style={styles.equipoHeader}>
                      <Text style={styles.equipoName}>{equipo.nombre_equipo}</Text>
                      {equipo.consecutivo && (
                        <Text style={styles.consecutivo}>#{equipo.consecutivo}</Text>
                      )}
                    </View>
                    <View style={styles.equipoDetails}>
                      <Text>
                        <Text style={styles.detailLabel}>Cliente: </Text>
                        {equipo.cliente_nombre}
                      </Text>
                      <Text>
                        <Text style={styles.detailLabel}>Entrada: </Text>
                        {equipo.fecha_entrada}
                      </Text>
                      {equipo.historial[0]?.observaciones && (
                        <Text style={styles.lastObservation}>
                          <Text style={styles.detailLabel}>Última observación: </Text>
                          {equipo.historial[0].observaciones}
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
                          estadoIndex >= estados.length - 1 && styles.disabledBtn
                        ]}
                        onPress={(e) => { 
                          e.stopPropagation(); 
                          handleEstadoChange(equipo.id, equipo.estado_actual, 'next'); 
                        }}
                        disabled={estadoIndex >= estados.length - 1}
                      >
                        <Text style={styles.actionBtnText}>Siguiente ►</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

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
});

export default TableroScreen;