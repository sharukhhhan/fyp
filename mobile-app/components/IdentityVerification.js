import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Button, ProgressBar, IconButton, useTheme } from 'react-native-paper';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

const IdentityVerification = ({ onComplete, onCancel }) => {
  const theme = useTheme();
  const cameraRef = useRef(null);
  
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [idImage, setIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [currentStep, setCurrentStep] = useState('id'); // 'id', 'selfie', 'review'
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle camera ready state
  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  // Take a picture using camera
  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        
        // Resize and compress the image
        const manipResult = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        if (currentStep === 'id') {
          setIdImage(manipResult);
          setCurrentStep('selfie');
          setType(Camera.Constants.Type.front); // Switch to front camera for selfie
        } else if (currentStep === 'selfie') {
          setSelfieImage(manipResult);
          setCurrentStep('review');
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  // Pick image from library
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      // Resize and compress the image
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      if (currentStep === 'id') {
        setIdImage(manipResult);
        setCurrentStep('selfie');
        setType(Camera.Constants.Type.front); // Switch to front camera for selfie
      } else if (currentStep === 'selfie') {
        setSelfieImage(manipResult);
        setCurrentStep('review');
      }
    }
  };

  // Retake photo
  const retakePicture = (step) => {
    if (step === 'id') {
      setIdImage(null);
      setType(Camera.Constants.Type.back);
    } else if (step === 'selfie') {
      setSelfieImage(null);
      setType(Camera.Constants.Type.front);
    }
    setCurrentStep(step);
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlash(
      flash === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  // Submit verification
  const handleSubmit = () => {
    // In a real app, you would upload these images to your server
    // and process them for identity verification
    onComplete({
      idImage,
      selfieImage,
      timestamp: new Date().toISOString(),
    });
  };

  // If permission is not granted
  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera access is required for identity verification.</Text>
        <Button mode="contained" onPress={onCancel} style={styles.button}>
          Go Back
        </Button>
      </View>
    );
  }

  // Render based on current step
  const renderStepContent = () => {
    // ID Capture Step
    if (currentStep === 'id') {
      return (
        <>
          <Text style={styles.instructions}>
            Please take a photo of your ID or passport. Make sure all 4 corners are visible and text is readable.
          </Text>
          
          {!idImage ? (
            <View style={styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={type}
                flashMode={flash}
                onCameraReady={onCameraReady}
              >
                <View style={styles.cameraOverlay}>
                  <View style={styles.topControls}>
                    <IconButton
                      icon="flash"
                      size={24}
                      iconColor={flash === Camera.Constants.FlashMode.on ? theme.colors.primary : '#fff'}
                      onPress={toggleFlash}
                    />
                  </View>
                  
                  <View style={styles.idFrame} />
                  
                  <View style={styles.cameraActions}>
                    <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                      <Ionicons name="images" size={24} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.captureButton}
                      onPress={takePicture}
                      disabled={!isCameraReady}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                    
                    <View style={{ width: 50 }} /> {/* Placeholder for spacing */}
                  </View>
                </View>
              </Camera>
            </View>
          ) : (
            <View style={styles.previewContainer}>
              <Image source={{ uri: idImage.uri }} style={styles.previewImage} />
              <Button 
                mode="contained" 
                onPress={() => retakePicture('id')}
                style={styles.retakeButton}
              >
                Retake Photo
              </Button>
              <Button 
                mode="contained" 
                onPress={() => setCurrentStep('selfie')}
                style={styles.button}
              >
                Continue
              </Button>
            </View>
          )}
        </>
      );
    }
    
    // Selfie Capture Step
    if (currentStep === 'selfie') {
      return (
        <>
          <Text style={styles.instructions}>
            Now please take a selfie for identity verification. Look directly at the camera and make sure your face is clearly visible.
          </Text>
          
          {!selfieImage ? (
            <View style={styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={type}
                flashMode={flash}
                onCameraReady={onCameraReady}
              >
                <View style={styles.cameraOverlay}>
                  <View style={styles.topControls}>
                    <IconButton
                      icon="flash"
                      size={24}
                      iconColor={flash === Camera.Constants.FlashMode.on ? theme.colors.primary : '#fff'}
                      onPress={toggleFlash}
                    />
                  </View>
                  
                  <View style={styles.faceFrame} />
                  
                  <View style={styles.cameraActions}>
                    <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                      <Ionicons name="images" size={24} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.captureButton}
                      onPress={takePicture}
                      disabled={!isCameraReady}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                    
                    <View style={{ width: 50 }} /> {/* Placeholder for spacing */}
                  </View>
                </View>
              </Camera>
            </View>
          ) : (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selfieImage.uri }} style={styles.previewImage} />
              <Button 
                mode="contained" 
                onPress={() => retakePicture('selfie')}
                style={styles.retakeButton}
              >
                Retake Selfie
              </Button>
              <Button 
                mode="contained" 
                onPress={() => setCurrentStep('review')}
                style={styles.button}
              >
                Continue
              </Button>
            </View>
          )}
        </>
      );
    }
    
    // Review and Submit Step
    if (currentStep === 'review') {
      return (
        <>
          <Text style={styles.instructions}>
            Please review your verification images. Make sure both are clear and readable.
          </Text>
          
          <View style={styles.reviewContainer}>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>ID Document</Text>
              <Image source={{ uri: idImage.uri }} style={styles.reviewImage} />
              <TouchableOpacity onPress={() => retakePicture('id')}>
                <Text style={styles.retakeLinkText}>Retake</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Selfie</Text>
              <Image source={{ uri: selfieImage.uri }} style={styles.reviewImage} />
              <TouchableOpacity onPress={() => retakePicture('selfie')}>
                <Text style={styles.retakeLinkText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Submit Verification
          </Button>
        </>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Identity Verification</Text>
        <ProgressBar 
          progress={
            currentStep === 'id' ? 0.33 : 
            currentStep === 'selfie' ? 0.66 : 
            1
          } 
          color={theme.colors.primary} 
          style={styles.progressBar} 
        />
        <View style={styles.stepsContainer}>
          <Text style={styles.stepText}>
            Step {currentStep === 'id' ? '1' : currentStep === 'selfie' ? '2' : '3'} of 3: 
            {currentStep === 'id' ? ' ID Document' : 
             currentStep === 'selfie' ? ' Selfie' : 
             ' Review'}
          </Text>
        </View>
      </View>
      
      {renderStepContent()}
      
      <Button 
        mode="text" 
        onPress={onCancel}
        style={styles.cancelButton}
      >
        Cancel Verification
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginVertical: 10,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  stepText: {
    fontSize: 16,
    color: '#555',
  },
  instructions: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 3/4,
    overflow: 'hidden',
    borderRadius: 8,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
  },
  idFrame: {
    alignSelf: 'center',
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
  },
  faceFrame: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 100,
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 8,
    marginBottom: 20,
  },
  retakeButton: {
    marginBottom: 12,
  },
  button: {
    width: '100%',
  },
  reviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  reviewItem: {
    alignItems: 'center',
    width: '48%',
  },
  reviewLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  reviewImage: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 8,
    marginBottom: 8,
  },
  retakeLinkText: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  submitButton: {
    marginVertical: 20,
  },
  cancelButton: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default IdentityVerification;