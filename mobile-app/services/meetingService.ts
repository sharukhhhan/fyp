// Mock meetings data for development
const MOCK_MEETINGS = [
  {
    id: '1',
    title: 'Document Notarization - Power of Attorney',
    description: 'Notarization of Power of Attorney document',
    scheduledTime: '2023-07-15T14:30:00Z',
    durationMinutes: 30,
    notaryId: '101',
    notaryName: 'Sarah Johnson',
    documentIds: ['1'],
    status: 'scheduled',
  },
  {
    id: '2',
    title: 'Notarize Deed Transfer',
    description: 'Notarization of property deed transfer',
    scheduledTime: '2023-07-18T10:15:00Z',
    durationMinutes: 45,
    notaryId: '102',
    notaryName: 'Michael Chen',
    documentIds: ['4'],
    status: 'scheduled',
  },
  {
    id: '3',
    title: 'Promissory Note Verification',
    description: 'Notarization of loan agreement',
    scheduledTime: '2023-06-10T15:00:00Z',
    durationMinutes: 30,
    notaryId: '103',
    notaryName: 'Emily Davis',
    documentIds: ['5'],
    status: 'completed',
  },
];

// Type definitions
export type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'canceled';

export interface MeetingFilter {
  upcoming?: boolean;
  status?: MeetingStatus;
  month?: number;
  year?: number;
  limit?: number;
}

export interface MeetingScheduleData {
  title: string;
  description?: string;
  documentIds: string[];
  scheduledTime: string;
  durationMinutes?: number;
}

// Service functions
export const getMeetings = async (filter: MeetingFilter = {}) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredMeetings = [...MOCK_MEETINGS];
  const now = new Date();
  
  // Apply filters
  if (filter.upcoming) {
    filteredMeetings = filteredMeetings.filter(
      meeting => new Date(meeting.scheduledTime) >= now
    );
  }
  
  if (filter.status) {
    filteredMeetings = filteredMeetings.filter(
      meeting => meeting.status === filter.status
    );
  }
  
  if (filter.month !== undefined && filter.year !== undefined) {
    filteredMeetings = filteredMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledTime);
      return (
        meetingDate.getMonth() + 1 === filter.month &&
        meetingDate.getFullYear() === filter.year
      );
    });
  }
  
  // Sort by scheduled time
  filteredMeetings.sort((a, b) => 
    new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  );
  
  // Apply limit
  if (filter.limit) {
    filteredMeetings = filteredMeetings.slice(0, filter.limit);
  }
  
  return filteredMeetings;
};

export const getMeetingById = async (id: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const meeting = MOCK_MEETINGS.find(m => m.id === id);
  
  if (!meeting) {
    throw new Error('Meeting not found');
  }
  
  return meeting;
};

export const scheduleMeeting = async (data: MeetingScheduleData) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, this would fetch available notaries from the backend
  const availableNotaries = [
    { id: '101', name: 'Sarah Johnson' },
    { id: '102', name: 'Michael Chen' },
    { id: '103', name: 'Emily Davis' },
  ];
  
  // Randomly select a notary
  const randomIndex = Math.floor(Math.random() * availableNotaries.length);
  const selectedNotary = availableNotaries[randomIndex];
  
  const newMeeting = {
    id: 'new-' + Math.random().toString(36).substr(2, 9),
    ...data,
    durationMinutes: data.durationMinutes || 30,
    notaryId: selectedNotary.id,
    notaryName: selectedNotary.name,
    status: 'scheduled' as MeetingStatus,
  };
  
  // In a real app, this would be saved to a database
  MOCK_MEETINGS.push(newMeeting);
  
  return newMeeting;
};

export const cancelMeeting = async (id: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const meetingIndex = MOCK_MEETINGS.findIndex(m => m.id === id);
  
  if (meetingIndex === -1) {
    throw new Error('Meeting not found');
  }
  
  // Update the meeting status
  MOCK_MEETINGS[meetingIndex] = {
    ...MOCK_MEETINGS[meetingIndex],
    status: 'canceled',
  };
  
  return { success: true };
};

export const joinMeeting = async (id: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const meeting = MOCK_MEETINGS.find(m => m.id === id);
  
  if (!meeting) {
    throw new Error('Meeting not found');
  }
  
  // In a real app, this would return connection details for video call
  return {
    meetingId: id,
    connectionUrl: `https://meeting.example.com/join/${id}`,
    authToken: 'mock-meeting-token-' + Math.random(),
  };
};