import api from './api';
import io from 'socket.io-client';
import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Socket.io instance
let socket = null;

// WebRTC peer connection
let peerConnection = null;

// Initialize video service
export const initializeVideoService = async () => {
  try {
    // Connect to signaling server
    socket = io('https://signaling.yournotaryservice.com', {
      auth: {
        token: await AsyncStorage.getItem('token')
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing video service:', error);
    throw error;
  }
};

// Fetch all video sessions
export const fetchVideoSessions = async () => {
  try {
    return await api.get('/api/sessions/');
  } catch (error) {
    throw error;
  }
};

// Fetch a single video session by ID
export const fetchVideoSessionById = async (id) => {
  try {
    return await api.get(`/api/sessions/${id}/`);
  } catch (error) {
    throw error;
  }
};

// Create a new video session for a verification request
export const createVideoSession = async (requestId, scheduledTime) => {
  try {
    return await api.post('/api/sessions/', {
      request: requestId,
      scheduled_time: scheduledTime
    });
  } catch (error) {
    throw error;
  }
};

// Join a video session
export const joinVideoSession = async (sessionId) => {
  try {
    return await api.get(`/api/sessions/${sessionId}/join/`);
  } catch (error) {
    throw error;
  }
};

// Start a video session (notary only)
export const startVideoSession = async (sessionId) => {
  try {
    return await api.patch(`/api/sessions/${sessionId}/start/`);
  } catch (error) {
    throw error;
  }
};

// End a video session (notary only)
export const endVideoSession = async (sessionId) => {
  try {
    return await api.patch(`/api/sessions/${sessionId}/end/`);
  } catch (error) {
    throw error;
  }
};

// AI Chat with document context
export const chatWithAI = async (prompt, documentType, sessionId = null) => {
  try {
    const payload = {
      action: 'chat',
      prompt: prompt
    };
    
    if (documentType) {
      payload.document_type = documentType;
    }
    
    if (sessionId) {
      payload.session_id = sessionId;
    }
    
    return await api.post('/api/ai-chat/', payload);
  } catch (error) {
    throw error;
  }
};

// Save AI-generated document
export const saveAIDocument = async (sessionId) => {
  try {
    return await api.post('/api/ai-chat/', {
      action: 'save_document',
      session_id: sessionId
    });
  } catch (error) {
    throw error;
  }
};

// Finalize AI-generated document
export const finalizeAIDocument = async (sessionId) => {
  try {
    return await api.post('/api/ai-chat/', {
      action: 'finalize_document',
      session_id: sessionId
    });
  } catch (error) {
    throw error;
  }
};

// Translate document with AI
export const translateDocument = async (sessionId, documentId, targetLanguage) => {
  try {
    return await api.post('/api/ai-chat/', {
      action: 'translate_document',
      session_id: sessionId,
      document_id: documentId,
      target_language: targetLanguage
    });
  } catch (error) {
    throw error;
  }
};

// End AI chat session
export const endAIChatSession = async (sessionId) => {
  try {
    return await api.post('/api/ai-chat/', {
      action: 'end_session',
      session_id: sessionId
    });
  } catch (error) {
    throw error;
  }
};

// Fetch all upcoming video calls
export const fetchVideoCalls = async () => {
  try {
    return await api.get('/video-calls');
  } catch (error) {
    throw error;
  }
};

// Fetch a single video call by ID
export const fetchVideoCallById = async (id) => {
  try {
    return await api.get(`/video-calls/${id}`);
  } catch (error) {
    throw error;
  }
};

// Schedule a new video call
export const scheduleVideoCall = async (callData) => {
  try {
    return await api.post('/video-calls', callData);
  } catch (error) {
    throw error;
  }
};

// Update video call details
export const updateVideoCall = async (id, updatedData) => {
  try {
    return await api.put(`/video-calls/${id}`, updatedData);
  } catch (error) {
    throw error;
  }
};

// Cancel a video call
export const cancelVideoCall = async (id, reason) => {
  try {
    return await api.delete(`/video-calls/${id}`, {
      data: { reason }
    });
  } catch (error) {
    throw error;
  }
};

// Join a video call
export const joinVideoCall = async (callId) => {
  try {
    // Initialize WebRTC connection
    peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:turn.yournotaryservice.com',
          username: 'turnuser',
          credential: 'turnpassword'
        }
      ]
    });
    
    // Connect to the call room
    socket.emit('join-call', { callId });
    
    // Set up event listeners
    setupSocketListeners(callId);
    setupPeerConnectionListeners();
    
    return true;
  } catch (error) {
    console.error('Error joining video call:', error);
    throw error;
  }
};

// Setup socket listeners
const setupSocketListeners = (callId) => {
  // Handle new user joining
  socket.on('user-joined', async (data) => {
    try {
      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send offer to other user
      socket.emit('offer', {
        callId,
        targetUserId: data.userId,
        offer: peerConnection.localDescription
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  });
  
  // Handle receiving offer
  socket.on('offer', async (data) => {
    try {
      // Set remote description
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer back
      socket.emit('answer', {
        callId,
        targetUserId: data.userId,
        answer: peerConnection.localDescription
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  });
  
  // Handle receiving answer
  socket.on('answer', async (data) => {
    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  });
  
  // Handle ICE candidate
  socket.on('ice-candidate', async (data) => {
    try {
      await peerConnection.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  });
  
  // Handle user leaving
  socket.on('user-left', (data) => {
    // Handle user disconnection
    console.log('User left:', data.userId);
  });
  
  // Handle call ended
  socket.on('call-ended', () => {
    // Handle call termination
    endVideoCall();
  });
};

// Setup peer connection listeners
const setupPeerConnectionListeners = () => {
  // Handle ICE candidate generation
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        callId,
        candidate: event.candidate
      });
    }
  };
  
  // Handle connection state changes
  peerConnection.onconnectionstatechange = (event) => {
    console.log('Connection state:', peerConnection.connectionState);
  };
  
  // Handle remote stream
  peerConnection.ontrack = (event) => {
    // Handle remote stream
    // In a real app, you would update the UI with this stream
    console.log('Received remote track');
    return event.streams[0];
  };
};

// End the video call
export const endVideoCall = () => {
  try {
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    // Disconnect from call room
    if (socket) {
      socket.emit('leave-call', { callId });
    }
    
    return true;
  } catch (error) {
    console.error('Error ending video call:', error);
    throw error;
  }
};