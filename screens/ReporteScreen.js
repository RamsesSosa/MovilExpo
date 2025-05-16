import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';

const mesesTexto = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const aniosDisponibles = Array.from(
  { length: new Date().getFullYear() - 2024 },
  (_, i) => (new Date().getFullYear() - i).toString()
);

const API_BASE_URL = 'http://192.168.0.114:8000/api/';
const METRICAS_VOLUMEN_URL = `${API_BASE_URL}metricas/volumen/`;

const ReporteScreen = () => {
  const [mes, setMes] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [reporteData, setReporteData] = useState({
    tiempoCalibracion: "N/A",
    volumenEquipos: {
      recibidos: 0,
      calibrados: 0,
      entregados: 0,
      pendientes: 0
    },
    estados: {}
  });
  
  const [mostrarModalMes, setMostrarModalMes] = useState(false);
  const [mostrarModalAnio, setMostrarModalAnio] = useState(false);

  useEffect(() => {
    fetchMetricasVolumen();
  }, [mes, anio]);

  const fetchMetricasVolumen = async () => {
    setLoading(true);
    try {
      const url = `${METRICAS_VOLUMEN_URL}?mes=${mes + 1}&año=${anio}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Error en los datos recibidos');
      }

      setReporteData({
        tiempoCalibracion: "N/A", // Aún no implementado en el backend
        volumenEquipos: {
          recibidos: data.volumen_trabajo.equipos_recibidos || 0,
          calibrados: data.volumen_trabajo.equipos_calibrados || 0,
          entregados: data.volumen_trabajo.equipos_entregados || 0,
          pendientes: data.volumen_trabajo.equipos_pendientes || 0
        },
        estados: data.estados || {}
      });
    } catch (error) {
      console.error('Error fetching volume metrics:', error);
      Alert.alert('Error', `No se pudo cargar las métricas: ${error.message}`);
      // Resetear a valores por defecto en caso de error
      setReporteData({
        tiempoCalibracion: "N/A",
        volumenEquipos: {
          recibidos: 0,
          calibrados: 0,
          entregados: 0,
          pendientes: 0
        },
        estados: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = async () => {
    setLoading(true);
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #1251B7; background-color: #fff; margin: 0; padding: 0; }
              h1 { text-align: center; color: #FF8F00; margin-top: 30px; }
              .container { padding: 20px; }
              .sectionTitle { font-weight: bold; font-size: 18px; color: #FF8F00; text-align: center; margin-top: 30px; text-transform: uppercase; }
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .table th, .table td { padding: 12px; text-align: left; border: 1px solid #ddd; }
              .table th { background-color: #FF8F00; color: #fff; font-size: 16px; }
              .table td { background-color: #f4f4f4; }
              .table .highlight { background-color: #1251B7; color: #fff; }
              .listItem { font-size: 14px; color: #1251B7; margin-bottom: 5px; }
              .productivitySection { margin-top: 20px; }
              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              .logo { width: 100px; height: auto; }
              .date { font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="date">Generado: ${new Date().toLocaleDateString()}</div>
                <h1>Reporte de Equipos</h1>
                <div class="date">${mesesTexto[mes]} ${anio}</div>
              </div>
              
              <p><strong>Tiempo promedio de calibración:</strong> ${reporteData.tiempoCalibracion}</p>
              
              <div class="sectionTitle">Resumen de Equipos</div>
              <table class="table">
                <tr>
                  <th>Recibidos</th>
                  <th>Calibrados</th>
                  <th>Entregados</th>
                  <th>Pendientes</th>
                </tr>
                <tr>
                  <td>${reporteData.volumenEquipos.recibidos}</td>
                  <td>${reporteData.volumenEquipos.calibrados}</td>
                  <td>${reporteData.volumenEquipos.entregados}</td>
                  <td>${reporteData.volumenEquipos.pendientes}</td>
                </tr>
              </table>
    
              <div class="sectionTitle">Estados de Equipos</div>
              <table class="table">
                <tr>
                  <th>Estado</th>
                  <th>Cantidad</th>
                </tr>
                ${Object.entries(reporteData.estados).map(([estado, cantidad]) => `
                  <tr>
                    <td>${estado}</td>
                    <td>${cantidad}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          </body>
        </html>
      `;
    
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (uri) {
        Alert.alert("Éxito", "El PDF se ha generado correctamente.");
        await Sharing.shareAsync(uri, { dialogTitle: 'Compartir Reporte' });
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert("Error", "No se pudo generar el PDF. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const renderItemEstado = ({ item }) => {
    const [estado, cantidad] = item;
    return (
      <View style={styles.estadoItem}>
        <Text style={styles.estadoNombre}>{estado}</Text>
        <Text style={styles.estadoCantidad}>{cantidad}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reporte de Equipos</Text>

      <View style={styles.pickerContainer}>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setMostrarModalMes(true)}
          disabled={loading}
        >
          <View style={styles.selectorContent}>
            <Text style={styles.selectorText}>Mes: {mesesTexto[mes]}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#FF8F00" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selector}
          onPress={() => setMostrarModalAnio(true)}
          disabled={loading}
        >
          <View style={styles.selectorContent}>
            <Text style={styles.selectorText}>Año: {anio}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#FF8F00" />
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={mostrarModalMes} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Selecciona un mes</Text>
            <FlatList
              data={mesesTexto}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setMes(index);
                    setMostrarModalMes(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={mostrarModalAnio} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Selecciona un año</Text>
            <FlatList
              data={aniosDisponibles}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setAnio(item);
                    setMostrarModalAnio(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF8F00" />
          <Text style={styles.loaderText}>Cargando datos...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.reportBox}>
            <Text style={styles.sectionTitle}>Resumen del mes {mesesTexto[mes]} {anio}</Text>
            
            <View style={styles.metricasContainer}>
              <View style={styles.metricaItem}>
                <Text style={styles.metricaNumero}>{reporteData.volumenEquipos.recibidos}</Text>
                <Text style={styles.metricaTexto}>Recibidos</Text>
              </View>
              <View style={styles.metricaItem}>
                <Text style={styles.metricaNumero}>{reporteData.volumenEquipos.calibrados}</Text>
                <Text style={styles.metricaTexto}>Calibrados</Text>
              </View>
              <View style={styles.metricaItem}>
                <Text style={styles.metricaNumero}>{reporteData.volumenEquipos.entregados}</Text>
                <Text style={styles.metricaTexto}>Entregados</Text>
              </View>
              <View style={styles.metricaItem}>
                <Text style={styles.metricaNumero}>{reporteData.volumenEquipos.pendientes}</Text>
                <Text style={styles.metricaTexto}>Pendientes</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Distribución por estados</Text>
            <FlatList
              data={Object.entries(reporteData.estados)}
              renderItem={renderItemEstado}
              keyExtractor={(item) => item[0]}
              scrollEnabled={false}
              contentContainerStyle={styles.estadosList}
            />
          </View>
        </ScrollView>
      )}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={generarPDF}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Generar PDF</Text>
        <MaterialIcons name="picture-as-pdf" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1251B7',
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    width: '48%',
    backgroundColor: 'white',
    borderColor: '#FF8F00',
    elevation: 2,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    color: '#1251B7',
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  reportBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
    color: '#FF8F00',
  },
  metricasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricaItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1251B7',
    marginBottom: 5,
  },
  metricaTexto: {
    fontSize: 14,
    color: '#666',
  },
  estadosList: {
    paddingHorizontal: 5,
  },
  estadoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  estadoNombre: {
    fontSize: 16,
    color: '#333',
  },
  estadoCantidad: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1251B7',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#FF8F00',
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    width: '80%',
    maxHeight: '60%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FF8F00',
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#666',
  },
});

export default ReporteScreen;