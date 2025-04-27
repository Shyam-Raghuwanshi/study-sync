import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, PlusCircle, Users, Video } from "lucide-react";
import { useParams } from "react-router-dom";

interface RoomsListProps {
  onJoinRoom: (roomId: Id<"rooms">) => void;
  sessionId: Id<"studySessions">; // Add sessionId prop
}

export function RoomsList({ onJoinRoom, sessionId }: RoomsListProps) {
  // Pass sessionId to the query
  const rooms = useQuery(api.rooms.listRooms, { sessionId });
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    try {
      setIsCreating(true);
      // Pass sessionId when creating a room
      const roomId = await createRoom({ 
        name: newRoomName.trim(),
        sessionId 
      });
      setNewRoomName("");
      onJoinRoom(roomId);
      toast.success("Room created successfully");
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomId: Id<"rooms">) => {
    try {
      await joinRoom({ roomId });
      onJoinRoom(roomId);
      toast.success("Joined room successfully");
    } catch (error) {
      console.error("Failed to join room:", error);
      toast.error("Failed to join room");
    }
  };

  // Loading state
  if (rooms === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading rooms...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg shadow-sm p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Video className="h-5 w-5 mr-2 text-primary" />
          Create New Room
        </h2>
        
        <form onSubmit={handleCreateRoom} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Enter room name"
            className="flex-1"
            disabled={isCreating}
          />
          <Button 
            type="submit" 
            disabled={!newRoomName.trim() || isCreating}
            className="whitespace-nowrap"
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Room
          </Button>
        </form>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary" />
          Available Rooms {rooms.length > 0 && `(${rooms.length})`}
        </h2>
        
        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <Card key={room._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-6">
                    <h3 className="font-semibold text-lg">{room.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Host: {room.hostName || "Anonymous"}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {new Date(room.creationTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {room.participants?.length || 1} participants
                    </span>
                    <Button onClick={() => handleJoinRoom(room._id)}>
                      Join Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms available</h3>
            <p className="text-gray-500 mb-4">
              Create a new room to start screen sharing with your study group.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
