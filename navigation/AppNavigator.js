  // navigation/AppNavigator.js
  import React from 'react';
  import { NavigationContainer } from '@react-navigation/native';
  import { createStackNavigator } from '@react-navigation/stack';
  import LoginScreen from '../screens/LoginScreen';
  import RegisterScreen from '../screens/RegisterScreen';
  import MenuScreen from '../screens/MenuScreen';  // Importa el menú principal (la pantalla que te di antes)
  import RegistroEquipoScreen from '../screens/RegistroEquipoScreen'; // Importa la nueva pantalla
  import RegistroClienteScreen from '../screens/RegistroClienteScreen';
  import ConsultaEquipoScreen from '../screens/ConsultaEquipoScreen';
  import HistorialCalibracionScreen from '../screens/HistorialCalibracionScreen';
  import ReporteScreen from '../screens/ReporteScreen';
  import TableroScreen from '../screens/TableroScreen';
  import DetalleEquipoScreen from '../screens/DetalleEquipoScreen';

  const Stack = createStackNavigator();

  const AppNavigator = () => {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="RegistroEquipo" component={RegistroEquipoScreen} />
          <Stack.Screen name="RegistroClientes" component={RegistroClienteScreen} />
          <Stack.Screen name="ConsultaEquipo" component={ConsultaEquipoScreen} />
          <Stack.Screen name="HistorialCalibracion" component={HistorialCalibracionScreen} />
          <Stack.Screen name="Reporte" component={ReporteScreen} />
          <Stack.Screen name="Tablero" component={TableroScreen} />
          <Stack.Screen name="DetalleEquipo" component={DetalleEquipoScreen} />
          

        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  export default AppNavigator;