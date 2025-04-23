
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  id: string;
  name: string;
  groupName: string;
  groupId: string;
  subject: string;
  date: string;
  time: string;
  status: 'upcoming' | 'active' | 'completed';
  participantCount: number;
}

const SessionCard = ({
  id,
  name,
  groupName,
  groupId,
  subject,
  date,
  time,
  status,
  participantCount
}: SessionCardProps) => {
  return (
    <Card className={cn(
      "h-full overflow-hidden border-l-4 hover:shadow-md transition-shadow",
      status === 'active' ? "border-l-tertiary" :
        status === 'upcoming' ? "border-l-primary" :
          "border-l-gray-300"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <Badge className={cn(
            status === 'active' ? "bg-tertiary" :
              status === 'upcoming' ? "bg-primary" :
                "bg-gray-400"
          )}>
            {status === 'active' ? 'Active Now' :
              status === 'upcoming' ? 'Upcoming' :
                'Completed'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{groupName}</p>
      </CardHeader>
      <CardContent className="py-2">
        <Badge variant="outline" className="mb-3 text-xs">
          {subject}
        </Badge>

        <div className="flex flex-col space-y-1 text-sm">
          <div className="flex items-center text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{date}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            <span>{time}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Users className="h-4 w-4 mr-2" />
            <span>{participantCount} participants</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between w-full items-center">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <Avatar key={i} className="h-7 w-7 border-2 border-white">
                <AvatarImage src={`/placeholder.svg`} alt="User avatar" />
                <AvatarFallback>U{i}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Button
            asChild
            size="sm"
            variant={status === 'completed' ? "outline" : "default"}
          >
            <Link to={`/sessions/${id}/${groupId}`}>
              {status === 'active' ? 'Join Now' :
                status === 'upcoming' ? 'View Details' :
                  'View Summary'}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SessionCard;
