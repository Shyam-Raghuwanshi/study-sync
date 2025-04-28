import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { useVoiceChannel } from '../../hooks/useVoiceChannel';
import { Id } from '../../../convex/_generated/dataModel';
import { Mic, MicOff, Headphones, HeadphoneOff, Plus, X, User, Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { VoiceRoom } from '../AudioRoom';

interface VoiceChannelProps {
  sessionId: Id<"studySessions">;
  className?: string;
}

export function VoiceChannel({ sessionId, className }: VoiceChannelProps) {
  const { userId } = useAuth();
  const [channelName, setChannelName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [activeRoomId, setActiveRoomId] = useState<Id<"rooms"> | null>(null);
  
  const {
    channels,
    currentChannelId,
    participants,
    isMuted,
    isDeafened,
    createChannel,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen
  } = useVoiceChannel({
    sessionId,
    userId: userId || 'anonymous'
  });

  const handleCreateChannel = async () => {
    if (!channelName.trim()) return;
    
    const result = await createChannel(channelName);
    setChannelName('');
    setIsCreating(false);
    
    if (result && typeof result === 'object') {
      // Set the room ID returned from creating the channel
      setActiveRoomId(result as Id<"rooms">);
    }
  };

  const handleJoinChannel = async (channelId: Id<"voiceChannels">) => {
    const result = await joinChannel(channelId);
    if (result && typeof result === 'object') {
      // Set the room ID returned from joining the channel
      setActiveRoomId(result as Id<"rooms">);
    }
  };

  const handleLeaveAudioRoom = () => {
    leaveChannel();
    setActiveRoomId(null);
  };

  // If we have an active room ID, show the AudioRoom component
  if (activeRoomId) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-md">Voice Channel</CardTitle>
          <CardDescription>Currently in a voice channel</CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceRoom 
            roomId={activeRoomId} 
            onLeave={handleLeaveAudioRoom} 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-md">Voice Channels</CardTitle>
          <CardDescription>
            {currentChannelId ? 'Connected to voice' : 'Join a voice channel'}
          </CardDescription>
        </div>
        
        {!currentChannelId && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {isCreating && !currentChannelId && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Channel name"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground"
            />
            <Button onClick={handleCreateChannel} size="sm">Create</Button>
          </div>
        )}
        
        {currentChannelId && !activeRoomId ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Current Channel
              </h4>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => leaveChannel()}
              >
                Disconnect
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={isMuted ? "destructive" : "outline"} 
                size="sm" 
                onClick={() => toggleMute()}
              >
                {isMuted ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
              
              <Button 
                variant={isDeafened ? "destructive" : "outline"} 
                size="sm" 
                onClick={() => toggleDeafen()}
              >
                {isDeafened ? <HeadphoneOff className="h-4 w-4 mr-1" /> : <Headphones className="h-4 w-4 mr-1" />}
                {isDeafened ? 'Undeafen' : 'Deafen'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Participants</h4>
              <div className="space-y-1">
                {participants.map((participant) => (
                  <div 
                    key={participant._id} 
                    className="flex items-center gap-2 p-2 rounded-md bg-muted"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{participant.userId}</span>
                    {participant.isSpeaking && (
                      <Volume2 className="h-4 w-4 ml-auto text-green-500 animate-pulse" />
                    )}
                    {participant.isMuted && (
                      <MicOff className="h-3 w-3 ml-auto text-destructive" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {channels.length > 0 ? (
              channels.map((channel) => (
                <div 
                  key={channel._id} 
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleJoinChannel(channel._id as Id<"voiceChannels">)}
                >
                  <div>
                    <p className="text-sm font-medium">{channel.name}</p>
                    {channel.description && (
                      <p className="text-xs text-muted-foreground">{channel.description}</p>
                    )}
                  </div>
                  <Button size="sm" variant="secondary">Join</Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No voice channels available. Create one to get started.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}