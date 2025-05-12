import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ConsultaEquipoScreen = () => {
   return (
      <View style={styles.container}>
        <Text style={styles.title}>Consultar Equipo</Text>
        <Text>Aquí irá el equipo que quieras consultar.</Text>
      </View>
    );
  };
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
  });
export default ConsultaEquipoScreen;
