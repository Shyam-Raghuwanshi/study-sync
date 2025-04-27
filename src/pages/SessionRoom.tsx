import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  FileText,
  Pencil,
  Sparkles,
  Clock,
  Send,
  BookOpen,
  ChevronLeft,
  Menu,
  Download,
  Trash2,
  Loader2,
  File,
  Image,
  ScreenShare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ResourceUpload from '@/components/dashboard/ResourceUpload';
import { useAuth } from '@clerk/clerk-react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';
import { format } from "date-fns";
import { WhiteBoard } from '@/components/ui/whiteboard';
import AITutorView from '@/components/dashboard/AITutorView';
import { VideoRoom } from '@/components/VideoRoom';
import { RoomsList } from '@/components/RoomsList';
import "@livekit/components-styles";

const SessionRoom = () => {
  const { id, groupId } = useParams<{ id: string, groupId: string }>();
  const [activeTab, setActiveTab] = useState('chat');
  const [showSidebar, setShowSidebar] = useState(true);
  const [message, setMessage] = useState('');
  const { userId } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<Id<"rooms"> | null>(null);

  // Add joinSession mutation
  const joinSession = useMutation(api.studySessions.joinSession);

  // Fetch messages in real-time
  const messages = useQuery(api.messages.getBySession, id ? {
    sessionId: id as Id<"studySessions">,
    limit: 50
  } : 'skip');

  // Get session details
  const session = useQuery(api.studySessions.get, id ? { id: id as Id<"studySessions"> } : 'skip');

  const sendMessage = useMutation(api.messages.send);
  const updateMessage = useMutation(api.messages.update);
  const askAITutor = useAction(api.aiTutor.ask);

  const handleSendMessage = async () => {
    if (!message.trim() || !id || !userId) return;

    try {
      // Send the user's message
      console.log("Sending user message:", message.trim());
      const userMessageId = await sendMessage({
        sessionId: id as Id<"studySessions">,
        userId: userId,
        content: message.trim(),
        isAIGenerated: false
      });
      console.log("User message sent, ID:", userMessageId);

      const userMessage = message.trim();
      setMessage('');

      // If the message mentions the AI tutor, get a response from OpenAI
      if (userMessage.toLowerCase().includes('ai tutor') || userMessage.toLowerCase().includes('@ai')) {
        // Show loading state for AI
        const loadingMessageResult = await sendMessage({
          sessionId: id as Id<"studySessions">,
          userId: 'AI Tutor',
          content: '...',
          isAIGenerated: true
        });

        try {
          // Get recent chat history to provide context to the AI
          const chatHistory = messages ? messages.map(msg => ({
            role: msg.isAIGenerated ? 'assistant' : 'user',
            name: msg.userId,
            content: msg.content
          })).slice(-10) : []; // Get last 10 messages for context

          // Get response from OpenAI through our aiTutor API
          const aiResponse = await askAITutor({
            question: userMessage.replace(/@ai|ai tutor/gi, '').trim(),
            chatHistory: chatHistory // Send the chat history for context
          });

          console.log("AI Response received:", aiResponse);

          // Update the loading message with actual response instead of creating a new one
          if (loadingMessageResult) {
            await updateMessage({
              id: loadingMessageResult,
              content: aiResponse
            });
          } else {
            // Fallback: create a new message if we couldn't get the loading message ID
            await sendMessage({
              sessionId: id as Id<"studySessions">,
              userId: 'AI Tutor',
              content: aiResponse,
              isAIGenerated: true
            });
          }
        } catch (aiError) {
          console.error('Error getting AI response:', aiError);

          // Send a fallback message if the AI fails
          await sendMessage({
            sessionId: id as Id<"studySessions">,
            userId: 'AI Tutor',
            content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
            isAIGenerated: true
          });
        }
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }

    // Debug log to see messages being received
    console.log("Messages updated:", messages?.length, messages);
  }, [messages]);

  // Debug log every render to see component state
  console.log("Rendering SessionRoom with messages:", messages?.length);

  const getGroupResources = useQuery(api.resources.getByGroup, groupId ? { groupId: groupId as any } : 'skip');
  const getDownloadUrl = useMutation(api.resources.getDownloadUrl);
  const deleteResource = useMutation(api.resources.deleteResource);

  const getWhiteboard = useQuery(api.whiteboards.getBySession, id ? { sessionId: id as Id<"studySessions"> } : 'skip');

  // Show loading state while data is being fetched
  if (!messages || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-500">Loading study session...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (!id || !groupId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">Session Not Found</p>
          <p className="text-gray-500 mb-4">This study session doesn't exist or you don't have access to it.</p>
          <Button asChild variant="outline">
            <a href="/dashboard">Return to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  function getResourceIcon(type: string) {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  }

  const handleDownload = async (resourceId: string) => {
    try {
      const downloadUrl = await getDownloadUrl({
        id: resourceId as any,
        userId: userId!,
      });

      // Open the download URL in a new tab
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resource');
    }
  };

  const handleDelete = async (resourceId: string) => {
    try {
      await deleteResource({
        id: resourceId as any,
        userId: userId!,
      });
      toast.success('Resource deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete resource');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" asChild className="mr-2">
                <a href={`/dashboard`}>
                  <ChevronLeft className="h-5 w-5" />
                </a>
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{session.name}</h1>
                <p className="text-sm text-gray-500">{session.groupName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                <Clock className="h-4 w-4 mr-2" />
                <span>{format(new Date(session.startTime), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>

              <div className="flex -space-x-2">
                {session.participants.slice(0, 3).map((participant) => (
                  <Avatar key={participant.id} className="h-8 w-8 border-2 border-white">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {session.participants.length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                    +{session.participants.length - 3}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Study Room Area */}
        <div className={cn(
          "flex-1 transition-all",
          showSidebar ? "lg:mr-80" : ""
        )}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="bg-white border-b">
              <div className="container mx-auto px-4">
                <TabsList className="h-14">
                  <TabsTrigger value="chat" className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="screen-sharing" className="flex items-center">
                    <ScreenShare className="h-4 w-4 mr-2" />
                    Screen Sharing
                  </TabsTrigger>
                  <TabsTrigger value="document" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Document
                  </TabsTrigger>
                  <TabsTrigger value="whiteboard" className="flex items-center">
                    <Pencil className="h-4 w-4 mr-2" />
                    Whiteboard
                  </TabsTrigger>
                  <TabsTrigger value="ai-tutor" className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Tutor
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="chat" className="flex-1 p-4 overflow-y-auto" ref={chatContainerRef}>
              <div className="container mx-auto max-w-4xl">
                {/* Debug section - to see if messages are actually coming through */}

                <div className="space-y-4">
                  {messages?.map((msg) => (
                    <div key={msg._id} className="flex items-start space-x-3">
                      <Avatar className={cn("h-9 w-9", msg.isAIGenerated && "border-2 border-tertiary")}>
                        <AvatarFallback>{msg.userId[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{msg.userId}</span>
                          {msg.isAIGenerated && (
                            <Badge variant="outline" className="bg-tertiary/10 text-tertiary border-tertiary/20 text-xs">
                              AI Tutor
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-800 whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Chat input (only on chat tab) */}
            {activeTab === 'chat' && (
              <div className="bg-white border-t p-4">
                <div className="container mx-auto max-w-4xl">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message... (@ mention AI Tutor for help)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <TabsContent value="document" className="flex-1 flex items-center justify-center p-4">
              <div className="text-center p-8 max-w-md">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Collaborative Document Editor</h3>
                <p className="text-gray-500 mb-4">
                  This is where you'll work on shared documents in real-time with your study group members.
                </p>
                {userId && <ResourceUpload
                  groupId={groupId}
                  sessionId={id}
                  onUploadComplete={() => {
                    // Refresh resources list
                    // invalidateQuery();
                  }}
                />}
              </div>
              <div className="space-y-4">
                {getGroupResources?.map((resource) => (
                  <div
                    key={resource._id}
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-3 rounded">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div>
                        <p className="font-medium">{resource.name}</p>
                        {resource.description && (
                          <p className="text-sm text-gray-500">{resource.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Added by {resource.createdBy} • {new Date(resource._creationTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(resource._id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {userId === resource.createdBy && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resource._id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {getGroupResources?.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No resources have been uploaded yet.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="whiteboard" className="flex-1 flex flex-col px-10 mt-0">
              {getWhiteboard?.[0] && (
                <WhiteBoard />
              )}
            </TabsContent>

            <TabsContent value="ai-tutor" className="flex-1 flex items-center justify-center p-4">
              <div className="text-center p-8 max-w-2xl">
                <Sparkles className="h-12 w-12 text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">AI Study Assistant</h3>
                <p className="text-gray-500 mb-4">
                  Get explanations, generate practice problems, or create study materials with AI assistance.
                </p>
                <AITutorView sessionId={id} />
              </div>
            </TabsContent>

            <TabsContent value="screen-sharing" className="flex-1">
              {id && (
                <div className="container mx-auto p-6 max-w-5xl">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2">Screen Sharing</h2>
                    <p className="text-gray-600">Share your screen or join an existing room to collaborate with others</p>
                  </div>
                  
                  {activeRoomId ? (
                    <VideoRoom roomId={activeRoomId} onLeave={() => setActiveRoomId(null)} />
                  ) : (
                    <RoomsList onJoinRoom={setActiveRoomId} sessionId={id as Id<"studySessions">} />
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <ChevronLeft onClick={toggleSidebar} className={cn("h-6 w-6 text-black absolute z-[999] top-[50%]", showSidebar ? "right-[20.4rem]" : "right-[1rem]")} />
        <div className={cn(
          "fixed top-[58px] right-0 bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto transition-transform z-20",
          showSidebar ? "translate-x-0" : "translate-x-full"
        )}>

          <div className="p-4">
            <Tabs defaultValue="participants">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="participants">
                  <Users className="h-4 w-4 mr-2" />
                  Participants
                </TabsTrigger>
                <TabsTrigger value="resources">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="participants">
                <h3 className="font-medium text-sm text-gray-500 mb-3">Active now ({session.participants.filter(p => p.active).length})</h3>
                <div className="space-y-3">
                  {session.participants.filter(p => p.active).map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={participant.avatar} alt={participant.name} />
                          <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-tertiary border-2 border-white"></span>
                      </div>
                      <span className="font-medium">{participant.name}</span>
                    </div>
                  ))}
                </div>

                <h3 className="font-medium text-sm text-gray-500 mt-6 mb-3">Away ({session.participants.filter(p => !p.active).length})</h3>
                <div className="space-y-3">
                  {session.participants.filter(p => !p.active).map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      <Avatar className="opacity-60">
                        <AvatarImage src={participant.avatar} alt={participant.name} />
                        <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-gray-500">{participant.name}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resources">
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">Quantum Mechanics Notes</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Uploaded by Alex • PDF • 2.4 MB</p>
                      <Button size="sm" variant="outline" className="w-full">View</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">Wave Functions Problems</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Uploaded by Maria • PDF • 1.8 MB</p>
                      <Button size="sm" variant="outline" className="w-full">View</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-tertiary/10 p-2 rounded">
                          <Sparkles className="h-4 w-4 text-tertiary" />
                        </div>
                        <span className="font-medium">AI-Generated Practice Exam</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Generated by AI Tutor • PDF • 1.2 MB</p>
                      <Button size="sm" variant="outline" className="w-full">View</Button>
                    </CardContent>
                  </Card>

                  <Button variant="ghost" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Upload Resource
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div >
  );
};

export default SessionRoom;
