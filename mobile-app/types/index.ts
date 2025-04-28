// Document-related types
export type DocumentStatus = 'draft' | 'pending' | 'ready' | 'completed' | 'rejected';

export interface Document {
  id: string;
  title: string;
  description: string;
  content: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

// Meeting-related types
export type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'canceled';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  durationMinutes: number;
  notaryId: string;
  notaryName: string;
  documentIds: string[];
  status: MeetingStatus;
}

// User-related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
}