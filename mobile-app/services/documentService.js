import api from './api';
import * as FileSystem from 'expo-file-system';

// Fetch all documents for the current user
export const fetchDocuments = async () => {
  try {
    return await api.get('/api/documents/');
  } catch (error) {
    throw error;
  }
};

// Fetch a single document by ID
export const fetchDocumentById = async (id) => {
  try {
    return await api.get(`/api/documents/${id}/`);
  } catch (error) {
    throw error;
  }
};

// Create a new document
export const createDocument = async (documentData) => {
  try {
    // Handle file upload if there's a document file
    if (documentData.documentFile) {
      const formData = new FormData();
      
      // Add document file
      formData.append('file', {
        uri: documentData.documentFile.uri,
        name: documentData.documentFile.name,
        type: documentData.documentFile.type
      });
      
      // Add other document data
      Object.keys(documentData).forEach(key => {
        if (key !== 'documentFile') {
          formData.append(key, documentData[key]);
        }
      });
      
      // Create multipart request
      return await api.post('/api/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Create document without file
      return await api.post('/api/documents/', documentData);
    }
  } catch (error) {
    throw error;
  }
};

// Update an existing document
export const updateDocument = async (id, updatedData) => {
  try {
    // Handle file upload if there's an updated document file
    if (updatedData.documentFile && updatedData.documentFile.uri) {
      const formData = new FormData();
      
      // Add document file
      formData.append('file', {
        uri: updatedData.documentFile.uri,
        name: updatedData.documentFile.name,
        type: updatedData.documentFile.type
      });
      
      // Add other document data
      Object.keys(updatedData).forEach(key => {
        if (key !== 'documentFile') {
          formData.append(key, updatedData[key]);
        }
      });
      
      // Update with multipart request
      return await api.patch(`/api/documents/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Update document without file
      return await api.patch(`/api/documents/${id}/`, updatedData);
    }
  } catch (error) {
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (id) => {
  try {
    await api.delete(`/api/documents/${id}/`);
    return true;
  } catch (error) {
    throw error;
  }
};

// Download a document
export const downloadDocument = async (id, filename) => {
  try {
    // Get download URL or redirect
    const url = `${api.defaults.baseURL}/api/documents/${id}/download/`;
    
    // Download file
    const { uri } = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + filename
    );
    
    return uri;
  } catch (error) {
    throw error;
  }
};

// Request verification for a document
export const requestVerification = async (documentId, notes = '') => {
  try {
    return await api.post('/api/requests/', {
      document: documentId,
      notes
    });
  } catch (error) {
    throw error;
  }
};

// Get verification requests
export const fetchVerificationRequests = async () => {
  try {
    return await api.get('/api/requests/');
  } catch (error) {
    throw error;
  }
};

// Get a specific verification request
export const fetchVerificationRequestById = async (id) => {
  try {
    return await api.get(`/api/requests/${id}/`);
  } catch (error) {
    throw error;
  }
};

// Get signed documents
export const fetchSignedDocuments = async () => {
  try {
    return await api.get('/api/signed-documents/');
  } catch (error) {
    throw error;
  }
};

// Download a signed document
export const downloadSignedDocument = async (id, filename) => {
  try {
    // Get download URL or redirect
    const url = `${api.defaults.baseURL}/api/signed-documents/${id}/download/`;
    
    // Download file
    const { uri } = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + filename
    );
    
    return uri;
  } catch (error) {
    throw error;
  }
};

// Upload identity document
export const uploadIdentityDocument = async (documentData) => {
  try {
    const formData = new FormData();
    
    // Add document file
    formData.append('file', {
      uri: documentData.file.uri,
      name: documentData.file.name,
      type: documentData.file.type
    });
    
    // Add other identity document data
    Object.keys(documentData).forEach(key => {
      if (key !== 'file') {
        formData.append(key, documentData[key]);
      }
    });
    
    return await api.post('/api/identity-documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    throw error;
  }
};

// Sign a document
export const signDocument = async (id, signatureData) => {
  try {
    return await api.post(`/documents/${id}/sign`, signatureData);
  } catch (error) {
    throw error;
  }
};

// Share a document with another user
export const shareDocument = async (id, recipientEmail, permissions = 'view') => {
  try {
    return await api.post(`/documents/${id}/share`, {
      recipientEmail,
      permissions
    });
  } catch (error) {
    throw error;
  }
};

// Get document sharing settings
export const getDocumentSharing = async (id) => {
  try {
    return await api.get(`/documents/${id}/sharing`);
  } catch (error) {
    throw error;
  }
};

// Request notarization for a document
export const requestNotarization = async (id, notarizationData) => {
  try {
    return await api.post(`/documents/${id}/notarize`, notarizationData);
  } catch (error) {
    throw error;
  }
};