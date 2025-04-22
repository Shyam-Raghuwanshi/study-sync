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
  JoystickIcon
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

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  console.log({ id })
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all groups if no id is provided
  const allGroups = useQuery(api.studyGroups.getAll, {});



  // Only fetch specific group data if id is present
  const group = id ? useQuery(api.studyGroups.getById, { id: id as any }) : null;
  const sessions = id ? useQuery(api.studyGroups.getGroupSessions, { groupId: id as any }) : null;
  const members = id ? useQuery(api.studyGroups.getGroupMembers, { groupId: id as any }) : null;
  const resources = id ? useQuery(api.studyGroups.getGroupResources, { groupId: id as any }) : null;
  const recentActivity = id ? useQuery(api.studyGroups.getRecentActivity, {
    groupId: id as any,
    limit: 5
  }) : null;
  console.log({members})
  const joinGroup = useMutation(api.studyGroups.joinGroup);

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
        success: 'Successfully joined the group!',
        error: `Error joining group`,
      });
    } catch (error) {
      console.error('Error joining group:', error);
    }
  }
  // If no id is provided, show all groups
  if (!id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">Study Groups</h1>
            <Button onClick={() => navigate('/create-group')}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Group
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allGroups.map((group) => (
              <Card key={group._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/groups/${group._id}`)}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <CardTitle>{group.name}</CardTitle>
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
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {group.subject}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {group.members.length} members
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If id is provided, show group details
  return (
    <DashboardLayout>
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Session
          </Button>
          <Button onClick={handleJoinGroup}>
            <JoystickIcon className="mr-2 h-4 w-4" />
            Join Group
          </Button>
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
                  <p className="font-medium">{group.createdBy}</p>
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

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

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
                        .map(session => (
                          <SessionCard
                            key={session._id}
                            id={session._id}
                            name={session.name}
                            groupName={group.name}
                            subject={group.subject}
                            date={new Date(session.startTime).toLocaleDateString()}
                            time={new Date(session.startTime).toLocaleTimeString()}
                            status={session.isActive ? 'upcoming' : 'completed'}
                            participantCount={session.participants.length}
                          />
                        ))
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
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map(session => (
                    <SessionCard
                      key={session._id}
                      id={session._id}
                      name={session.name}
                      groupName={group.name}
                      subject={group.subject}
                      date={new Date(session.startTime).toLocaleDateString()}
                      time={new Date(session.startTime).toLocaleTimeString()}
                      status={session.isActive ? 'upcoming' : 'completed'}
                      participantCount={session.participants.length}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Group Members</CardTitle>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map((memberId, index) => (
                    <div key={memberId} className="flex items-center space-x-4 p-4 border rounded-md">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{memberId.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">Member {index + 1}</p>
                        <Badge variant="outline" className="mt-1">Member</Badge>
                      </div>
                      <Button variant="ghost" size="sm">View Profile</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Study Resources</CardTitle>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.map(resource => (
                    <div key={resource._id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-sm text-gray-500">
                            Added by {resource.createdBy} on {new Date(resource._creationTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Download</Button>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  ))}
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
