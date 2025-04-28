import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  AudioConference,
} from "@livekit/components-react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function VoiceRoom({ groupId }: { groupId: any }) {
  const generateToken = useAction(api.livekit.generateToken);
  const [token, setToken] = useState<string>();

  useEffect(() => {
    const setupRoom = async () => {
      try {
        const token = await generateToken({ groupId });
        setToken(token);
      } catch (error) {
        toast.error("Failed to join voice room");
      }
    };
    setupRoom();
  }, [groupId, generateToken]);

  if (!token) {
    return <div>Joining room...</div>;
  }

  return (
    <LiveKitRoom
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      token={token}
      connect={true}
    >
      <AudioConference />
    </LiveKitRoom>
  );
}
