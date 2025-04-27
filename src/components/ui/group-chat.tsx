import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { useAuth } from '@clerk/clerk-react';
import { ScrollArea } from './scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  SendIcon,
  PaperclipIcon,
  SmileIcon,
  FileIcon,
  XIcon,
  ImageIcon,
  FileTextIcon,
  FileArchiveIcon,
  FilmIcon
} from 'lucide-react';
import { Textarea } from './textarea';
import { Skeleton } from './skeleton';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import ResourceUpload from '../dashboard/ResourceUpload';

interface GroupChatProps {
  groupId: string;
  className?: string;
}

interface AttachmentInfo {
  storageId: string;
  name: string;
  type: string;
  file: File;
}

export function GroupChat({ groupId, className }: GroupChatProps) {
  const { userId } = useAuth();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [attachmentInfo, setAttachmentInfo] = useState<AttachmentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages for this group
  const messages = useQuery(api.messages.getGroupMessages, {
    groupId: groupId as Id<"studyGroups">,
    limit: 50
  });

  // Error handling for messages query
  useEffect(() => {
    // Check if there's an error in the messages query
    if (messages === undefined) {
      // We're still loading, not an error yet
      setError(null);
    } else if (messages === null) {
      // This is an error condition
      setError("Unable to load messages. You might need to join this group first.");
    } else {
      // Messages loaded successfully
      setError(null);
    }
  }, [messages]);

  // Debug logging
  useEffect(() => {
    console.log("GroupChat messages:", messages);
  }, [messages]);

  // Fetch active typers
  const activeTypers = useQuery(api.messages.getGroupActiveTypers, {
    groupId: groupId as Id<"studyGroups">
  });

  // Messages mutations
  const sendMessage = useMutation(api.messages.sendGroupMessage);
  const setTypingStatus = useMutation(api.messages.setGroupTypingStatus);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current && messages && messages.length > 0) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      setTypingStatus({
        groupId: groupId as Id<"studyGroups">,
        isTyping: true
      });
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      setTypingStatus({
        groupId: groupId as Id<"studyGroups">,
        isTyping: false
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Handle resource upload completion with enhanced file preview
  const handleResourceUploaded = (storageId: string, name: string, type: string, file: File) => {
    setAttachmentInfo({
      storageId,
      name,
      type,
      file
    });
  };

  // Remove attachment
  const removeAttachment = () => {
    setAttachmentInfo(null);
  };

  // Send message handler - enhanced to handle attachments
  const handleSendMessage = async () => {
    if ((!message.trim() && !attachmentInfo) || !userId) return;

    try {
      const content = message.trim() || `Shared a file: ${attachmentInfo?.name}`;

      await sendMessage({
        groupId: groupId as Id<"studyGroups">,
        content: content,
        type: attachmentInfo ? "resource" : "text",
        attachmentUrl: attachmentInfo ? `convex://${attachmentInfo.storageId}` : undefined,
        attachmentType: attachmentInfo ? attachmentInfo.type : undefined
      });

      // Reset states
      setMessage('');
      setAttachmentInfo(null);

      // Reset typing status
      setIsTyping(false);
      setTypingStatus({
        groupId: groupId as Id<"studyGroups">,
        isTyping: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message groups
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messageList: any[] | undefined) => {
    if (!messageList || messageList.length === 0) {
      return [];
    }

    const groups: { date: string; timestamp: number; messages: any[] }[] = [];

    messageList.forEach(msg => {
      const date = formatDate(msg.timestamp);

      // Find if we already have this date group
      const existingGroup = groups.find(group => group.date === date);

      if (existingGroup) {
        existingGroup.messages.push(msg);
      } else {
        groups.push({
          date,
          timestamp: msg.timestamp,
          messages: [msg]
        });
      }
    });

    return groups.sort((a, b) => a.timestamp - b.timestamp);
  };

  // Render typing indicator if anyone is typing
  const renderTypingIndicator = () => {
    if (!activeTypers || activeTypers.length === 0) return null;

    const names = activeTypers.map(typer => typer.userId).join(', ');

    return (
      <div className="text-xs text-muted-foreground italic px-2 py-1">
        <span className="inline-block animate-bounce mr-1">•</span>
        {activeTypers.length === 1 ? (
          <span>{names} is typing...</span>
        ) : (
          <span>{names} are typing...</span>
        )}
      </div>
    );
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (fileType.startsWith('video/')) {
      return <FilmIcon className="h-4 w-4" />;
    } else if (fileType.startsWith('text/')) {
      return <FileTextIcon className="h-4 w-4" />;
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
      return <FileArchiveIcon className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  // Create a preview for the attachment
  const renderAttachmentPreview = () => {
    if (!attachmentInfo) return null;

    const { name, type, file } = attachmentInfo;
    const isImage = type.startsWith('image/');

    return (
      <div className="p-2 border rounded-md mb-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate max-w-[90%]">
            {getFileIcon(type)}
            <span className="text-sm font-medium truncate">{name}</span>
          </div>
          <button
            onClick={removeAttachment}
            className="text-muted-foreground hover:text-destructive"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {isImage && (
          <div className="mt-2 relative">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="rounded-md max-h-32 w-auto"
            />
          </div>
        )}
      </div>
    );
  };

  // Enhanced rendering of message content with better previews
  const renderMessageContent = (msg: any) => {
    // Check if it's a resource attachment
    if (msg.type === 'resource' && msg.attachmentUrl) {
      const isImage = msg.attachmentType?.startsWith('image/');
      const isVideo = msg.attachmentType?.startsWith('video/');
      const fileUrl = msg.attachmentUrl.replace('convex://', '/api/resource/');

      return (
        <div>
          <p className="text-sm mb-2">{msg.content}</p>
          <div className="border rounded-md p-2 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              {getFileIcon(msg.attachmentType || '')}
              <span className="text-sm font-medium">{msg.attachmentUrl.split('/').pop()}</span>
            </div>

            {isImage && (
              <div className="mt-1">
                <img
                  src={fileUrl}
                  alt="Attachment"
                  className="rounded-md max-h-48 w-auto object-contain"
                  onError={(e) => {
                    // If image fails to load, hide it
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white hover:underline mt-2 inline-block"
              download
            >
              Download
            </a>
          </div>
        </div>
      );
    }

    return <p className="text-sm">{msg.content}</p>;
  };

  if (messages === undefined) {
    return (
      <Card className={cn("w-full h-[500px] flex flex-col", className)}>
        <CardHeader>
          <CardTitle>Group Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-1/2 ml-auto" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-10 w-3/4 ml-auto" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Show error message if there's an error (likely not a member)
  if (error || messages === null) {
    return (
      <Card className={cn("w-full h-[500px] flex flex-col", className)}>
        <CardHeader>
          <CardTitle>Group Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center p-6">
            <p className="text-destructive font-medium mb-2">
              You need to be a member of this group to view messages
            </p>
            <p className="text-muted-foreground text-sm">
              Join the group using the "Join Group" button at the top of this page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className={cn("w-full h-[500px] flex flex-col", className)}>
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg">Group Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messageGroups.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No messages yet. Be the first to say hello!</p>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-6">
                <div className="flex justify-center mb-4">
                  <Badge variant="outline" className="bg-background text-xs">
                    {group.date}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {group.messages.map((msg: any) => {
                    const isCurrentUser = msg.userId === userId;

                    return (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex items-start gap-2",
                          isCurrentUser ? "flex-row-reverse" : ""
                        )}
                      >
                        {/* <Avatar className="h-8 w-8 mt-0.5">
                          <AvatarFallback className={cn(`bg-[#${Math.floor(Math.random() * 16777215).toString(16)}]`)}>
                            {msg.userName?.split(" ")[0][0].toUpperCase() + msg.userName?.split(" ")[1][0].toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar> */}

                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 max-w-[80%]",
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {!isCurrentUser && (
                            <p className="text-xs font-medium mb-1">
                              {msg.userName || msg.userId || "Unknown"}
                            </p>
                          )}

                          {renderMessageContent(msg)}

                          <p className="text-xs opacity-70 mt-1 text-right">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {renderTypingIndicator()}
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t flex flex-col gap-2">
        {attachmentInfo && renderAttachmentPreview()}

        <div className="flex w-full items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <ResourceUpload
                    groupId={groupId}
                    onUploadComplete={handleResourceUploaded}
                    autoUpload={true}
                  >
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground flex items-center justify-center w-5 h-5"
                    >
                      <PaperclipIcon className="h-5 w-5" />
                    </button>
                  </ResourceUpload>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach a file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Textarea
            className="flex-1 min-h-9 h-9 resize-none overflow-hidden"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyPress}
            style={{ height: '36px' }}
          />

          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                type="button"
              >
                <SmileIcon className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none" side="top" align="end">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </PopoverContent>
          </Popover>

          <Button
            size="icon"
            className="h-9 w-9"
            onClick={handleSendMessage}
            disabled={!message.trim() && !attachmentInfo}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}