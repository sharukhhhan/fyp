
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
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockDataService, Document } from '@/services/mockData';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(
    mockDataService.getDocuments().filter(doc => doc.status === 'pending')
  );
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const { toast } = useToast();

  const handlePreview = (document: Document) => {
    setSelectedDocument(document);
    setIsPreviewDialogOpen(true);
  };

  const handleSign = (documentId: string) => {
    const success = mockDataService.signDocument(documentId);
    
    if (success) {
      // Update local state
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      
      toast({
        title: "Document Signed",
        description: "The document has been successfully signed",
      });
      
      // If the document is being previewed, close the preview
      if (selectedDocument && selectedDocument.id === documentId) {
        setIsPreviewDialogOpen(false);
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to sign the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Documents to Sign">
      {documents.length === 0 ? (
        <div className="text-center p-10">
          <h3 className="text-xl font-medium text-gray-700">No documents pending signature</h3>
          <p className="text-muted-foreground mt-2">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{document.title}</CardTitle>
                <CardDescription>
                  Uploaded by: {document.uploadedBy}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Submitted: {format(new Date(document.submissionDate), 'PPp')}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handlePreview(document)}
                >
                  Preview
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleSign(document.id)}
                >
                  Sign
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            <DialogDescription>
              Uploaded by {selectedDocument?.uploadedBy} on {selectedDocument && format(new Date(selectedDocument.submissionDate), 'PPp')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Mock document preview */}
            <div className="border rounded-lg p-6 min-h-[300px] bg-gray-50">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Document Preview</h3>
                <p className="text-sm text-muted-foreground">
                  This is a simulated preview of the document. In a real application,
                  this would display the actual document content or a PDF viewer.
                </p>
                <div className="h-40 border border-dashed border-gray-300 rounded flex items-center justify-center">
                  <p className="text-muted-foreground">Document Content</p>
                </div>
                <p className="text-sm">
                  Please review the document carefully before signing.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedDocument && handleSign(selectedDocument.id)}
            >
              Sign Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DocumentsPage;
