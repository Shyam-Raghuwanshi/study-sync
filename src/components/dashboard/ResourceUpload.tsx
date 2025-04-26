import { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ResourceUploadProps {
  groupId: string;
  sessionId?: string;
  onUploadComplete?: (storageId: string, name: string, type: string, file: File) => void;
  autoUpload?: boolean;
  children?: React.ReactNode;
}

const ResourceUpload = ({ groupId, onUploadComplete, sessionId, autoUpload = false, children }: ResourceUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.resources.generateUploadUrl);
  const createResource = useMutation(api.resources.create);

  // Auto-upload when a file is selected if autoUpload is true
  useEffect(() => {
    if (autoUpload && selectedFile && name) {
      handleUpload();
    }
  }, [selectedFile, name, autoUpload]);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Only reset if we're not in the middle of uploading
      if (!isUploading) {
        setSelectedFile(null);
        setName('');
        setDescription('');
      }
    }
  }, [isOpen, isUploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name || name === '') {
        setName(file.name);
      }
      
      // Reset the file input value to ensure the same file can be selected again
      if (e.target) {
        e.target.value = '';
      }
    }
  };
  
  const handleTriggerClick = (e: React.MouseEvent) => {
    if (autoUpload) {
      e.preventDefault();
      // Directly click the hidden file input
      fileInputRef.current?.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !name) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file to storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile!.type },
        body: selectedFile,
      });
      
      const json = await result.json();
      if (!result.ok) {
        throw new Error(`Upload failed: ${JSON.stringify(json)}`);
      }

      // Get the storage ID from the URL
      const { storageId } = json;

      // Create resource record
      const promise = createResource({
        name,
        storageId,
        groupId: groupId as any,
        sessionId: sessionId as any,
        type: selectedFile.type,
        description: description || undefined,
      });
      
      toast.promise(promise, {
        success: "Resource uploaded successfully!",
        loading: "Uploading resource...",
        error: "Failed to upload resource",
      });
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(storageId, name, selectedFile.type, selectedFile);
      }
      
      if (!autoUpload) {
        setIsOpen(false);
      }

      // Only reset the states if not in auto-upload mode
      if (!autoUpload) {
        setSelectedFile(null);
        setName('');
        setDescription('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload resource');
    } finally {
      setIsUploading(false);
    }
  };

  if (autoUpload) {
    return (
      <div>
        <Input
          id="file"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
        <div onClick={handleTriggerClick} className="cursor-pointer">
          {children || (
            <Button type="button" variant="outline" className="gap-2" disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Attach File"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <FileUp className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dialog-file">File</Label>
            <Input
              id="dialog-file"
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !name || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceUpload;