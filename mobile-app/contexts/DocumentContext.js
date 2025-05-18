import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchDocuments, createDocument, updateDocument, fetchDocumentById } from '../services/documentService';
import { useAuth } from './AuthContext';

const DocumentContext = createContext();

export const useDocuments = () => {
  return useContext(DocumentContext);
};

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch documents when user changes
  useEffect(() => {
    if (user) {
      loadDocuments();
    } else {
      setDocuments([]);
    }
  }, [user]);

  // Load all documents for the current user
  const loadDocuments = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchDocuments();
      console.log("Documents response:", response);
      
      // Ensure we have a valid array of documents
      const documents = Array.isArray(response) ? response : 
                       (response && response.data) ? response.data : [];
                       
      setDocuments(documents);
    } catch (error) {
      setError(error.message || 'Failed to load documents');
      console.error('Error loading documents: ', error);
      setDocuments([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single document by ID
  const getDocument = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await fetchDocumentById(id);
    } catch (error) {
      setError(error.message || 'Failed to load document');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new document
  const addDocument = async (documentData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newDocument = await createDocument(documentData);
      setDocuments(prevDocs => [...prevDocs, newDocument]);
      return newDocument;
    } catch (error) {
      setError(error.message || 'Failed to create document');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing document
  const editDocument = async (id, updatedData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedDocument = await updateDocument(id, updatedData);
      
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === id ? updatedDocument : doc
        )
      );
      
      return updatedDocument;
    } catch (error) {
      setError(error.message || 'Failed to update document');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents by status
  const filterDocumentsByStatus = (status) => {
    return documents.filter(doc => doc.status === status);
  };

  const value = {
    documents,
    isLoading,
    error,
    loadDocuments,
    getDocument,
    addDocument,
    editDocument,
    filterDocumentsByStatus,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};