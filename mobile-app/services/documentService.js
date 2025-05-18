import api from './api';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Upload identity document
export const uploadIdentityDocument = async (documentData) => {
  try {
    // Create FormData object
    const formData = new FormData();
    
    // Add file to FormData
    // The URI from expo-document-picker needs to be formatted
    const fileUri = documentData.file.uri;
    const uriParts = fileUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('file', {
      uri: fileUri,
      name: documentData.file.name || `document.${fileType}`,
      type: `application/${fileType === 'pdf' ? 'pdf' : 'octet-stream'}`
    });
    
    // Add required fields as per the API specification
    formData.append('document_number', documentData.document_number);
    formData.append('full_name', documentData.full_name);
    formData.append('date_of_birth', documentData.date_of_birth);
    formData.append('issue_date', documentData.issue_date);
    formData.append('expiry_date', documentData.expiry_date);
    formData.append('type', documentData.type);
    
    console.log('Sending identity document data:', {
      document_number: documentData.document_number,
      full_name: documentData.full_name,
      date_of_birth: documentData.date_of_birth,
      issue_date: documentData.issue_date,
      expiry_date: documentData.expiry_date,
      type: documentData.type,
      fileName: documentData.file.name
    });
    
    const response = await api.post('/api/identity-documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response) {
      throw new Error('Failed to upload document: No response from server');
    }
    
    return response;
  } catch (error) {
    console.error('Identity document upload error:', error);
    if (error.response && error.response.data) {
      const errorMessage = error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data);
      throw new Error(errorMessage);
    }
    throw new Error('Failed to upload document: Network or server error');
  }
};

// Create a new document
export const createDocument = async (documentData) => {
  try {
    if (documentData.documentFile) {
      const formData = new FormData();
      
      formData.append('file', {
        uri: documentData.documentFile.uri,
        name: documentData.documentFile.name,
        type: documentData.documentFile.type
      });
      
      Object.keys(documentData).forEach(key => {
        if (key !== 'documentFile') {
          formData.append(key, documentData[key]);
        }
      });
      
      return await api.post('/api/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      return await api.post('/api/documents/', documentData);
    }
  } catch (error) {
    throw error;
  }
};

// Update an existing document
export const updateDocument = async (id, updatedData) => {
  try {
    if (updatedData.documentFile && updatedData.documentFile.uri) {
      const formData = new FormData();
      
      formData.append('file', {
        uri: updatedData.documentFile.uri,
        name: updatedData.documentFile.name,
        type: updatedData.documentFile.type
      });
      
      Object.keys(updatedData).forEach(key => {
        if (key !== 'documentFile') {
          formData.append(key, updatedData[key]);
        }
      });
      
      return await api.patch(`/api/documents/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
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
// Get or create document directory
const getDocumentDirectory = async () => {
  const docDir = `${FileSystem.documentDirectory}documents/`;
  const dirInfo = await FileSystem.getInfoAsync(docDir);
  
  if (!dirInfo.exists) {
    console.log("Creating documents directory");
    await FileSystem.makeDirectoryAsync(docDir, { intermediates: true });
  }
  
  return docDir;
};

// Get file mime type based on extension
const getFileMimeType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'txt': 'text/plain'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

export const downloadDocument = async (id) => {
  try {
    console.log(`Downloading document with ID: ${id}`);
    
    // Get auth token to append to download URL
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Get document details to determine file type
    const documentDetails = await fetchDocumentById(id);
    console.log('Document details for download:', documentDetails);
    
    // Determine file extension based on document details
    const fileType = documentDetails?.file_type || 'pdf';
    const extension = fileType.toLowerCase() === 'pdf' ? 'pdf' : 
                     fileType.toLowerCase().includes('doc') ? 'docx' : 
                     fileType.toLowerCase() === 'image/jpeg' ? 'jpg' : 
                     'pdf';
    
    // Get or create documents directory
    const docDir = await getDocumentDirectory();
    const filename = `document_${id}.${extension}`;
    const fileUri = `${docDir}${filename}`;
    
    console.log(`Downloading from API to ${fileUri}`);
    
    // Download file with authentication header
    const downloadResult = await FileSystem.downloadAsync(
      `${api.defaults.baseURL}/api/documents/${id}/download/`,
      fileUri,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Download result:', downloadResult);
    
    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }
    
    // Add file to media library if it's an image
    if (['jpg', 'jpeg', 'png'].includes(extension)) {
      try {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        console.log('Saved image to media library');
      } catch (err) {
        console.warn('Could not save to media library:', err);
      }
    }
    
    return fileUri;
  } catch (error) {
    console.error('Error downloading document:', error);
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
    const url = `${api.defaults.baseURL}/api/signed-documents/${id}/download/`;
    const { uri } = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + filename
    );
    return uri;
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
