import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  Alert,
  Platform
} from 'react-native';
import { 
  IconButton, 
  Button, 
  Dialog, 
  Portal,
  ActivityIndicator,
  useTheme 
} from 'react-native-paper';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../components/LoadingIndicator';

// Mock call data by ID
const getCallById = (id) => {
  // In a real app, this would come from your API
  return {
    id,
    title: 'Document Notarization Session',
    participants: [
      { id: '1', name: 'John Doe', role: 'client' },
      { id: '2', name: 'Jane Smith', role: 'notary' }
    ],
    scheduledTime: new Date().toISOString(),
    documentTitle: 'Residential Lease Agreement',
    status: 'active'
  };
};

const JoinCallScreen = ({ route, navigation }) => {
  const { callId } = route.params;
  const theme = useTheme();
  const isFocused = useIsFocused();
  const cameraRef = useRef(null);
  
  const [call, setCall] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);
  const [exitDialogVisible, setExitDialogVisible] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // Timer for call duration
  const timerRef = useRef(null);

  // Load call details and request permissions
  useEffect(() => {
    const setupCall = async () => {
      try {
        setIsLoading(true);
        
        // Get call data
        const callData = getCallById(callId);
        setCall(callData);
        
        // Request camera and audio permissions
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        
        setHasPermission(
          cameraStatus === 'granted' && audioStatus === 'granted'
        );
        
        // Set participants (mocked for now)
        setParticipants([
          {
            id: '1',
            name: 'You',
            isLocal: true,
            isMuted: false,
            isCameraOff: false
          },
          {
            id: '2',
            name: 'Jane Smith',
            isLocal: false,
            isMuted: false,
            isCameraOff: false
          }
        ]);
      } catch (error) {
        console.error('Error setting up call:', error);
        Alert.alert('Error', 'Failed to setup video call');
      } finally {
        setIsLoading(false);
      }
    };
    
    setupCall();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setExitDialogVisible(true);
        return true;
      }
    );
    
    return () => {
      backHandler.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callId]);

  // Connect to call
  const connectToCall = async () => {
    try {
      setIsConnectionLoading(true);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsCallConnected(true);
      
      // Start call duration timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Auto-hide controls after 5 seconds
      setTimeout(() => {
        setShowControls(false);
      }, 5000);
    } catch (error) {
      console.error('Error connecting to call:', error);
      Alert.alert('Connection Error', 'Failed to connect to the call');
    } finally {
      setIsConnectionLoading(false);
    }
  };

  // Format call duration
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Toggle camera
  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    
    // Update local participant status
    setParticipants(prev => 
      prev.map(p => 
        p.isLocal ? { ...p, isCameraOff: isCameraOn } : p
      )
    );
  };

  // Toggle microphone
  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    
    // Update local participant status
    setParticipants(prev => 
      prev.map(p => 
        p.isLocal ? { ...p, isMuted: !isMicOn } : p
      )
    );
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // Flip camera
  const flipCamera = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  // End call
  const endCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    navigation.goBack();
  };

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Handle permissions not granted
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera and microphone access is required for video calls.
        </Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.permissionButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingIndicator message="Setting up video call..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Main video area */}
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={1}
        onPress={toggleControls}
      >
        {!isCallConnected ? (
          <View style={styles.waitingContainer}>
            <Text style={styles.callTitle}>{call?.title}</Text>
            <Text style={styles.waitingText}>Ready to join the call</Text>
            
            <Button
              mode="contained"
              onPress={connectToCall}
              loading={isConnectionLoading}
              disabled={isConnectionLoading}
              style={styles.joinButton}
            >
              Join Now
            </Button>
          </View>
        ) : (
          <View style={styles.connectedContainer}>
            {/* Remote participant video (would be actual video in real app) */}
            <View style={styles.remoteVideo}>
              <Text style={styles.participantName}>Jane Smith (Notary)</Text>
            </View>
            
            {/* Local participant video preview */}
            <View style={styles.localVideoContainer}>
              {isCameraOn ? (
                <Camera
                  ref={cameraRef}
                  style={styles.localVideo}
                  type={type}
                  ratio="16:9"
                />
              ) : (
                <View style={styles.localVideoOff}>
                  <Ionicons name="videocam-off" size={30} color="white" />
                  <Text style={styles.videoOffText}>Camera Off</Text>
                </View>
              )}
              <Text style={styles.localParticipantName}>You</Text>
            </View>
            
            {/* Call duration */}
            <View style={styles.durationContainer}>
              <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
            </View>
            
            {/* Document info */}
            <View style={styles.documentBanner}>
              <Ionicons name="document-text" size={16} color="white" />
              <Text style={styles.documentText}>
                Document: {call?.documentTitle}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Call controls */}
      {(showControls || !isCallConnected) && (
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isMicOn && styles.controlButtonActive
              ]}
              onPress={toggleMic}
              disabled={!isCallConnected}
            >
              <Ionicons
                name={isMicOn ? "mic" : "mic-off"}
                size={24}
                color="white"
              />
              <Text style={styles.controlText}>
                {isMicOn ? "Mute" : "Unmute"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isCameraOn && styles.controlButtonActive
              ]}
              onPress={toggleCamera}
              disabled={!isCallConnected}
            >
              <Ionicons
                name={isCameraOn ? "videocam" : "videocam-off"}
                size={24}
                color="white"
              />
              <Text style={styles.controlText}>
                {isCameraOn ? "Camera Off" : "Camera On"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={flipCamera}
              disabled={!isCallConnected || !isCameraOn}
            >
              <Ionicons
                name="camera-reverse"
                size={24}
                color="white"
              />
              <Text style={styles.controlText}>
                Flip
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isSpeakerOn && styles.controlButtonActive
              ]}
              onPress={toggleSpeaker}
              disabled={!isCallConnected}
            >
              <Ionicons
                name={isSpeakerOn ? "volume-high" : "volume-mute"}
                size={24}
                color="white"
              />
              <Text style={styles.controlText}>
                {isSpeakerOn ? "Speaker" : "Mute"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {isCallConnected && (
            <TouchableOpacity
              style={styles.endCallButton}
              onPress={() => setExitDialogVisible(true)}
            >
              <Ionicons
                name="call"
                size={26}
                color="white"
              />
              <Text style={styles.endCallText}>
                End
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Exit confirmation dialog */}
      <Portal>
        <Dialog
          visible={exitDialogVisible}
          onDismiss={() => setExitDialogVisible(false)}
        >
          <Dialog.Title>Leave the call?</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to leave this call?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setExitDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={endCall} textColor="#e74c3c">
              Leave
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  callTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 24,
  },
  joinButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  connectedContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 120,
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  localVideo: {
    flex: 1,
  },
  localVideoOff: {
    flex: 1,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOffText: {
    color: 'white',
    marginTop: 8,
  },
  participantName: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: 6,
    borderRadius: 4,
  },
  localParticipantName: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    fontSize: 12,
    padding: 4,
    borderRadius: 4,
  },
  durationContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  durationText: {
    color: 'white',
    fontSize: 14,
  },
  documentBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(52, 152, 219, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  documentText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  controlButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.5)',
  },
  controlText: {
    color: 'white',
    marginTop: 4,
    fontSize: 12,
  },
  endCallButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignSelf: 'center',
  },
  endCallText: {
    color: 'white',
    marginTop: 2,
    fontSize: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
});

export default JoinCallScreen;