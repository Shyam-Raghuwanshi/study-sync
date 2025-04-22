
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import GroupCard from '@/components/dashboard/GroupCard';
import SessionCard from '@/components/dashboard/SessionCard';
import UpcomingSessions from '@/components/dashboard/UpcomingSessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  // Mock data (would come from API in real implementation)
  const studyGroups = [
    {
      id: '1',
      name: 'Physics 101',
      description: 'Study group for introductory physics covering mechanics, waves, and thermodynamics.',
      subject: 'Physics',
      memberCount: 12,
      lastActive: '2 hours ago',
      isNew: false
    },
    {
      id: '2',
      name: 'Calculus II',
      description: 'Advanced calculus concepts including integration techniques, series, and vector calculus.',
      subject: 'Mathematics',
      memberCount: 8,
      lastActive: '1 day ago',
      isNew: true
    },
    {
      id: '3',
      name: 'Computer Science',
      description: 'Software engineering principles, data structures, and algorithms.',
      subject: 'Computer Science',
      memberCount: 15,
      lastActive: '3 hours ago',
      isNew: false
    }
  ];

  const upcomingSessions = [
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
      name: 'Calculus Practice',
      groupName: 'Calculus II',
      subject: 'Mathematics',
      date: 'Today',
      time: '6:00 PM - 7:30 PM',
      status: 'active' as const,
      participantCount: 3
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Welcome back! Here's what's happening with your study groups.</p>
          </div>
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Get AI Study Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingSessions.map((session) => (
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
          </div>

          <div className="md:col-span-1">
            <UpcomingSessions />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Your Study Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {studyGroups.map((group) => (
              <GroupCard
                key={group.id}
                id={group.id}
                name={group.name}
                description={group.description}
                subject={group.subject}
                memberCount={group.memberCount}
                lastActive={group.lastActive}
                isNew={group.isNew}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
