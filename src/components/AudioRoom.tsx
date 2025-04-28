import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  AudioConference,
} from "@livekit/components-react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function VoiceRoom({ groupId }: { groupId: any }) {
  const generateTokenForGroup = useAction(api.livekit.generateTokenForGroup);
  const [token, setToken] = useState<string>();

  useEffect(() => {
    const setupRoom = async () => {
      try {
        const token = await generateTokenForGroup({ groupId });
        setToken(token);
      } catch (error) {
        toast.error("Failed to join voice room");
      }
    };
    setupRoom();
  }, [groupId, generateTokenForGroup]);

  if (!token) {
    return <div>Joining room...</div>;
  }
  return (
    <LiveKitRoom
      serverUrl={"wss://convex-bas1qcb7.livekit.cloud"}
      token={token}
      connect={true}
    >
      <AudioConference />
    </LiveKitRoom>
  );
}
