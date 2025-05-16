import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const LogoutButton = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
  
    const handleLogout = async () => {
      // Для отладки - проверяем, вызывается ли функция
      console.log('Logout button pressed');
      
      // Разные подходы для разных платформ
      if (Platform.OS === 'web') {
        // На Web некоторые диалоги могут не работать должным образом
        if (confirm('Are you sure you want to logout?')) {
          await performLogout();
        }
      } else {
        // На мобильных устройствах используем Alert
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Logout',
              onPress: performLogout,
            },
          ],
          { cancelable: true }
        );
      }
    };
  
    const performLogout = async () => {
      setIsLoading(true);
      console.log('Performing logout...');
      
      try {
        // Вызов функции logout из вашего authService
        const result = await logout();
        console.log('Logout result:', result);
        
        // Успешный выход - перенаправляем на экран логина
        // Важно: не проверяйте просто result, так как он может быть true/false или объектом
        if (result === true || (result && result.success)) {
          // Перенаправление на экран входа
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }], // Замените 'Login' на название вашего экрана входа
          });
        } else {
          console.warn('Logout returned unexpected result:', result);
          if (Platform.OS !== 'web') {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          } else {
            console.error('Failed to logout. Please try again.');
          }
        }
      } catch (error) {
        console.error('Logout error:', error);
        
        if (Platform.OS !== 'web') {
          Alert.alert('Error', 'Failed to logout. Please try again.');
        } else {
          console.error('Failed to logout. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <Button
      mode="contained"
      onPress={handleLogout}
      loading={isLoading}
      disabled={isLoading}
      style={[styles.button, style]}
      buttonColor="#e74c3c"
      textColor="white"
      icon={showIcon ? 'logout' : null}
    >
      Logout
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
  },
});

export default LogoutButton;