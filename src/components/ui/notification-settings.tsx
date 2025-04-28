import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from './button';
import { Switch } from './switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const NotificationSettings = () => {
  const { userId } = useAuth();
  const preferences = useQuery(api.notifications.getUserPreferences, userId ? { userId } : 'skip');
  const updatePreferences = useMutation(api.notifications.updateUserPreferences);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    webNotifications: true,
    sessionReminders: true,
    groupUpdates: true,
    resourceAdditions: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Update form state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setSettings({
        emailNotifications: preferences.emailNotifications,
        webNotifications: preferences.webNotifications,
        sessionReminders: preferences.sessionReminders,
        groupUpdates: preferences.groupUpdates,
        resourceAdditions: preferences.resourceAdditions,
      });
    }
  }, [preferences]);

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const savePreferences = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      await updatePreferences({
        userId,
        preferences: settings
      });
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Choose how you want to be notified about your study sessions and groups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Delivery Methods</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch 
              checked={settings.emailNotifications} 
              onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Web Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications in the app
              </p>
            </div>
            <Switch 
              checked={settings.webNotifications} 
              onCheckedChange={(checked) => handleToggle('webNotifications', checked)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notification Types</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get notified before your study sessions start
              </p>
            </div>
            <Switch 
              checked={settings.sessionReminders} 
              onCheckedChange={(checked) => handleToggle('sessionReminders', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Group Updates</p>
              <p className="text-sm text-muted-foreground">
                Get notified about changes in your study groups
              </p>
            </div>
            <Switch 
              checked={settings.groupUpdates} 
              onCheckedChange={(checked) => handleToggle('groupUpdates', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resource Additions</p>
              <p className="text-sm text-muted-foreground">
                Get notified when new resources are added
              </p>
            </div>
            <Switch 
              checked={settings.resourceAdditions} 
              onCheckedChange={(checked) => handleToggle('resourceAdditions', checked)}
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={savePreferences} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
};