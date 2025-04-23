
import { useState } from 'react';
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
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ResourceUpload from '@/components/dashboard/ResourceUpload';
import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { File, Image } from "lucide-react";

interface Message {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  timestamp: string;
  isAI: boolean;
}

const SessionRoom = () => {
  const { id, groupId } = useParams<{ id: string, groupId: string }>();
  const [activeTab, setActiveTab] = useState('chat');
  const [showSidebar, setShowSidebar] = useState(true);
  const [message, setMessage] = useState('');
  const { userId } = useAuth();
  // Mock data for a study session (would come from API in real implementation)
  const session = {
    id: id || '1',
    name: 'Quantum Mechanics Review',
    groupName: 'Physics 101',
    groupId: '1',
    subject: 'Physics',
    startTime: 'Started at 3:00 PM',
    duration: '2 hours',
    participants: [
      { id: '1', name: 'Alex Johnson', active: true, avatar: '/placeholder.svg' },
      { id: '2', name: 'Maria Rodriguez', active: true, avatar: '/placeholder.svg' },
      { id: '3', name: 'David Kim', active: false, avatar: '/placeholder.svg' },
      { id: '4', name: 'Sarah Chen', active: true, avatar: '/placeholder.svg' },
      { id: '5', name: 'James Wilson', active: false, avatar: '/placeholder.svg' }
    ],
    messages: [
      {
        id: '1',
        userId: '1',
        userName: 'Alex Johnson',
        avatar: '/placeholder.svg',
        content: 'Hey everyone! Welcome to our quantum mechanics review session.',
        timestamp: '3:01 PM',
        isAI: false
      },
      {
        id: '2',
        userId: '2',
        userName: 'Maria Rodriguez',
        avatar: '/placeholder.svg',
        content: 'Thanks for setting this up. I\'ve been struggling with wave functions lately.',
        timestamp: '3:02 PM',
        isAI: false
      },
      {
        id: '3',
        userId: '5',
        userName: 'AI Tutor',
        avatar: '/placeholder.svg',
        content: 'Welcome everyone! I\'m your AI tutor for today\'s session. What specific aspects of quantum mechanics would you like to focus on?',
        timestamp: '3:03 PM',
        isAI: true
      }
    ]
  };
  const getGroupResources = useQuery(api.resources.getByGroup, groupId ? { groupId: groupId as any } : 'skip');
  const getDownloadUrl = useMutation(api.resources.getDownloadUrl);
  const deleteResource = useMutation(api.resources.deleteResource);
  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, you would send this to an API
      console.log('Sending message:', message);
      setMessage('');
    }
  };

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
                <span>{session.startTime}</span>
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

            <TabsContent value="chat" className="flex-1 p-4 overflow-y-auto">
              <div className="container mx-auto max-w-4xl">
                <div className="space-y-4">
                  {session.messages.map((msg) => (
                    <div key={msg.id} className="flex items-start space-x-3">
                      <Avatar className={cn("h-9 w-9", msg.isAI && "border-2 border-tertiary")}>
                        <AvatarImage src={msg.avatar} alt={msg.userName} />
                        <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{msg.userName}</span>
                          {msg.isAI && (
                            <Badge variant="outline" className="bg-tertiary/10 text-tertiary border-tertiary/20 text-xs">
                              AI Tutor
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">{msg.timestamp}</span>
                        </div>
                        <div className="mt-1 text-gray-800">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

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

            <TabsContent value="whiteboard" className="flex-1 flex items-center justify-center p-4">
              <div className="text-center p-8 max-w-md">
                <Pencil className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Interactive Whiteboard</h3>
                <p className="text-gray-500 mb-4">
                  Draw diagrams, solve problems together, and visualize concepts in real-time.
                </p>
                <Button>Start Whiteboard</Button>
              </div>
            </TabsContent>

            <TabsContent value="ai-tutor" className="flex-1 flex items-center justify-center p-4">
              <div className="text-center p-8 max-w-md">
                <Sparkles className="h-12 w-12 text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">AI Study Assistant</h3>
                <p className="text-gray-500 mb-4">
                  Get explanations, generate practice problems, or create study materials with AI assistance.
                </p>
                <Button className="bg-tertiary hover:bg-tertiary/90">Ask AI Tutor</Button>
              </div>
            </TabsContent>

            {/* Chat input (only on chat tab) */}
            {activeTab === 'chat' && (
              <div className="bg-white border-t p-4">
                <div className="container mx-auto max-w-4xl">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className={cn(
          "fixed top-[58px] right-0 bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto transition-transform z-20",
          showSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0"
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
    </div>
  );
};

export default SessionRoom;
