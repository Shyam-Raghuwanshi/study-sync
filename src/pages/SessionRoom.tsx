import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ScreenShare,
  X,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ResourceUpload from '@/components/dashboard/ResourceUpload';
import { useAuth, UserButton } from '@clerk/clerk-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from '@clerk/clerk-react';

// Function to generate consistent color from a user ID
const getUserColor = (userId: string) => {
  // Generate a random but consistent color based on user ID
  const hash = Array.from(userId).reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const h = Math.abs(hash % 360);
  const s = 70 + (hash % 20); // 70-90% saturation
  const l = 60 + (hash % 15); // 60-75% lightness

  return `hsl(${h}, ${s}%, ${l}%)`;
};

const SessionRoom = () => {
  const { id, groupId } = useParams<{ id: string, groupId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [showSidebar, setShowSidebar] = useState(true);
  const [message, setMessage] = useState('');
  const { userId } = useAuth();
  const { user } = useUser();
  const [activeRoomId, setActiveRoomId] = useState<Id<"rooms"> | null>(null);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [showDeleteSessionDialog, setShowDeleteSessionDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userColors, setUserColors] = useState<Record<string, string>>({});

  // Add joinSession mutation
  const joinSession = useMutation(api.studySessions.joinSession);
  const endSession = useMutation(api.studySessions.endSession);
  const deleteSession = useMutation(api.studySessions.deleteSession);
  const userRole = useQuery(api.studyGroups.getUserRole, groupId ? { groupId: groupId as Id<"studyGroups"> } : 'skip');
  const getGroupResources = useQuery(api.resources.getByGroup, groupId ? { groupId: groupId as any } : 'skip');
  const getDownloadUrl = useMutation(api.resources.getDownloadUrl);
  const deleteResource = useMutation(api.resources.deleteResource);

  const getWhiteboard = useQuery(api.whiteboards.getBySession, id ? { sessionId: id as Id<"studySessions"> } : 'skip');
  // Fetch messages in real-time
  const messages = useQuery(api.messages.getBySession, id ? {
    sessionId: id as Id<"studySessions">,
    limit: 50
  } : 'skip');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Track user information and populate colors map
  useEffect(() => {
    if (messages) {
      // Create a color for each unique userId in messages
      const newColors: Record<string, string> = {};
      const newUserNames: Record<string, string> = {};

      messages.forEach(msg => {
        // Skip AI messages
        if (msg.isAIGenerated) return;

        // Generate color for this user if we don't have one yet
        if (!userColors[msg.userId]) {
          newColors[msg.userId] = getUserColor(msg.userId);
        }

        // Try to get a username for this user ID
        if (!userNames[msg.userId]) {
          // For the current user, use their name from Clerk
          newUserNames[msg.userId] = msg.userName;
        }
      });

      // If current user isn't in messages yet, add them anyway
      if (userId && !userColors[userId]) {
        newColors[userId] = getUserColor(userId);
      }

      // Update state with new colors and usernames
      setUserColors(prev => ({ ...prev, ...newColors }));
      setUserNames(prev => ({ ...prev, ...newUserNames }));
    }
  }, [messages, userId, user?.fullName]);

  // Get session details
  const session = useQuery(api.studySessions.get, id ? { id: id as Id<"studySessions"> } : 'skip');

  const sendMessage = useMutation(api.messages.send);
  const updateMessage = useMutation(api.messages.update);
  const askAITutor = useAction(api.aiTutor.ask);

  const handleSendMessage = async () => {
    if (!message.trim() || !id || !userId) return;

    try {
      // Send the user's message 
      const userMessageId = await sendMessage({
        sessionId: id as Id<"studySessions">,
        userId: userId,
        content: message.trim(),
        isAIGenerated: false
      });

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
            name: msg.userName,
            content: msg.content
          })).slice(-10) : []; // Get last 10 messages for context

          // Get response from OpenAI through our aiTutor API
          const aiResponse = await askAITutor({
            question: userMessage.replace(/@ai|ai tutor/gi, '').trim(),
            chatHistory: chatHistory // Send the chat history for context
          });


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
  useEffect(() => {
    // Check if user is a session/group admin
    if (session && userId && groupId) {
      // Get group data to check if user is admin
      const checkAdminStatus = async () => {
        try {

          setIsAdmin(userRole === "admin" || session.createdBy === userId);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      };

      checkAdminStatus();
    }
  }, [session, userId, groupId]);
  // Auto-scroll to bottom when new messages arrive

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  // Handle ending a session
  const handleEndSession = async () => {
    if (!id || !userId) return;

    try {
      await endSession({
        sessionId: id as Id<"studySessions">,
        userId: userId
      });

      toast.success("Session ended successfully");
      setShowEndSessionDialog(false);
      // Optional: Navigate back to group details
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end session");
    }
  };

  // Handle deleting a session
  const handleDeleteSession = async () => {
    if (!id || !userId) return;

    try {
      await deleteSession({
        sessionId: id as Id<"studySessions">,
        userId: userId
      });

      toast.success("Session deleted successfully");
      setShowDeleteSessionDialog(false);
      // Navigate back to group details
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  return (
    <>
      {/* Main layout */}
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
                {/* End Session Button - Only visible to admins and when session is active */}
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowEndSessionDialog(true)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    End Session
                  </Button>
                )}

                <div className="flex -space-x-2">
                  <UserButton />
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
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
                  <div className="space-y-4">
                    {messages?.length > 0 ? (
                      messages.map((msg) => (
                        <div key={msg._id} className="flex items-start space-x-3">
                          <Avatar className={cn("h-9 w-9", msg.isAIGenerated && "border-2 border-tertiary")}
                            style={{
                              backgroundColor: msg.isAIGenerated ? 'rgb(111, 207, 151)' : userColors[msg.userId] || '#6FCF97'
                            }}
                          >
                            <AvatarFallback style={{
                              backgroundColor: msg.isAIGenerated ? 'rgb(111, 207, 151)' : userColors[msg.userId] || '#6FCF97',
                              color: 'white'
                            }}>
                              {msg.isAIGenerated ? 'AI' : (userNames[msg.userId] || msg.userId)?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {msg.isAIGenerated ? 'AI Tutor' : (userNames[msg.userId] || `User ${msg.userId.substring(0, 5)}`)}
                              </span>
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
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No messages yet</h3>
                        <p className="text-gray-500 max-w-sm">
                          Be the first to send a message in this study session! You can also mention @AI Tutor for help with your studies.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Chat input (only on chat tab) - Fixed at bottom */}
              {activeTab === 'chat' && (
                <div className="bg-white border-t p-4 fixed bottom-0 left-0 right-0 z-10" style={{ width: showSidebar ? 'calc(100% - 20rem)' : '100%' }}>
                  <div className="container mx-auto max-w-4xl">
                    {session.status === 'completed' ? (
                      <div className="p-3 bg-gray-100 rounded-md text-center text-gray-500">
                        <p>This session has ended. Chat is no longer available.</p>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              )}

              <TabsContent value="document" className="flex-1 flex items-center justify-center p-4">
                <div className="text-center p-8 max-w-md">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Document Resources</h3>
                  <p className="text-gray-500 mb-6">
                    Access all documents and study materials for this session from the Resources panel in the sidebar.
                  </p>
                  {/* Button to open sidebar on resources tab */}
                  <Button
                    onClick={() => {
                      setShowSidebar(true);
                      // Find the Resources tab and click it
                      const tabsElement = document.querySelector('[value="resources"]') as HTMLElement;
                      if (tabsElement) tabsElement.click();
                    }}
                    className="mb-4"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Resources
                  </Button>

                  {userId && session.status !== 'completed' && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Upload a new document to share with your group:</p>
                      <ResourceUpload
                        groupId={groupId}
                        sessionId={id}
                        onUploadComplete={() => {
                          toast.success("Resource uploaded successfully");
                          setShowSidebar(true);
                          // Find the Resources tab and click it
                          const tabsElement = document.querySelector('[value="resources"]') as HTMLElement;
                          if (tabsElement) tabsElement.click();
                        }}
                      />
                    </div>
                  )}

                  {session.status === 'completed' && (
                    <div className="p-3 bg-gray-100 rounded-md text-center text-gray-500 mt-4">
                      <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                      <p>This session has ended. Uploading new documents is no longer available.</p>
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

              <TabsContent value="screen-sharing">
                {id && (
                  <div className="container mx-auto p-6 max-w-5xl">
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold mb-2">Screen Sharing</h2>
                      <p className="text-gray-600">Collaborate with others through screen sharing and video chat</p>
                    </div>

                    {!activeRoomId ? (
                      <div className="text-center px-8">
                        <ScreenShare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">Join Video Room</h3>
                        <p className="text-gray-500 mb-6">
                          Join the video room to collaborate with screen sharing and video chat with your study session members.
                        </p>
                        <Button
                          onClick={() => setActiveRoomId(id as any)}
                          className="mx-auto"
                        >
                          Join Video Room
                        </Button>
                      </div>
                    ) : (
                      <VideoRoom sessionId={id as Id<"studySessions">} onLeave={() => setActiveRoomId(null)} />
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar toggle button - responsive for all devices */}
          <Button
            onClick={toggleSidebar}
            variant="outline"
            size="sm"
            className={cn(
              "fixed z-[999] rounded-full shadow-md flex items-center justify-center p-2",
              showSidebar
                ? "right-[20rem] top-[50%] transform -translate-y-1/2 bg-white"
                : "right-4 bottom-20 md:right-6 md:top-[50%] md:transform md:-translate-y-1/2"
            )}
          >
            {showSidebar ? <ChevronLeft className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
          </Button>

          {/* Sidebar */}
          <div className={cn(
            "fixed top-[58px] right-0 bottom-0 w-full sm:w-80 bg-white border-l border-gray-200 overflow-y-auto transition-transform z-20",
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
                            <AvatarFallback style={{
                              backgroundColor: userColors[participant?.name] || '#6FCF97'
                            }}>{userNames[participant?.name]?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-tertiary border-2 border-white"></span>
                        </div>
                        <span className="font-medium">{userNames[participant?.name]}</span>
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
                    {userId && session.status !== 'completed' && (
                      <div>
                        <ResourceUpload
                          groupId={groupId}
                          sessionId={id}
                          onUploadComplete={() => {
                            // Refresh resources list after upload
                            toast.success("Resource uploaded successfully");
                          }}
                        />
                      </div>
                    )}

                    {getGroupResources && getGroupResources.length > 0 ? (
                      getGroupResources.map((resource) => (
                        <Card key={resource._id}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="bg-primary/10 p-2 rounded">
                                {getResourceIcon(resource.type)}
                              </div>
                              <span className="font-medium truncate">{resource.name}</span>
                            </div>
                            {resource.description && (
                              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{resource.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mb-3">
                              Added by {resource.createdByName} • {resource.type.split('/')[1]?.toUpperCase() || resource.type}
                            </p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleDownload(resource._id)}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                              {userId === resource.createdBy && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(resource._id)}
                                  className="hover:bg-red-50 hover:text-red-500 border-gray-200"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                        <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm">No resources have been uploaded yet.</p>
                        {session.status !== 'completed' && (
                          <p className="text-xs mt-1">Upload study materials to share with your group.</p>
                        )}
                      </div>
                    )}

                    {session.status === 'completed' && (
                      <div className="p-3 bg-gray-100 rounded-md text-center text-gray-500 mt-4">
                        <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                        <p className="text-xs">This session has ended. Uploading new documents is no longer available.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div >

      <AlertDialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Study Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the session as completed. Participants will still be able to view session content but won't be able to send messages or make changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <AlertDialog open={showDeleteSessionDialog} onOpenChange={setShowDeleteSessionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Study Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session and all its content, including chat messages, whiteboards, and uploaded resources. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SessionRoom;
