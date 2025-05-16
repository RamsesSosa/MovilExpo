import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Button
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const DetalleEquipoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { equipoId } = route.params || {};
  const [equipo, setEquipo] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuración de estados con colores
  const estadosConfig = {
    "Ingreso": { color: "#ff9500" },
    "En espera": { color: "#a5a5a5" },
    "Calibrando": { color: "#4fc3f7" },
    "Calibrado": { color: "#4a6fa5" },
    "Etiquetado": { color: "#16a085" },
    "Certificado emitido": { color: "#27ae60" },
    "Listo para entrega": { color: "#2ecc71" },
    "Entregado": { color: "#16a085" }
  };

  useEffect(() => {
    const fetchEquipoDetalle = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`http://192.168.0.26:8000/api/equipos/${equipoId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Error al cargar el detalle del equipo");
        }

        const data = await response.json();
        
        if (!data.equipo || !data.historial) {
          throw new Error("Formato de datos incorrecto");
        }

        // Procesar datos del equipo
        setEquipo(data.equipo);

        // Procesar historial de estados
        const historialProcesado = data.historial
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .map(item => {
            const estadoNombre = item.estado || "Desconocido";
            const estadoColor = estadosConfig[estadoNombre]?.color || "#000000";
            
            return {
              id: item.id || `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              estado: estadoNombre,
              color: estadoColor,
              usuario: item.responsable || "Sistema",
              fecha: new Date(item.fecha).toLocaleString("es-ES"),
              observaciones: item.observaciones || "Cambio de estado"
            };
          });

        setHistorial(historialProcesado);
      } catch (err) {
        console.error("Error en fetchEquipoDetalle:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (equipoId) {
      fetchEquipoDetalle();
    }
  }, [equipoId]);

  const handleVolver = () => navigation.goBack();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando detalles del equipo...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>!</Text>
          <Text>{error}</Text>
          <Button title="Volver" onPress={handleVolver} />
        </View>
      </View>
    );
  }

  if (!equipo) {
    return (
      <View style={styles.noEquipoContainer}>
        <Text>No se encontró el equipo solicitado</Text>
        <Button title="Volver" onPress={handleVolver} />
      </View>
    );
  }

  const estadoActual = equipo.estado_actual || "Ingreso";
  const estadoColor = estadosConfig[estadoActual]?.color || "#000000";

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Detalles del Equipo</Text>
          <TouchableOpacity onPress={handleVolver}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Información del equipo */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información del Equipo</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{equipo.nombre_equipo || "No especificado"}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Consecutivo:</Text>
              <Text style={styles.infoValue}>{equipo.consecutivo || "No especificado"}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>{equipo.cliente || "No especificado"}</Text>
            </View>
            
            {equipo.marca && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Marca:</Text>
                <Text style={styles.infoValue}>{equipo.marca}</Text>
              </View>
            )}
            
            {equipo.modelo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modelo:</Text>
                <Text style={styles.infoValue}>{equipo.modelo}</Text>
              </View>
            )}
            
            {equipo.numero_serie && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>N° Serie:</Text>
                <Text style={styles.infoValue}>{equipo.numero_serie}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado Actual:</Text>
              <View style={[styles.estadoBadge, { backgroundColor: estadoColor }]}>
                <Text style={styles.estadoBadgeText}>{estadoActual}</Text>
              </View>
            </View>
            
            {equipo.accesorios && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Accesorios:</Text>
                <Text style={styles.infoValue}>{equipo.accesorios}</Text>
              </View>
            )}
            
            {equipo.observaciones && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Observaciones:</Text>
                <Text style={styles.infoValue}>{equipo.observaciones}</Text>
              </View>
            )}
          </View>

          {/* Historial del equipo */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historial de Estados</Text>
            
            {historial.length > 0 ? (
              <>
                <View style={styles.responsableSection}>
                  <Text style={styles.sectionTitle}>Último Responsable</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Usuario:</Text>
                    <Text style={styles.infoValue}>{historial[0]?.usuario || "No asignado"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fecha/Hora:</Text>
                    <Text style={styles.infoValue}>{historial[0]?.fecha}</Text>
                  </View>
                </View>

                <View style={styles.historialSection}>
                  <Text style={styles.sectionTitle}>Registro Completo</Text>
                  <View style={styles.historialList}>
                    {historial.map((item) => (
                      <View key={item.id} style={styles.historialItem}>
                        <View style={[styles.historialEstado, { backgroundColor: item.color }]}>
                          <Text style={styles.historialEstadoText}>{item.estado}</Text>
                        </View>
                        <View style={styles.historialDetails}>
                          <Text style={styles.historialUsuario}>{item.usuario}</Text>
                          <Text style={styles.historialFecha}>{item.fecha}</Text>
                          {item.observaciones && (
                            <Text style={styles.historialAccion}>{item.observaciones}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.sinHistorial}>
                <Text>Este equipo no tiene historial registrado</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  contentContainer: {
    flexDirection: 'column',
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noEquipoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#555',
  },
  infoValue: {
    flex: 1,
    marginLeft: 10,
    textAlign: 'right',
  },
  estadoBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignSelf: 'flex-end',
  },
  estadoBadgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  responsableSection: {
    marginBottom: 20,
  },
  historialSection: {
    marginTop: 20,
  },
  historialList: {
    marginTop: 10,
  },
  historialItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  historialEstado: {
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  historialEstadoText: {
    color: '#fff',
    fontWeight: '600',
  },
  historialDetails: {
    flex: 1,
  },
  historialUsuario: {
    fontWeight: '600',
    marginBottom: 3,
  },
  historialFecha: {
    color: '#666',
    fontSize: 12,
    marginBottom: 3,
  },
  historialAccion: {
    fontStyle: 'italic',
    color: '#555',
  },
  sinHistorial: {
    padding: 15,
    alignItems: 'center',
  },
});

export default DetalleEquipoScreen;