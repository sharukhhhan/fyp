// Mock documents data for development
const MOCK_DOCUMENTS = [
  {
    id: '1',
    title: 'Power of Attorney',
    description: 'General power of attorney document for financial matters',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    status: 'completed',
    createdAt: '2023-04-15T10:30:00Z',
    updatedAt: '2023-04-15T14:45:00Z',
  },
  {
    id: '2',
    title: 'Affidavit of Residency',
    description: 'Verification of current residential address',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    status: 'pending',
    createdAt: '2023-05-02T09:15:00Z',
    updatedAt: '2023-05-02T09:15:00Z',
  },
  {
    id: '3',
    title: 'Living Will',
    description: 'Medical directives and end-of-life decisions',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    status: 'draft',
    createdAt: '2023-05-10T11:20:00Z',
    updatedAt: '2023-05-11T16:30:00Z',
  },
  {
    id: '4',
    title: 'Deed Transfer',
    description: 'Transfer of property ownership',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    status: 'ready',
    createdAt: '2023-05-18T14:00:00Z',
    updatedAt: '2023-05-19T10:15:00Z',
  },
  {
    id: '5',
    title: 'Promissory Note',
    description: 'Loan agreement with repayment terms',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    status: 'ready',
    createdAt: '2023-05-22T09:45:00Z',
    updatedAt: '2023-05-22T16:30:00Z',
  },
];

// Type definitions
export type DocumentStatus = 'draft' | 'pending' | 'ready' | 'completed' | 'rejected';

export interface DocumentFilter {
  status?: string;
  limit?: number;
  search?: string;
}

export interface DocumentCreateData {
  title: string;
  description: string;
  content: string;
  status: DocumentStatus;
}

// Service functions
export const getDocuments = async (filter: DocumentFilter = {}) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredDocs = [...MOCK_DOCUMENTS];
  
  // Apply filters
  if (filter.status) {
    filteredDocs = filteredDocs.filter(doc => doc.status === filter.status);
  }
  
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filteredDocs = filteredDocs.filter(
      doc => 
        doc.title.toLowerCase().includes(searchLower) || 
        doc.description.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply limit
  if (filter.limit) {
    filteredDocs = filteredDocs.slice(0, filter.limit);
  }
  
  return filteredDocs;
};

export const getDocumentById = async (id: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const document = MOCK_DOCUMENTS.find(doc => doc.id === id);
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  return document;
};

export const createDocument = async (data: DocumentCreateData) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newDocument = {
    id: 'new-' + Math.random().toString(36).substr(2, 9),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // In a real app, this would be saved to a database
  MOCK_DOCUMENTS.push(newDocument);
  
  return newDocument;
};

export const updateDocument = async (id: string, data: Partial<DocumentCreateData>) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const documentIndex = MOCK_DOCUMENTS.findIndex(doc => doc.id === id);
  
  if (documentIndex === -1) {
    throw new Error('Document not found');
  }
  
  const updatedDocument = {
    ...MOCK_DOCUMENTS[documentIndex],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  // Update the document in our mock data
  MOCK_DOCUMENTS[documentIndex] = updatedDocument;
  
  return updatedDocument;
};

export const deleteDocument = async (id: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const documentIndex = MOCK_DOCUMENTS.findIndex(doc => doc.id === id);
  
  if (documentIndex === -1) {
    throw new Error('Document not found');
  }
  
  // Remove the document from our mock data
  MOCK_DOCUMENTS.splice(documentIndex, 1);
  
  return { success: true };
};