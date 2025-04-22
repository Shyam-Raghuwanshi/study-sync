
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  Plus, 
  Lock, 
  Unlock,
  User
} from 'lucide-react';
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

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for a study group (would come from API in real implementation)
  const group = {
    id: id || '1',
    name: 'Physics 101',
    description: 'Study group for introductory physics covering mechanics, waves, and thermodynamics.',
    subject: 'Physics',
    memberCount: 12,
    createdBy: 'Alex Johnson',
    isPublic: true,
    createdAt: 'March 15, 2025',
    lastActive: '2 hours ago',
    sessions: [
      {
        id: '1',
        name: 'Quantum Mechanics Review',
        groupName: 'Physics 101',
        subject: 'Physics',
        date: 'Today',
        time: '3:00 PM - 5:00 PM',
        status: 'upcoming' as const,
        participantCount: 5
      },
      {
        id: '2',
        name: 'Forces & Motion Practice',
        groupName: 'Physics 101',
        subject: 'Physics',
        date: 'Apr 26',
        time: '4:00 PM - 6:00 PM',
        status: 'upcoming' as const,
        participantCount: 4
      },
      {
        id: '3',
        name: 'Thermodynamics Deep Dive',
        groupName: 'Physics 101',
        subject: 'Physics',
        date: 'Apr 22',
        time: '2:00 PM - 4:00 PM',
        status: 'completed' as const,
        participantCount: 6
      }
    ],
    members: [
      { id: '1', name: 'Alex Johnson', role: 'Admin', avatar: '/placeholder.svg' },
      { id: '2', name: 'Maria Rodriguez', role: 'Member', avatar: '/placeholder.svg' },
      { id: '3', name: 'David Kim', role: 'Member', avatar: '/placeholder.svg' },
      { id: '4', name: 'Sarah Chen', role: 'Member', avatar: '/placeholder.svg' },
      { id: '5', name: 'James Wilson', role: 'Member', avatar: '/placeholder.svg' }
    ],
    resources: [
      { id: '1', name: 'Physics Textbook (PDF)', type: 'PDF', uploadedBy: 'Alex', date: 'Mar 20' },
      { id: '2', name: 'Wave Mechanics Notes', type: 'Document', uploadedBy: 'Maria', date: 'Apr 10' },
      { id: '3', name: 'Kinematics Practice Problems', type: 'Document', uploadedBy: 'David', date: 'Apr 15' }
    ]
  };

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
                  <p className="font-medium">{group.memberCount} members</p>
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
                  <p className="font-medium">{group.createdAt}</p>
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
                      {group.sessions
                        .filter(session => session.status !== 'completed')
                        .slice(0, 2)
                        .map(session => (
                          <SessionCard
                            key={session.id}
                            id={session.id}
                            name={session.name}
                            groupName={session.groupName}
                            subject={session.subject}
                            date={session.date}
                            time={session.time}
                            status={session.status}
                            participantCount={session.participantCount}
                          />
                        ))
                      }
                    </div>
                    {group.sessions.filter(session => session.status !== 'completed').length > 2 && (
                      <Button variant="ghost" className="mt-3 w-full">
                        View All Sessions
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" alt="User" />
                          <AvatarFallback>AJ</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            <span className="text-primary">Alex Johnson</span> scheduled a new session
                          </p>
                          <p className="text-sm text-gray-500">Quantum Mechanics Review - Today at 3:00 PM</p>
                          <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" alt="User" />
                          <AvatarFallback>MR</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            <span className="text-primary">Maria Rodriguez</span> uploaded a resource
                          </p>
                          <p className="text-sm text-gray-500">Wave Mechanics Notes</p>
                          <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" alt="User" />
                          <AvatarFallback>DK</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            <span className="text-primary">David Kim</span> joined the group
                          </p>
                          <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                        </div>
                      </div>
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
                      {group.members.slice(0, 5).map(member => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {group.members.length > 5 && (
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
                      {group.resources.map(resource => (
                        <div key={resource.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{resource.name}</p>
                              <p className="text-xs text-gray-500">
                                Added by {resource.uploadedBy} on {resource.date}
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
                  {group.sessions.map(session => (
                    <SessionCard
                      key={session.id}
                      id={session.id}
                      name={session.name}
                      groupName={session.groupName}
                      subject={session.subject}
                      date={session.date}
                      time={session.time}
                      status={session.status}
                      participantCount={session.participantCount}
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
                  {group.members.map(member => (
                    <div key={member.id} className="flex items-center space-x-4 p-4 border rounded-md">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <Badge variant="outline" className="mt-1">{member.role}</Badge>
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
                  {group.resources.map(resource => (
                    <div key={resource.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-sm text-gray-500">
                            Type: {resource.type} • Added by {resource.uploadedBy} on {resource.date}
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
