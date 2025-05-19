import api from './api';

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

// Join a video session - just returns session details with room URL
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