import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function VideoRoom({ roomId, onLeave }: { roomId: any, onLeave: () => void }) {
  const toggleCamera = useMutation(api.rooms.toggleCamera);
  const toggleMic = useMutation(api.rooms.toggleMic);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const generateToken = useAction(api.livekit.generateToken);
  const [token, setToken] = useState<string>();
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  useEffect(() => {
    const setupRoom = async () => {
      try {
        const token = await generateToken({ roomId });
        setToken(token);
      } catch (error) {
        toast.error("Failed to join video room");
      }
    };
    setupRoom();
  }, [roomId, generateToken]);

  const handleCameraToggle = async () => {
    try {
      await toggleCamera({ roomId, enabled: !isCameraOn });
      setIsCameraOn(!isCameraOn);
    } catch (error) {
      toast.error("Failed to toggle camera");
    }
  };

  const handleMicToggle = async () => {
    try {
      await toggleMic({ roomId, enabled: !isMicOn });
      setIsMicOn(!isMicOn);
    } catch (error) {
      toast.error("Failed to toggle microphone");
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom({ roomId });
      onLeave();
    } catch (error) {
      toast.error("Failed to leave room");
    }
  };

  if (!token) {
    return <div>Joining room...</div>;
  }

  return (
    <LiveKitRoom
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      token={token}
      connect={true}
      className="h-screen"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <VideoConference />
        </div>
      </div>
    </LiveKitRoom>
  );
}
