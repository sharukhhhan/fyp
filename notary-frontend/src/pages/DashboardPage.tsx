
import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockDataService, VerificationRequest, TimeSlot } from '@/services/mockData';

const DashboardPage: React.FC = () => {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(
    mockDataService.getVerificationRequests()
  );
  const [availableTimeSlots] = useState<TimeSlot[]>(
    mockDataService.getAvailableTimeSlots()
  );
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const handleApprove = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setIsApprovalDialogOpen(true);
  };

  const handleReject = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setIsRejectionDialogOpen(true);
  };

  const confirmApproval = () => {
    if (selectedRequest && selectedTime) {
      const success = mockDataService.approveVerificationRequest(selectedRequest.id, selectedTime);
      
      if (success) {
        // Update the local state
        setVerificationRequests(mockDataService.getVerificationRequests());
        
        toast({
          title: "Request Approved",
          description: `Meeting scheduled with ${selectedRequest.userName} for ${format(new Date(selectedTime), 'PPpp')}`,
        });
      }
      
      // Reset and close dialog
      setSelectedRequest(null);
      setSelectedTime('');
      setIsApprovalDialogOpen(false);
    }
  };

  const confirmRejection = () => {
    if (selectedRequest) {
      const success = mockDataService.rejectVerificationRequest(
        selectedRequest.id,
        rejectionReason || "No reason provided"
      );
      
      if (success) {
        // Update the local state
        setVerificationRequests(mockDataService.getVerificationRequests());
        
        toast({
          title: "Request Rejected",
          description: `You've rejected the request from ${selectedRequest.userName}`,
        });
      }
      
      // Reset and close dialog
      setSelectedRequest(null);
      setRejectionReason('');
      setIsRejectionDialogOpen(false);
    }
  };

  const pendingRequests = verificationRequests.filter(req => req.status === 'pending');

  return (
    <DashboardLayout title="Verification Requests">
      {pendingRequests.length === 0 ? (
        <div className="text-center p-10">
          <h3 className="text-xl font-medium text-gray-700">No pending requests</h3>
          <p className="text-muted-foreground mt-2">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="bg-secondary/40 pb-3">
                <CardTitle className="text-lg">{request.userName}</CardTitle>
                <CardDescription>
                  Request ID: {request.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Submitted:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(request.dateSubmitted), 'PPp')}
                    </span>
                  </div>
                  {request.documentTitle && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Document:</span>
                      <span className="text-sm font-medium">{request.documentTitle}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleReject(request)}
                >
                  Reject
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleApprove(request)}
                >
                  Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              {selectedRequest && `Select a time to meet with ${selectedRequest.userName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="time-select">Available Time Slots</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.time}>
                    {format(new Date(slot.time), 'PPp')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApproval} disabled={!selectedTime}>
              Schedule Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && `Please provide a reason for rejecting ${selectedRequest.userName}'s request`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Reason (Optional)</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRejection}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardPage;
