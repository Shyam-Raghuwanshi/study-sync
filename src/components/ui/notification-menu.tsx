import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from './button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Bell, Check, Calendar, Clock, MessageSquare, FileText, AlertTriangle, Trash2 } from 'lucide-react';
import { Badge } from './badge';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

export const NotificationMenu: React.FC = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.getUserNotifications, userId ? { userId } : 'skip');
  const unreadCount = useQuery(api.notifications.getUnreadCount, userId ? { userId } : 'skip');
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [notificationToDelete, setNotificationToDelete] = React.useState<string | null>(null);

  if (!userId) return null;

  const handleReadNotification = async (notificationId: string) => {
    await markAsRead({ notificationId: notificationId as any });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({ userId });
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId: notificationId as any });
      toast.success("Notification deleted");
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error("Failed to delete notification");
    }
  };

  const confirmDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent notification from being marked as read
    setNotificationToDelete(notificationId);
    setDeleteConfirmOpen(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'session_reminder':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'group_update':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'resource_added':
        return <FileText className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const isSessionLive = (notification: any) => {
    if (notification.type !== 'session_reminder' || !notification.metadata?.sessionStartTime) {
      return false;
    }
    
    const sessionStartTime = notification.metadata.sessionStartTime;
    const currentTime = Date.now();
    
    // Check if session has started (is live)
    return currentTime >= sessionStartTime;
  };

  const handleNotificationClick = (notification: any) => {
    // For session notifications, only navigate if the session is live
    if (notification.type === 'session_reminder' && !isSessionLive(notification)) {
      return; // Don't navigate, session is not live yet
    }
    
    // Mark as read
    handleReadNotification(notification._id);
    
    // Navigate based on the notification type
    if (notification.sessionId) {
      navigate(`/session/${notification.sessionId}`);
    } else if (notification.groupId) {
      navigate(`/group/${notification.groupId}`);
    }
  };
  
  const renderNotification = (notification: any) => {
    const isLive = isSessionLive(notification);
    const isClickable = notification.type !== 'session_reminder' || isLive;
    
    return (
      <div
        key={notification._id}
        className={`flex items-start p-4 hover:bg-gray-50 border-b last:border-0 ${
          !notification.isRead ? 'bg-blue-50/50' : ''
        } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => isClickable && handleNotificationClick(notification)}
      >
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {getIcon(notification.type)}
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
              {notification.title}
              {notification.type === 'session_reminder' && (
                <Badge 
                  className={`ml-2 ${isLive ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                >
                  {isLive ? 'Live' : 'Upcoming'}
                </Badge>
              )}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 opacity-50 hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => confirmDelete(notification._id, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete notification</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
          <div className="flex items-center mt-2 text-xs text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(notification.createdAt).toLocaleString()}
          </div>
          
          {notification.type === 'session_reminder' && !isLive && (
            <div className="mt-2 text-xs text-blue-600 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Session hasn't started yet
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount && unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount && unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <Check className="h-4 w-4 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map(renderNotification)
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p>No notifications</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (notificationToDelete) {
                  handleDeleteNotification(notificationToDelete);
                  setNotificationToDelete(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};