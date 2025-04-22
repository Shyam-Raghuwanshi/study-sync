
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users } from 'lucide-react';

interface SessionItem {
  id: string;
  name: string;
  group: string;
  date: string;
  time: string;
  participants: number;
}

const UpcomingSessions = () => {
  // Mock data (would come from API in real implementation)
  const upcomingSessions: SessionItem[] = [
    {
      id: '1',
      name: 'Quantum Mechanics Review',
      group: 'Physics 101',
      date: 'Today',
      time: '3:00 PM - 5:00 PM',
      participants: 5
    },
    {
      id: '2',
      name: 'Derivatives & Integrals',
      group: 'Calculus II',
      date: 'Tomorrow',
      time: '2:00 PM - 4:00 PM',
      participants: 3
    },
    {
      id: '3',
      name: 'Algorithm Design',
      group: 'Computer Science',
      date: 'Apr 25',
      time: '6:00 PM - 8:00 PM',
      participants: 4
    }
  ];

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
          {upcomingSessions.map((session) => (
            <div key={session.id} className="flex items-start space-x-4 p-3 rounded-md hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-md p-2 min-w-16 text-center">
                <Calendar className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{session.date}</span>
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium">{session.name}</h4>
                <p className="text-sm text-gray-500 mb-1">{session.group}</p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{session.participants} participants</span>
                  </div>
                </div>
              </div>
              
              <Button size="sm" variant="outline" asChild>
                <Link to={`/sessions/${session.id}`}>Details</Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingSessions;
