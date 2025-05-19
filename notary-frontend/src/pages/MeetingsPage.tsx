
import React, { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockDataService, Meeting } from '@/services/mockData';

const MeetingsPage: React.FC = () => {
  const [meetings] = useState<Meeting[]>(
    mockDataService.getMeetings()
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleJoinMeeting = (meetingUrl?: string) => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Filter meetings for the selected date
  const meetingsForSelectedDate = selectedDate 
    ? meetings.filter(meeting => 
        isSameDay(new Date(meeting.dateTime), selectedDate)
      )
    : [];

  return (
    <DashboardLayout title="Upcoming Meetings">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6">
          {meetings.length === 0 ? (
            <div className="text-center p-10">
              <h3 className="text-xl font-medium text-gray-700">No upcoming meetings</h3>
              <p className="text-muted-foreground mt-2">Your schedule is clear!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {meetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Meeting with {meeting.userName}</CardTitle>
                    <CardDescription>
                      {format(new Date(meeting.dateTime), 'PPpp')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {meeting.documentTitle && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Document: </span>
                        <span className="font-medium">{meeting.documentTitle}</span>
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleJoinMeeting(meeting.meetingUrl)}
                    >
                      Join Video Call
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="calendar" className="grid md:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardContent className="p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border w-full p-3 pointer-events-auto"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {selectedDate ? format(selectedDate, 'PPPP') : 'Select a date'}
            </h3>
            
            {meetingsForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground">No meetings scheduled for this day.</p>
            ) : (
              <div className="space-y-4">
                {meetingsForSelectedDate.map((meeting) => (
                  <Card key={meeting.id}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">Meeting with {meeting.userName}</CardTitle>
                      <CardDescription>
                        {format(new Date(meeting.dateTime), 'p')}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0">
                      <Button
                        size="sm"
                        onClick={() => handleJoinMeeting(meeting.meetingUrl)}
                      >
                        Join Video Call
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default MeetingsPage;
