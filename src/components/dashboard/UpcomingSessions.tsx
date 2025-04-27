import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useConvexAuth } from 'convex/react';

const UpcomingSessions = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  // Get user's upcoming sessions data from Convex
  const sessions = useQuery(api.studySessions.getUpcomingForUser) || [];
  
  // Take just first 3 for the sidebar widget
  const upcomingSessions = sessions.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled study sessions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/calendar">View Calendar</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isLoading && upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <div key={session._id} className="flex items-start space-x-4 p-3 rounded-md hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-md p-2 min-w-16 text-center">
                  <Calendar className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">
                    {new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{session.name}</h4>
                  <p className="text-sm text-gray-500 mb-1">{session.groupName || "Study Group"}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {session.endTime ? 
                          new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                          'Ongoing'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{session.participants?.length || 0} participants</span>
                    </div>
                  </div>
                </div>
                
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/sessions/${session._id}`}>Details</Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">No upcoming sessions</p>
              <Button size="sm" className="mt-2" variant="outline" asChild>
                <Link to="/all-groups">Join a group</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingSessions;
