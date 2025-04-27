import { useState, useEffect, useRef } from 'react';
import { Monitor, Laptop, LayoutGrid, X, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Id } from '../../../convex/_generated/dataModel';
import { useScreenSharing } from '@/hooks/useScreenSharing';
import { useAuth } from '@clerk/clerk-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ScreenSharingProps {
  sessionId: Id<"studySessions">;
  participants: Array<{
    id: string;
    name: string;
    active: boolean;
    avatar: string;
  }>;
}

export default function ScreenSharing({ sessionId, participants }: ScreenSharingProps) {
  const { userId } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [screenType, setScreenType] = useState<string>('entire_screen');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const {
    isSharing,
    isSharingLoading,
    activeSharing,
    hasActiveSharing,
    isSomeoneSharingScreen,
    startScreenSharing,
    stopScreenSharing
  } = useScreenSharing({ sessionId });

  // Function to toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Set up fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle mute state
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  // Handle starting screen sharing with selected type
  const handleStartSharing = () => {
    startScreenSharing(screenType);
  };

  // When we detect that someone is sharing but we don't see the video yet
  useEffect(() => {
    if (isSomeoneSharingScreen && !isSharing) {
      setIsConnecting(true);
      
      // Set a timeout to clear the connecting state if it takes too long
      const timeout = setTimeout(() => {
        const video = videoRef.current;
        if (video && !video.srcObject) {
          setIsConnecting(false);
        }
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timeout);
    }
    
    if (!isSomeoneSharingScreen) {
      setIsConnecting(false);
    }
  }, [isSomeoneSharingScreen, isSharing]);
  
  // When the video gets a source, clear connecting state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => {
      setIsConnecting(false);
    };
    
    video.addEventListener('play', handlePlay);
    
    // Check the video element for source once it renders
    if (video.srcObject) {
      setIsConnecting(false);
    }
    
    return () => {
      video.removeEventListener('play', handlePlay);
    };
  }, []);

  // Find who is sharing their screen
  const sharingUser = activeSharing ? 
    participants.find(p => p.id === activeSharing.userId) :
    null;
  
  return (
    <div className="flex flex-col h-96">
      {/* Info Bar - shows when active sharing is happening */}
      {hasActiveSharing && (
        <div className="bg-secondary/20 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2 bg-secondary/20">
              {activeSharing.screenType === 'entire_screen' ? 'Entire Screen' : 
               activeSharing.screenType === 'window' ? 'Application Window' : 'Browser Tab'}
            </Badge>
            <span className="text-sm">
              {isSharing ? "You are sharing your screen" : 
                `${sharingUser?.name || 'Someone'} is sharing their screen`}
            </span>
          </div>
          
          {isSharing && (
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={stopScreenSharing}
              className="flex items-center"
            >
              <X size={16} className="mr-1" />
              Stop sharing
            </Button>
          )}
        </div>
      )}
      
      {/* Video Display Area */}
      <div className={cn(
        "flex-1 flex items-center justify-center bg-muted rounded-md overflow-hidden relative",
        !hasActiveSharing && "border-2 border-dashed border-gray-300",
        isFullscreen && "absolute inset-0 z-50"
      )}>
        {hasActiveSharing ? (
          <>
            <video 
              ref={videoRef}
              id="remote-screen"
              className={cn("max-h-full max-w-full", isConnecting && "hidden")}
              autoPlay 
              playsInline
              muted={isMuted}
            />
            
            {isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-gray-600">Connecting to shared screen...</p>
                <p className="text-sm text-gray-500 mt-2">
                  {sharingUser ? `${sharingUser.name} is sharing their screen` : 'Someone is sharing their screen'}
                </p>
              </div>
            )}
            
            {/* Video Controls */}
            <div className="absolute bottom-4 right-4 flex bg-background/80 backdrop-blur-sm rounded-md shadow-lg p-1">
              <Button size="icon" variant="ghost" onClick={toggleMute}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <Monitor className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Screen Sharing</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Share your screen with other participants to collaborate effectively.
            </p>
            
            {userId && !isSomeoneSharingScreen && (
              <div className="flex flex-col gap-3 items-center">
                <Select
                  value={screenType}
                  onValueChange={setScreenType}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="What to share" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entire_screen">
                      <div className="flex items-center">
                        <Monitor size={16} className="mr-2" />
                        <span>Entire Screen</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="window">
                      <div className="flex items-center">
                        <Laptop size={16} className="mr-2" />
                        <span>Application Window</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tab">
                      <div className="flex items-center">
                        <LayoutGrid size={16} className="mr-2" />
                        <span>Browser Tab</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleStartSharing} 
                  disabled={isSharingLoading}
                  className="mt-2"
                >
                  {isSharingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Starting...
                    </>
                  ) : 'Share Screen'}
                </Button>
              </div>
            )}
            
            {isSomeoneSharingScreen && !hasActiveSharing && (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-amber-500">
                  {sharingUser?.name || 'Someone'} is sharing their screen. Connecting...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}