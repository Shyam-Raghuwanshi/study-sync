import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  AudioConference,
} from "@livekit/components-react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function VoiceRoom({ roomId, onLeave }: { roomId: Id<"rooms">, onLeave: () => void }) {
  const toggleMic = useMutation(api.rooms.toggleMic);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const generateToken = useAction(api.livekit.generateToken);
  const [token, setToken] = useState<string>();
  const [isMicOn, setIsMicOn] = useState(true);

  useEffect(() => {
    const setupRoom = async () => {
      try {
        const token = await generateToken({ roomId });
        setToken(token);
      } catch (error) {
        toast.error("Failed to join voice room");
      }
    };
    setupRoom();
  }, [roomId, generateToken]);

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
          <AudioConference />
        </div>
        <div className="p-4 bg-gray-100">
          <div className="flex justify-center gap-4">
            <button
              onClick={handleMicToggle}
              className={`px-4 py-2 rounded ${
                isMicOn ? "bg-blue-500 text-white" : "bg-gray-300"
              }`}
            >
              {isMicOn ? "Mic On" : "Mic Off"}
            </button>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    </LiveKitRoom>
  );
}
