import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

const QuickAccessScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Accesos Rápidos</Text>
    <FlatList
      data={[
        { id: '1', name: 'Registrar Cliente', icon: 'person-add', screen: 'RegistroClientes', color: '#007BFF' },
        { id: '2', name: 'Registrar equipo', icon: 'construction', screen: 'RegistroEquipo', color: '#43A047' },
        { id: '3', name: 'Historial Calibracion', icon: 'history', screen: 'HistorialCalibracion', color: '#6A1B9A' },
        { id: '6', name: 'Tablero Tareas', icon: 'dashboard', screen: 'Tablero', color: '#F9A825' },
        { id: '5', name: 'Generar Reporte', icon: 'assessment', screen: 'Reporte', color: '#D32F2F' },
        
      ]}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.cardAccess} 
          onPress={() => navigation.navigate(item.screen)}
        >
          <MaterialIcons name={item.icon} size={40} color={item.color} />
          <Text style={styles.cardText}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  </View>
);



const QRScannerScreen = ({ navigation }) => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isFocused = useIsFocused(); // Para manejar el foco de la pantalla

  useEffect(() => {
    if (isFocused) {
      setScanned(false); // Reinicia el estado cuando la pantalla está enfocada
    }
  }, [isFocused]);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    
    let equipoId = null;
    try {
      const url = new URL(data);
      const pathParts = url.pathname.split('/').filter(part => part !== '');
      if (pathParts[0] === 'equipos' && pathParts[1]) {
        equipoId = pathParts[1];
      }
    } catch (e) {
      console.log("No es una URL válida");
    }

    if (equipoId) {
      navigation.navigate('DetalleEquipo', { 
        id: parseInt(equipoId) // Cambiado a 'id' para que coincida con tu pantalla de detalles
      });
    } else {
      Alert.alert(
        'QR no válido',
        'Este código no corresponde a un equipo registrado',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };


  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <MaterialIcons name="flip-camera-android" size={30} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer} />
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>
      </CameraView>
    </View>
  );
};

const ContenidoScreen = ({ route }) => {
  const { qrData, equipoId } = route.params || {};
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo (en producción deberías hacer una llamada a la API)
  useEffect(() => {
    if (equipoId) {
      // Simulamos una llamada a la API con un timeout
      setTimeout(() => {
        setEquipo({
          nombre_equipo: "Nuevo equipoS",
          consecutivo: "EQ-2023-045",
          marca: "Keysight",
          modelo: "PNA-L N5232C",
          numero_serie: "US12345678",
          estado: "operativo"
        });
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [equipoId]);

  // Mapeo de estados a colores
  const estados = {
    operativo: { nombre: "Operativo", color: "#4CAF50" },
    mantenimiento: { nombre: "En Mantenimiento", color: "#FFC107" },
    baja: { nombre: "De Baja", color: "#F44336" },
    calibracion: { nombre: "En Calibración", color: "#2196F3" }
  };

  const estadoActual = equipo?.estado ? estados[equipo.estado] || { nombre: "Desconocido", color: "#9E9E9E" } : null;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando información del equipo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles del Equipo</Text>
      
      {equipoId ? (
        <>
          {/* Nueva sección con el diseño de tarjeta */}
          {equipo && (
            <View style={styles.gridContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Información del Equipo</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nombre:</Text>
                  <Text style={styles.infoValue}>
                    {equipo?.nombre_equipo || "No especificado"}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Consecutivo:</Text>
                  <Text style={styles.infoValue}>
                    {equipo?.consecutivo || "No especificado"}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Marca:</Text>
                  <Text style={styles.infoValue}>
                    {equipo?.marca || "No especificado"}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Modelo:</Text>
                  <Text style={styles.infoValue}>
                    {equipo?.modelo || "No especificado"}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>N° Serie:</Text>
                  <Text style={styles.infoValue}>
                    {equipo?.numero_serie || "No especificado"}
                  </Text>
                </View>
                
                {estadoActual && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estado Actual:</Text>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoActual.color }]}>
                      <Text style={styles.estadoBadgeText}>{estadoActual.nombre}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Sección original con los detalles del QR */}
          <View style={styles.detailContainer}>
            <Text style={styles.label}>ID del Equipo:</Text>
            <Text style={styles.detailText}>{equipoId}</Text>
          </View>
          
          <View style={styles.detailContainer}>
            <Text style={styles.label}>URL completa:</Text>
            <Text style={styles.detailText}>{qrData}</Text>
          </View>
        </>
      ) : (
        <View style={styles.detailContainer}>
          <Text style={styles.label}>Datos escaneados:</Text>
          <Text style={styles.detailText}>{qrData || 'No hay datos válidos'}</Text>
        </View>
      )}
    </View>
  );
};

const MenuScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF8F00',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={QuickAccessScreen} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          tabBarLabel: 'Inicio'
        }} 
    />

      <Tab.Screen 
        name="QRScanner" 
        component={QRScannerScreen} 
        options={{
            headerShown: false,
            tabBarIcon: ({ focused, size }) => (
              <MaterialIcons 
                name="qr-code-scanner" 
                size={size} 
                color={focused ? '#000' : 'gray'}
              />
            ),
            tabBarLabel: 'Escáner QR'
        }} 
      />


      <Tab.Screen 
        name="ScannerContent" 
        component={ContenidoScreen} 
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#FF8F00',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickAccessItem: {
    display: 'none' // eliminado porque ya no se usa
  },
  quickAccessText: {
    display: 'none' // eliminado porque ya no se usa
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 50,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5,
  },
  focusedContainer: {
    flex: 6,
    borderColor: 'rgba(255,143,0,0.8)',
    borderWidth: 2,
    borderRadius: 10,
  },
  detailContainer: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#FF8F00',
  },
  detailText: {
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    color: '#333',
  },
  // Nuevos estilos para la tarjeta
  gridContainer: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
  },
  cardAccess: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 25,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: 16,
  },
  infoValue: {
    color: '#333',
    fontSize: 16,
  },
  estadoBadge: {
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  estadoBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MenuScreen;