
export interface VerificationRequest {
  id: string;
  userName: string;
  userId: string;
  dateSubmitted: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  documentTitle?: string;
}

export interface Document {
  id: string;
  title: string;
  uploadedBy: string;
  uploadedById: string;
  submissionDate: string;
  status: 'pending' | 'signed';
}

export interface Meeting {
  id: string;
  dateTime: string;
  userName: string;
  userId: string;
  documentTitle?: string;
  documentId?: string;
  meetingUrl?: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

// Mock verification requests
const verificationRequests: VerificationRequest[] = [
  {
    id: 'vr-001',
    userName: 'Айбек',
    userId: 'user-001',
    dateSubmitted: '2025-05-14T10:30:00',
    status: 'pending',
    documentTitle: 'Доверенность на машину' 
  },
];

// Mock documents
const documents: Document[] = [
  {
    id: 'doc-001',
    title: 'Доверенность на машину',
    uploadedBy: 'Айбек',
    uploadedById: 'user-001',
    submissionDate: '2025-05-14T10:30:00',
    status: 'pending'
  },
];

// Mock meetings
const meetings: Meeting[] = [
  {
    id: 'meet-001',
    dateTime: '2025-05-20T14:00:00',
    userName: 'Айбек',
    userId: 'user-001',
    documentTitle: 'Доверенность на машину',
    documentId: 'doc-001',
    meetingUrl: 'https://video-call/meet-001'
  },
];

// Mock available time slots for meetings
const timeSlots: TimeSlot[] = [
  { id: 'ts-001', time: '2025-05-20T09:00:00', available: true },
  { id: 'ts-002', time: '2025-05-20T10:00:00', available: true },
  { id: 'ts-003', time: '2025-05-20T11:00:00', available: false },
  { id: 'ts-004', time: '2025-05-20T13:00:00', available: true },
  { id: 'ts-005', time: '2025-05-20T14:00:00', available: false },
  { id: 'ts-006', time: '2025-05-20T15:00:00', available: true },
  { id: 'ts-007', time: '2025-05-21T09:00:00', available: true },
  { id: 'ts-008', time: '2025-05-21T10:30:00', available: false },
  { id: 'ts-009', time: '2025-05-21T13:00:00', available: true },
  { id: 'ts-010', time: '2025-05-21T15:00:00', available: true }
];

export const mockDataService = {
  getVerificationRequests: () => [...verificationRequests],
  getDocuments: () => [...documents],
  getMeetings: () => [...meetings],
  getAvailableTimeSlots: () => timeSlots.filter(slot => slot.available),
  getAllTimeSlots: () => [...timeSlots],
  
  approveVerificationRequest: (requestId: string, meetingTime: string) => {
    const requestIndex = verificationRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      verificationRequests[requestIndex].status = 'approved';
      
      // Create a new meeting
      const request = verificationRequests[requestIndex];
      const newMeeting: Meeting = {
        id: `meet-${Math.random().toString(36).substring(2, 9)}`,
        dateTime: meetingTime,
        userName: request.userName,
        userId: request.userId,
        documentTitle: request.documentTitle,
        meetingUrl: `https://video-call/meeting-${Math.random().toString(36).substring(2, 7)}`
      };
      
      meetings.push(newMeeting);
      
      // Mark the time slot as unavailable
      const timeSlotIndex = timeSlots.findIndex(slot => slot.time === meetingTime);
      if (timeSlotIndex !== -1) {
        timeSlots[timeSlotIndex].available = false;
      }
      
      return true;
    }
    return false;
  },
  
  rejectVerificationRequest: (requestId: string, reason: string) => {
    const requestIndex = verificationRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      verificationRequests[requestIndex].status = 'rejected';
      verificationRequests[requestIndex].rejectionReason = reason;
      return true;
    }
    return false;
  },
  
  signDocument: (documentId: string) => {
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
    if (documentIndex !== -1) {
      documents[documentIndex].status = 'signed';
      return true;
    }
    return false;
  }
};
