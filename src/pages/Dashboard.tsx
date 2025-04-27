import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import GroupCard from '@/components/dashboard/GroupCard';
import SessionCard from '@/components/dashboard/SessionCard';
import UpcomingSessions from '@/components/dashboard/UpcomingSessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/clerk-react";

const Dashboard = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { userId } = useAuth();

  // Fetch user's study groups from Convex
  const studyGroups = useQuery(api.studyGroups.getAll, {}) || [];

  // Get user's upcoming sessions
  const upcomingSessions = useQuery(api.studySessions.getUpcomingForUser) || [];

  // Filter study groups to only show those the user is a member of
  const userStudyGroups = studyGroups.filter(group =>
    group.members?.includes(userId)
  );

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
                  {!isLoading && upcomingSessions?.length > 0 ? (
                    upcomingSessions.map((session) => (
                      <SessionCard
                        key={session._id}
                        id={session._id}
                        groupId={session.groupId}
                        name={session.name}
                        groupName={session.groupName || "Study Group"}
                        subject={session.subject || "General"}
                        date={new Date(session.startTime).toLocaleDateString()}
                        time={`${new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}`}
                        status={session.isActive ? "active" : "upcoming"}
                        participantCount={session.participants?.length || 0}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      No upcoming sessions. Join a study group to participate in sessions!
                    </div>
                  )}
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
            {!isLoading && userStudyGroups.length > 0 ? (
              userStudyGroups.map((group) => (
                <GroupCard
                  key={group._id}
                  id={group._id}
                  name={group.name}
                  description={group.description}
                  subject={group.subject}
                  memberCount={group.members?.length || 0}
                  lastActive={group.lastActive ? `${Math.floor((Date.now() - group.lastActive) / (1000 * 60 * 60))} hours ago` : 'Just now'}
                  isNew={group.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-12 border rounded-lg bg-gray-50">
                <h3 className="font-medium text-lg mb-2">No study groups yet</h3>
                <p className="text-gray-500 mb-4">Join or create a study group to get started.</p>
                <Button asChild>
                  <a href="/all-groups">Browse Groups</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
