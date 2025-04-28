import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function VideoRoom({
  sessionId,
  onLeave
}: {
  sessionId: Id<"studySessions">,
  onLeave: () => void
}) {
  const generateToken = useAction(api.livekit.generateToken);
  const [token, setToken] = useState<string>();

  useEffect(() => {
    const setupRoom = async () => {
      try {
        const token = await generateToken({ sessionId });
        setToken(token);
      } catch (error) {
        console.error("Error generating token:", error);
        toast.error("Failed to join video room");
      }
    };
    setupRoom();
  }, [sessionId, generateToken]);

  const handleLeave = () => {
    onLeave();
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Joining video room...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      token={token}
      connect={true}
      className="h-screen"
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
