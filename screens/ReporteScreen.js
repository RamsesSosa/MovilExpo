import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const mesesTexto = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const aniosDisponibles = Array.from(
  { length: new Date().getFullYear() - 1999 },
  (_, i) => (2000 + i).toString()
);

const API_BASE_URL = 'http://192.168.0.26:8000/api/';
const METRICAS_VOLUMEN_URL = `${API_BASE_URL}metricas/volumen/`;

const ReporteScreen = () => {
  const [mes, setMes] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
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
      const response = await fetch(`${METRICAS_VOLUMEN_URL}?mes=${mes + 1}&anio=${anio}`);
      if (!response.ok) {
        throw new Error('Error al obtener las métricas de volumen');
      }
      const data = await response.json();
      
      setReporteData({
        tiempoCalibracion: "N/A",
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
      Alert.alert('Error', 'No se pudo cargar las métricas de volumen');
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = async () => {
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
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reporte de Equipos - ${mesesTexto[mes]} / ${anio}</h1>
            
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
  
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (uri) {
        Alert.alert("PDF Generado", "El PDF se ha generado con éxito.");
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo generar el PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reporte de Equipos</Text>

      <View style={styles.pickerContainer}>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setMostrarModalMes(true)}
        >
          <Text>Mes: {mesesTexto[mes]}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selector}
          onPress={() => setMostrarModalAnio(true)}
        >
          <Text>Año: {anio}</Text>
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
                  <Text>{item}</Text>
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
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {loading ? (
        <ActivityIndicator size="large" color="#FF8F00" style={styles.loader} />
      ) : (
        <View style={styles.reportBox}>
          <Text style={styles.sectionTitle}>Resumen del mes {mesesTexto[mes]} / {anio}</Text>
          <Text style={styles.text}>📥 Equipos recibidos: {reporteData.volumenEquipos.recibidos}</Text>
          <Text style={styles.text}>🛠️ Equipos calibrados: {reporteData.volumenEquipos.calibrados}</Text>
          <Text style={styles.text}>📤 Equipos entregados: {reporteData.volumenEquipos.entregados}</Text>
          <Text style={styles.text}>⏳ Equipos pendientes: {reporteData.volumenEquipos.pendientes}</Text>
          <Text style={styles.text}>⏱️ Tiempo promedio de calibración: {reporteData.tiempoCalibracion}</Text>

          <Text style={styles.sectionTitle}>Estados de Equipos:</Text>
          {Object.entries(reporteData.estados).map(([estado, cantidad]) => (
            <Text key={estado} style={styles.text}>
              {estado}: {cantidad}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={generarPDF}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Generar PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1251B7',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  selector: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    minWidth: 120,
    alignItems: 'center',
    borderColor: '#FF8F00',
  },
  reportBox: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#FF8F00',
  },
  text: {
    marginVertical: 3,
    textAlign: 'center',
    color: '#1251B7',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#FF8F00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    width: '80%',
    maxHeight: 300,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF8F00',
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  loader: {
    marginTop: 50,
  },
});

export default ReporteScreen;