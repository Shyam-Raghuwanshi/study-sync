import { Link } from 'react-router-dom';
import { Bell, BellRing, Calendar, Clock, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth, useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Id } from '../../../convex/_generated/dataModel';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const createSessionReminder = useMutation(api.notifications.createSessionReminder);
  const deleteSession = useMutation(api.studySessions.deleteSession);
  const joinSession = useMutation(api.studySessions.joinSession);
  const { userId } = useAuth();
  const { user } = useUser();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Check if user has already set a notification for this session
  const hasNotification = useQuery(
    api.notifications.checkSessionNotification,
    userId && id ? {
      userId: userId,
      sessionId: id as any
    } : 'skip'
  );
  
  // Get user's role in the group to determine if they are an admin
  const userRole = useQuery(
    api.studyGroups.getUserRole,
    userId && groupId ? {
      groupId: groupId as any
    } : 'skip'
  );
  
  // Only regular members (not admins) should see the notification button
  const isAdmin = userRole === "admin";
  const shouldShowNotifyButton = userId && !isAdmin;

  // Handle the delete session action
  const handleDeleteSession = async () => {
    if (!id || !userId) return;

    try {
      await deleteSession({
        sessionId: id as Id<"studySessions">,
        userId: userId
      });

      toast.success("Session deleted successfully");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  // Handle joining a session
  const handleJoinSession = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!userId || !id) return;
    
    try {
      // Join the session first to ensure the user is added to participants
      await joinSession({
        sessionId: id as Id<"studySessions">,
        userId: userId
      });
      
      // Then navigate to the session page
      navigate(`/sessions/${id}/${groupId}`);
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session");
    }
  };

  return (
    <>
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
            <div className="flex space-x-2">
              {/* Admin Delete Button - Only shown for completed sessions */}
              {isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              {status === 'active' && (
                <Button 
                  size="sm"
                  onClick={handleJoinSession}
                >
                  Join Now
                </Button>
              )}
              
              {status === 'upcoming' && shouldShowNotifyButton && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation to session detail
                    if (userId) {
                      // Get the user email from Clerk using useUser hook
                      const userEmail = user?.primaryEmailAddress?.emailAddress;
                      
                      const promise = createSessionReminder({
                        sessionId: id as any,
                        userId: userId,
                        notifyBy: 'both', // Use 'both' to enable both web and email notifications
                        userEmail: userEmail // Pass the user's email for Resend
                      });

                      toast.promise(promise, {
                        loading: 'Setting up notifications...',
                        success: 'You will be notified by email and web before the session starts',
                        error: 'Failed to set up notifications'
                      });
                    }
                  }}
                >
                  {hasNotification ? (
                    <>
                      <Bell className="h-4 w-4 mr-1 fill-green-600" /> Will Notify
                    </>
                  ) : (
                    <>
                      <BellRing className="h-4 w-4 mr-1" /> Notify Me
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Study Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session and all its content, including chat messages, whiteboards, and uploaded resources. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SessionCard;
