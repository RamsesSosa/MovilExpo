import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Button
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

// Componente para la pantalla de acceso rápido
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

// Componente para el scanner QR
const QRScannerScreen = ({ navigation }) => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setScanned(false);
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

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    
    let equipoId = null;
    try {
      // Intenta extraer el ID de una URL
      const url = new URL(data);
      const pathParts = url.pathname.split('/').filter(part => part !== '');
      if (pathParts[0] === 'equipos' && pathParts[1]) {
        equipoId = pathParts[1];
      }
    } catch (e) {
      // Si no es una URL, verifica si es directamente un ID numérico
      if (/^\d+$/.test(data)) {
        equipoId = data;
      }
    }

    if (equipoId) {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`http://192.168.0.26:8000/api/equipos/${equipoId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          // Navegamos directamente a la pantalla DetalleEquipo con los parámetros
          navigation.navigate('DetalleEquipo', { 
            equipoId: parseInt(equipoId),
            refreshKey: Date.now() // Añadimos clave de actualización
          });
        } else {
          throw new Error("Equipo no encontrado");
        }
      } catch (error) {
        Alert.alert(
          'Error',
          'No se pudo cargar la información del equipo',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
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

// Componente principal del menú
const MenuScreen = ({ navigation }) => {
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
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="qr-code-scanner" color={color} size={size} />
          ),
          tabBarLabel: 'Escáner QR'
        }} 
      />
    </Tab.Navigator>
  );
};

// Estilos (se mantienen igual)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'column',
    gap: 20,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
});

export default MenuScreen;