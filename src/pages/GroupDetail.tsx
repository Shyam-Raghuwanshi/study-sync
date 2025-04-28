import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  BookOpen,
  MessageSquare,
  Plus,
  Lock,
  Unlock,
  User,
  JoystickIcon,
  Upload,
  Trash,
  FileText,
  Download,
  File,
  Image,
  Trash2,
  Volume2,
  MessageCircle,
  Bell
} from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import SessionCard from '@/components/dashboard/SessionCard';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ResourceUpload from '@/components/dashboard/ResourceUpload';
import { useAuth } from '@clerk/clerk-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { VoiceChannel } from '@/components/ui/voice-channel';
import { GroupChat } from '@/components/ui/group-chat';

interface ScheduleSessionForm {
  name: string;
  description: string;
  startTime: Date;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const [isUserMember, setIsUserMember] = useState<boolean>(false);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);
  const [showJoinDialog, setShowJoinDialog] = useState<boolean>(false);

  // Fetch all groups if no id is provided
  const allGroups = useQuery(api.studyGroups.getAll, {});

  // Only fetch specific group data if id is present
  const group = id ? useQuery(api.studyGroups.getById, { id: id as any }) : null;
  const sessions = id ? useQuery(api.studyGroups.getGroupSessions, { groupId: id as any }) : null;
  const membersWithRoles = id ? useQuery(api.studyGroups.getGroupMembersWithRoles, { groupId: id as any }) : null;
  const members = id ? useQuery(api.studyGroups.getGroupMembers, { groupId: id as any }) : null;
  const resources = useQuery(api.studyGroups.getGroupResources, { groupId: id as any })
  const recentActivity = id ? useQuery(api.studyGroups.getRecentActivity, {
    groupId: id as any,
    limit: 5
  }) : null;
  const getDownloadUrl = useMutation(api.resources.getDownloadUrl);
  const deleteResource = useMutation(api.resources.deleteResource);
  const getGroupResources = useQuery(api.resources.getByGroup, id ? { groupId: id as any } : 'skip');
  const joinGroup = useMutation(api.studyGroups.joinGroup);
  const createSession = useMutation(api.studySessions.create);
  const makeAdmin = useMutation(api.studyGroups.makeAdmin);
  const removeAdmin = useMutation(api.studyGroups.removeAdmin);
  const createSessionReminder = useMutation(api.notifications.createSessionReminder);
  const [isScheduling, setIsScheduling] = useState(false);

  const form = useForm<ScheduleSessionForm>({
    defaultValues: {
      name: "",
      description: "",
      startTime: new Date(),
    },
  });


  // Check if user is a member of the group and get their role
  useEffect(() => {
    if (membersWithRoles && userId) {
      const memberInfo = membersWithRoles.find(m => m.userId === userId);
      setIsUserMember(!!memberInfo);
      setIsUserAdmin(memberInfo?.role === "admin");

      // Show join dialog if user is not a member
      if (!memberInfo) {
        setShowJoinDialog(true);
      }
    }
  }, [membersWithRoles, userId]);

  const handleScheduleSession = async (data: ScheduleSessionForm) => {
    if (!id || !userId) return;

    try {
      const promise = createSession({
        groupId: id as any,
        name: data.name,
        description: data.description,
        startTime: data.startTime.getTime(),
      });

      toast.promise(promise, {
        loading: 'Scheduling session...',
        success: () => {
          setIsScheduling(false);
          form.reset();
          return 'Session scheduled successfully!';
        },
        error: 'Failed to schedule session',
      });
    } catch (error) {
      console.error('Error scheduling session:', error);
    }
  };

  // Show loading state while data is being fetched
  if ((id && (!group || !sessions || !members || !resources || !recentActivity)) || (!id && !allGroups)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const handleJoinGroup = async () => {
    if (!id) return;
    try {
      const promise = joinGroup({ groupId: id as any });
      toast.promise(promise, {
        loading: 'Joining group...',
        success: () => {
          setIsUserMember(true);
          setShowJoinDialog(false);
          return 'Successfully joined the group!';
        },
        error: `Error joining group`,
      });
    } catch (error) {
      console.error('Error joining group:', error);
    }
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

  const getResourceIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  // If id is provided, show group details
  return (
    <DashboardLayout>
      {/* Join Group Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {group?.name}</DialogTitle>
            <DialogDescription>
              You need to join this study group to participate in discussions, access resources, and attend sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              This study group focuses on <strong>{group?.subject}</strong> and has {members?.length || 0} members.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinGroup}>
              Join Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              {group.isPublic ? (
                <Badge variant="outline" className="flex items-center text-gray-500">
                  <Unlock className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center text-gray-500">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">{group.description}</p>
          </div>
          <Dialog open={isScheduling} onOpenChange={setIsScheduling}>
            {isUserAdmin && (
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Session
                </Button>
              </DialogTrigger>
            )}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Study Session</DialogTitle>
                <DialogDescription>
                  Create a new study session for your group members.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleScheduleSession)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter session name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What will you study in this session?"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={
                              field.value
                                ? new Date(field.value.getTime() - (field.value.getTimezoneOffset() * 60000))
                                  .toISOString()
                                  .slice(0, 16)
                                : ''
                            }
                            onChange={(e) => {
                              const date = new Date(e.target.value);
                              field.onChange(date);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Schedule Session</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          {!isUserMember && (
            <Button onClick={handleJoinGroup}>
              <JoystickIcon className="mr-2 h-4 w-4" />
              Join Group
            </Button>
          )}
        </div>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{group.subject}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="font-medium">{members.length} members</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created by</p>
                  <p className="font-medium">{group.createdByName || "Unknown User"}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created on</p>
                  <p className="font-medium">{new Date(group.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full" >
          <TabsList className="grid grid-cols-5 md:w-[750px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>

          </TabsList>
          <TabsContent value="communication" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Group Chat</CardTitle>
                      <CardDescription>
                        Chat with group members
                      </CardDescription>
                    </div>
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {id && <GroupChat groupId={id} />}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Voice Channels</CardTitle>
                      <CardDescription>
                        Voice chat with group members
                      </CardDescription>
                    </div>
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {sessions && sessions.length > 0 && (
                      <VoiceChannel sessionId={sessions[0]._id} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Sessions</CardTitle>
                    <CardDescription>Scheduled study sessions for this group</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sessions
                        .filter(session => session.isActive)
                        .slice(0, 2)
                        .map(session => {
                          // Compare session start time with current time
                          const sessionStartTime = new Date(session.startTime).getTime();
                          const currentTime = new Date().getTime();
                          const sessionStatus = session.isActive
                            ? (sessionStartTime > currentTime ? 'upcoming' : 'active')
                            : 'completed';

                          return (
                            <SessionCard
                              key={session._id}
                              id={session._id}
                              name={session.name}
                              groupName={group.name}
                              groupId={id!}
                              subject={group.subject}
                              date={new Date(session.startTime).toLocaleDateString()}
                              time={new Date(session.startTime).toLocaleTimeString()}
                              status={sessionStatus}
                              participantCount={session.participants.length}
                            />
                          );
                        })
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.sessions.slice(0, 3).map(activity => (
                        <div key={activity._id} className="flex items-start space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {activity.participants[0]?.slice(0, 2).toUpperCase() || 'NA'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              New session scheduled
                            </p>
                            <p className="text-sm text-gray-500">{activity.name}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity._creationTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Group Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {members.slice(0, 5).map((memberId, index) => (
                        <div key={memberId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{memberId.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">Member {index + 1}</p>
                              <p className="text-xs text-gray-500">Member</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {members.length > 5 && (
                      <Button variant="ghost" className="mt-3 w-full text-xs" size="sm">
                        View All Members
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Recent Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {resources.slice(0, 5).map(resource => (
                        <div key={resource._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{resource.name}</p>
                              <p className="text-xs text-gray-500">
                                Added by {resource.createdBy} on {new Date(resource._creationTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Study Sessions</CardTitle>
                  {isUserAdmin && (
                    <Button onClick={() => setIsScheduling(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Session
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map(session => {
                    // Compare session start time with current time
                    const sessionStartTime = new Date(session.startTime).getTime();
                    const currentTime = new Date().getTime();
                    const sessionStatus = session.isActive
                      ? (sessionStartTime > currentTime ? 'upcoming' : 'active')
                      : 'completed';


                    return (
                      <SessionCard
                        key={session._id}
                        id={session._id}
                        name={session.name}
                        groupName={group.name}
                        groupId={id!}
                        subject={group.subject}
                        date={new Date(session.startTime).toLocaleDateString()}
                        time={new Date(session.startTime).toLocaleTimeString()}
                        status={sessionStatus}
                        participantCount={session.participants.length}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Group Members</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {membersWithRoles?.map((member, index) => {
                    const isCreator = member.isCreator;
                    const isAdmin = member.role === "admin";

                    return (
                      <div key={member.userId} className="flex items-center justify-between p-4 border rounded-md">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{member.userId.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Member {index + 1}</p>
                            <div className="flex gap-1 mt-1">
                              {isCreator && (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Creator</Badge>
                              )}
                              {isAdmin && (
                                <Badge variant="secondary">Admin</Badge>
                              )}
                              {!isAdmin && (
                                <Badge variant="outline">Member</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin actions - only visible to admins */}
                        {isUserAdmin && !isCreator && member.userId !== userId && (
                          <div>
                            {isAdmin ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500"
                                onClick={() => {
                                  removeAdmin({
                                    groupId: id as any,
                                    targetUserId: member.userId
                                  })
                                    .then(() => toast.success("Admin privileges removed"))
                                    .catch((err) => toast.error("Failed to remove admin: " + err.message));
                                }}
                              >
                                Remove Admin
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  makeAdmin({
                                    groupId: id as any,
                                    targetUserId: member.userId
                                  })
                                    .then(() => toast.success("Admin privileges granted"))
                                    .catch((err) => toast.error("Failed to make admin: " + err.message));
                                }}
                              >
                                Make Admin
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Study Resources</CardTitle>
                  {userId && <ResourceUpload
                    groupId={id!}
                    onUploadComplete={() => {
                      // Refresh resources list
                      // invalidateQuery();
                    }}
                  />}
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default GroupDetail;
