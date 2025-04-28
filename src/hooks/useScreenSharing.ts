import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';

interface UseScreenSharingProps {
  sessionId: Id<"studySessions"> | undefined;
}

interface ScreenSharingState {
  isSharing: boolean;
  isSharingLoading: boolean;
  activeSharing: any; // from the database
  viewerConnections: Record<string, RTCPeerConnection>;
  sharerConnection: RTCPeerConnection | null;
  screenStream: MediaStream | null;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export function useScreenSharing({ sessionId }: UseScreenSharingProps) {
  const { userId } = useAuth();
  const [state, setState] = useState<ScreenSharingState>({
    isSharing: false,
    isSharingLoading: false,
    activeSharing: null,
    viewerConnections: {},
    sharerConnection: null,
    screenStream: null
  });

  // Last processed signal timestamp
  const lastSignalTimestamp = useRef<number>(Date.now());

  // Convex mutations and queries
  const startSharing = useMutation(api.screenSharing.startSharing);
  const stopSharing = useMutation(api.screenSharing.stopSharing);
  const sendSignal = useMutation(api.screenSharing.sendSignal);
  const activeSharing = useQuery(
    api.screenSharing.getActiveSharing,
    sessionId ? { sessionId } : "skip"
  );
  const signals = useQuery(
    api.screenSharing.getSignals,
    sessionId ? {
      sessionId,
      after: lastSignalTimestamp.current
    } : "skip"
  );
  
  // Get all session participants
  const sessionParticipants = useQuery(
    api.studySessions.getParticipants,
    sessionId ? { sessionId } : "skip"
  );

  // Handle incoming signals for WebRTC communication
  useEffect(() => {
    if (!signals || !signals.length || !userId || !sessionId) return;

    // Update the last processed signal timestamp
    const latestTimestamp = Math.max(...signals.map(s => s.timestamp));
    if (latestTimestamp > lastSignalTimestamp.current) {
      lastSignalTimestamp.current = latestTimestamp;
    }

    // Process each signal
    signals.forEach(async (signal) => {
      try {
        const { type, payload, fromUserId } = signal;
        const data = JSON.parse(payload);

        // If we're sharing, handle viewer signals
        if (state.isSharing) {
          // Handle answer from viewer
          if (type === 'answer') {
            const connection = state.viewerConnections[fromUserId];
            if (connection) {
              await connection.setRemoteDescription(new RTCSessionDescription(data));
            }
          }
          // Handle ICE candidate from viewer
          else if (type === 'ice-candidate' && data.candidate) {
            const connection = state.viewerConnections[fromUserId];
            if (connection) {
              await connection.addIceCandidate(new RTCIceCandidate(data));
            }
          }
        }
        // If we're viewing, handle sharer signals
        else if (activeSharing && activeSharing.userId !== userId) {
          // Handle offer from sharer
          if (type === 'offer') {
            const peerConnection = createPeerConnection(fromUserId);
            
            // Set the remote description (the offer)
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
            
            // Create and send an answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            await sendSignal({
              sessionId,
              toUserId: fromUserId,
              type: 'answer',
              payload: JSON.stringify(answer)
            });

            // Save the connection
            setState(prev => ({
              ...prev,
              sharerConnection: peerConnection
            }));
          }
          // Handle ICE candidate from sharer
          else if (type === 'ice-candidate' && data.candidate && state.sharerConnection) {
            await state.sharerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        }
      } catch (error) {
        console.error("Error processing WebRTC signal:", error);
      }
    });
  }, [signals, userId, sessionId, state.isSharing, state.viewerConnections, activeSharing]);

  // Update active sharing status from server
  useEffect(() => {
    if (activeSharing) {
      const isUserSharing = activeSharing.userId === userId;
      setState(prev => ({
        ...prev,
        activeSharing,
        isSharing: isUserSharing
      }));
      
      // If we just started sharing (and we have participants data), initiate connections with viewers
      if (isUserSharing && sessionParticipants && state.screenStream) {
        // Initiate connection with all other participants
        sessionParticipants.forEach(participant => {
          if (participant.id !== userId) {
            connectToViewer(participant.id);
          }
        });
      }
    } else {
      // If no active sharing but we think we're sharing, stop
      if (state.isSharing && !state.isSharingLoading) {
        stopScreenSharing();
      }
      
      setState(prev => ({
        ...prev,
        activeSharing: null,
        isSharing: false
      }));
    }
  }, [activeSharing, userId, sessionParticipants]);

  // When we start sharing, connect to all participants
  useEffect(() => {
    if (state.isSharing && state.screenStream && sessionParticipants && sessionId) {
      // For each participant who isn't us, establish a connection
      sessionParticipants.forEach(participant => {
        if (participant.id !== userId) {
          connectToViewer(participant.id);
        }
      });
    }
  }, [state.isSharing, state.screenStream, sessionParticipants]);

  // Helper function to create a peer connection with the proper configuration
  const createPeerConnection = (targetUserId: string) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS
    });

    // Add current active tracks if we're sharing
    if (state.screenStream && state.isSharing) {
      state.screenStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, state.screenStream!);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await sendSignal({
            sessionId: sessionId!,
            toUserId: targetUserId,
            type: 'ice-candidate',
            payload: JSON.stringify({
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            })
          });
        } catch (error) {
          console.error("Failed to send ICE candidate:", error);
        }
      }
    };

    // For viewer: handle incoming stream
    peerConnection.ontrack = (event) => {
      
      // Create a new MediaStream from the received tracks
      const remoteStream = new MediaStream();
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });

      // Signal that we have a stream to display
      const videoElement = document.getElementById('remote-screen') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = remoteStream;
        videoElement.play().catch(err => console.error("Error playing video:", err));
      } else {
        console.error("Could not find remote-screen video element");
      }
    };

    return peerConnection;
  };

  // Start sharing the screen
  const startScreenSharing = async (screenType: string = 'entire_screen') => {
    if (!sessionId || !userId) {
      toast.error("Session or user information is missing");
      return;
    }

    try {
      setState(prev => ({ ...prev, isSharingLoading: true }));

      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // cursor: "always",
          displaySurface: screenType as any
        },
        audio: true // Enable audio too if available
      });

      // Register a handler for when screen sharing is stopped by the user
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };

      // Record sharing in database
      const sharingId = await startSharing({
        sessionId,
        screenType,
        title: stream.getVideoTracks()[0].label || undefined
      });

      // Set local state
      setState(prev => ({
        ...prev,
        isSharing: true,
        isSharingLoading: false,
        screenStream: stream
      }));

      // We'll initiate connections with participants in the activeSharing effect

      toast.success("Screen sharing started");
    } catch (error) {
      setState(prev => ({ ...prev, isSharingLoading: false }));
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error("Screen sharing permission denied");
      } else {
        console.error("Failed to start screen sharing:", error);
        toast.error("Failed to start screen sharing");
      }
    }
  };

  // Stop sharing the screen
  const stopScreenSharing = async () => {
    if (!sessionId || !userId) return;

    try {
      // Stop all track streams
      if (state.screenStream) {
        state.screenStream.getTracks().forEach(track => track.stop());
      }

      // Close all peer connections
      Object.values(state.viewerConnections).forEach(connection => {
        connection.close();
      });

      // Update database
      if (state.isSharing) {
        await stopSharing({ sessionId });
      }

      // Reset state
      setState(prev => ({
        ...prev,
        isSharing: false,
        isSharingLoading: false,
        screenStream: null,
        viewerConnections: {}
      }));
    } catch (error) {
      console.error("Error stopping screen sharing:", error);
      toast.error("Failed to stop screen sharing");
    }
  };

  // When someone joins, initiate connection if we're sharing
  const connectToViewer = async (viewerId: string) => {
    if (!state.isSharing || !state.screenStream || !sessionId) return;
    
    // Skip if we already have a connection with this viewer
    if (state.viewerConnections[viewerId]) {
      return;
    }
    
    try {      
      // Create a new connection for this viewer
      const peerConnection = createPeerConnection(viewerId);
      
      // Create an offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send the offer to the viewer
      await sendSignal({
        sessionId,
        toUserId: viewerId,
        type: 'offer',
        payload: JSON.stringify(offer)
      });
      
      // Add the connection to our state
      setState(prev => ({
        ...prev,
        viewerConnections: {
          ...prev.viewerConnections,
          [viewerId]: peerConnection
        }
      }));
      
    } catch (error) {
      console.error("Error connecting to viewer:", error);
    }
  };

  // Handle cleanup
  useEffect(() => {
    return () => {
      // If we're sharing, stop when the component unmounts
      if (state.isSharing) {
        stopScreenSharing();
      }
      
      // Close any existing connections
      if (state.sharerConnection) {
        state.sharerConnection.close();
      }
      
      Object.values(state.viewerConnections).forEach(connection => {
        connection.close();
      });
    };
  }, []);

  return {
    isSharing: state.isSharing,
    isSharingLoading: state.isSharingLoading,
    activeSharing, // This is the raw Convex query result
    hasActiveSharing: !!activeSharing,
    isSomeoneSharingScreen: !!activeSharing && activeSharing.userId !== userId,
    screenStream: state.screenStream,
    startScreenSharing,
    stopScreenSharing,
    connectToViewer
  };
}