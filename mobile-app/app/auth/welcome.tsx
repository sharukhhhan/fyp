import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import DividerWithText from '@/components/DividerWithText';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.background}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/7648339/pexels-photo-7648339.jpeg' }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
      </View>
      
      <View style={styles.content}>
        <Animated.View 
          style={styles.headerContainer}
          entering={FadeInDown.duration(800).delay(200)}
        >
          <Text style={styles.title}>NotariApp</Text>
          <Text style={styles.subtitle}>Notarize documents anytime, anywhere</Text>
        </Animated.View>
        
        <Animated.View 
          style={styles.buttonsContainer}
          entering={FadeInUp.duration(800).delay(400)}
        >
          <Button 
            label="Create an Account" 
            onPress={() => router.push('/auth/register')}
            variant="primary"
          />
          
          <View style={styles.spacing} />
          
          <Button 
            label="Sign In" 
            onPress={() => router.push('/auth/login')}
            variant="secondary"
          />
          
          <DividerWithText text="Or continue with" />
          
          <View style={styles.socialButtonsRow}>
            <Button 
              label="Google" 
              onPress={() => {}}
              variant="outline"
              style={styles.socialButton}
            />
            
            <View style={styles.buttonGap} />
            
            <Button 
              label="Apple" 
              onPress={() => {}}
              variant="outline"
              style={styles.socialButton}
            />
          </View>
          
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink} onPress={() => {}}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.termsLink} onPress={() => {}}>
              Privacy Policy
            </Text>
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%', 
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 54, 93, 0.75)', // Deep blue with opacity
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  headerContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Roboto-Bold',
    fontSize: 32,
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  spacing: {
    height: 16,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
  },
  buttonGap: {
    width: 16,
  },
  termsText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  termsLink: {
    fontFamily: 'Roboto-Medium',
    textDecorationLine: 'underline',
  },
});