import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Upload, Check } from 'lucide-react-native';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { Platform } from 'react-native';

export default function VerifyIdScreen() {
  const { completeRegistration } = useAuth();
  const [documentType, setDocumentType] = useState<'passport' | 'license' | null>(null);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePicture = async (side: 'front' | 'back') => {
    if (Platform.OS === 'web') {
      // Web platforms need different handling for camera access
      Alert.alert(
        "Platform Limitation",
        "Camera access is not available in web preview. Please upload an image instead."
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        "Permission Required",
        "Please grant camera permissions to take a picture."
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        if (side === 'front') {
          setFrontImage(result.assets[0].uri);
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.error('Error taking picture:', err);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const pickImage = async (side: 'front' | 'back') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        "Permission Required",
        "Please grant media library permissions to select an image."
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        if (side === 'front') {
          setFrontImage(result.assets[0].uri);
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!documentType || !frontImage || (documentType === 'license' && !backImage)) {
      Alert.alert('Missing Information', 'Please provide all required document images.');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, you would upload the images to your server
      // and process the ID verification
      await completeRegistration();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Verification error:', err);
      Alert.alert('Error', 'Failed to verify your ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Verify Your Identity</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select ID Type</Text>
        
        <View style={styles.documentOptions}>
          <TouchableOpacity 
            style={[
              styles.documentOption,
              documentType === 'passport' && styles.documentOptionSelected
            ]}
            onPress={() => setDocumentType('passport')}
          >
            <Text style={[
              styles.documentOptionText,
              documentType === 'passport' && styles.documentOptionTextSelected
            ]}>
              Passport
            </Text>
            {documentType === 'passport' && (
              <Check size={16} color="#fff" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.documentOption,
              documentType === 'license' && styles.documentOptionSelected
            ]}
            onPress={() => setDocumentType('license')}
          >
            <Text style={[
              styles.documentOptionText,
              documentType === 'license' && styles.documentOptionTextSelected
            ]}>
              Driver's License
            </Text>
            {documentType === 'license' && (
              <Check size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        
        {documentType && (
          <Animated.View 
            style={styles.uploadSection}
            entering={FadeInUp.duration(400)}
            exiting={FadeOut.duration(200)}
          >
            <Text style={styles.sectionTitle}>
              Upload {documentType === 'passport' ? 'Passport' : 'Driver\'s License'}
            </Text>
            
            <View style={styles.idUploadContainer}>
              {/* Front of ID */}
              <View style={styles.uploadCard}>
                <Text style={styles.uploadLabel}>
                  {documentType === 'passport' ? 'Passport Photo Page' : 'Front Side'}
                </Text>
                
                {frontImage ? (
                  <Animated.View 
                    style={styles.imagePreviewContainer}
                    entering={FadeIn.duration(300)}
                  >
                    <Image 
                      source={{ uri: frontImage }} 
                      style={styles.imagePreview} 
                    />
                    <TouchableOpacity 
                      style={styles.retakeButton}
                      onPress={() => setFrontImage(null)}
                    >
                      <Text style={styles.retakeButtonText}>Change</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ) : (
                  <View style={styles.uploadActions}>
                    <TouchableOpacity 
                      style={styles.uploadAction}
                      onPress={() => takePicture('front')}
                    >
                      <Camera size={24} color={Colors.dark.primaryBlue} />
                      <Text style={styles.uploadActionText}>Camera</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.uploadAction}
                      onPress={() => pickImage('front')}
                    >
                      <Upload size={24} color={Colors.dark.primaryBlue} />
                      <Text style={styles.uploadActionText}>Upload</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              {/* Back of ID (only for driver's license) */}
              {documentType === 'license' && (
                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>Back Side</Text>
                  
                  {backImage ? (
                    <Animated.View 
                      style={styles.imagePreviewContainer}
                      entering={FadeIn.duration(300)}
                    >
                      <Image 
                        source={{ uri: backImage }} 
                        style={styles.imagePreview} 
                      />
                      <TouchableOpacity 
                        style={styles.retakeButton}
                        onPress={() => setBackImage(null)}
                      >
                        <Text style={styles.retakeButtonText}>Change</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ) : (
                    <View style={styles.uploadActions}>
                      <TouchableOpacity 
                        style={styles.uploadAction}
                        onPress={() => takePicture('back')}
                      >
                        <Camera size={24} color={Colors.dark.primaryBlue} />
                        <Text style={styles.uploadActionText}>Camera</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.uploadAction}
                        onPress={() => pickImage('back')}
                      >
                        <Upload size={24} color={Colors.dark.primaryBlue} />
                        <Text style={styles.uploadActionText}>Upload</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.securityNote}>
          Your ID is securely processed and verified. We do not store the actual images.
        </Text>
        
        <Button 
          label="Submit for Verification" 
          onPress={handleSubmit}
          variant="primary"
          disabled={
            !documentType || 
            !frontImage || 
            (documentType === 'license' && !backImage)
          }
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    color: Colors.dark.text,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  documentOptions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  documentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  documentOptionSelected: {
    backgroundColor: Colors.dark.primaryBlue,
    borderColor: Colors.dark.primaryBlue,
  },
  documentOptionText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.text,
  },
  documentOptionTextSelected: {
    color: '#fff',
    marginRight: 8,
  },
  uploadSection: {
    flex: 1,
  },
  idUploadContainer: {
    flex: 1,
  },
  uploadCard: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  uploadLabel: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadAction: {
    alignItems: 'center',
    padding: 16,
  },
  uploadActionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.primaryBlue,
    marginTop: 8,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  retakeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.dark.teal,
    borderRadius: 20,
  },
  retakeButtonText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#fff',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  securityNote: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: Colors.dark.textDim,
    textAlign: 'center',
    marginBottom: 16,
  },
});