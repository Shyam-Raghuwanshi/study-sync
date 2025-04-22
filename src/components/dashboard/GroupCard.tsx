
import { Link } from 'react-router-dom';
import { Users, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface GroupCardProps {
  id: string;
  name: string;
  description: string;
  subject: string;
  memberCount: number;
  lastActive: string;
  isNew?: boolean;
}

const GroupCard = ({
  id,
  name,
  description,
  subject,
  memberCount,
  lastActive,
  isNew = false
}: GroupCardProps) => {
  return (
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          {isNew && <Badge className="bg-secondary">New</Badge>}
        </div>
        <Badge variant="outline" className="mt-1 text-xs">
          {subject}
        </Badge>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{description}</p>
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Users className="h-4 w-4 mr-2" />
          <span>{memberCount} members</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-2" />
          <span>Last active {lastActive}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between items-center">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <Avatar key={i} className="h-7 w-7 border-2 border-white">
              <AvatarImage src={`/placeholder.svg`} alt="User avatar" />
              <AvatarFallback>U{i}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <Button asChild size="sm">
          <Link to={`/groups/${id}`}>
            View Group
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GroupCard;
