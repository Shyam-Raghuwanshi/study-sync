import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface RoomsListProps {
  onJoinRoom: (roomId: Id<"rooms">) => void;
}

export function RoomsList({ onJoinRoom }: RoomsListProps) {
  const rooms = useQuery(api.rooms.listRooms) ?? [];
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const [newRoomName, setNewRoomName] = useState("");

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roomId = await createRoom({ name: newRoomName });
      setNewRoomName("");
      onJoinRoom(roomId);
      toast.success("Room created successfully");
    } catch (error) {
      toast.error("Failed to create room");
    }
  };

  const handleJoinRoom = async (roomId: Id<"rooms">) => {
    try {
      await joinRoom({ roomId });
      onJoinRoom(roomId);
      toast.success("Joined room successfully");
    } catch (error) {
      toast.error("Failed to join room");
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleCreateRoom} className="mb-6">
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="Enter room name"
          className="border p-2 rounded mr-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={!newRoomName}
        >
          Create Room
        </button>
      </form>

      <div className="grid gap-4">
        {rooms.map((room) => (
          <div
            key={room._id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold">{room.name}</h3>
              <p className="text-sm text-gray-600">Host: {room.hostName}</p>
            </div>
            <button
              onClick={() => handleJoinRoom(room._id)}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
