import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const LoadingIndicator = ({ message = 'Loading...' }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default LoadingIndicator;