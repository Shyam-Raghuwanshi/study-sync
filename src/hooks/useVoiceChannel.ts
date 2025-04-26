import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface UseVoiceChannelProps {
  sessionId?: Id<"studySessions">;
  channelId?: Id<"voiceChannels">;
  userId: string;
}

interface DeviceInfo {
  hasMicrophone: boolean;
  hasCamera: boolean;
  hasAudioOutput: boolean;
}

export function useVoiceChannel({ sessionId, channelId: initialChannelId, userId }: UseVoiceChannelProps) {
  const [channelId, setChannelId] = useState<Id<"voiceChannels"> | undefined>(initialChannelId);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    hasMicrophone: false,
    hasCamera: false,
    hasAudioOutput: false
  });
  const [peerConnections, setPeerConnections] = useState<Record<string, RTCPeerConnection>>({});
  
  // Audio elements for remote peers
  const audioElements = useRef<Record<string, HTMLAudioElement>>({});
  
  // Local media stream
  const localStream = useRef<MediaStream | null>(null);
  // Last signal timestamp to avoid processing old signals
  const lastSignalTimestamp = useRef<number>(0);
  
  // Convex mutations and queries
  const createChannel = useMutation(api.voice.createChannel);
  const listChannels = useQuery(api.voice.listChannelsBySession, 
    sessionId ? { sessionId } : "skip"
  );
  const joinChannel = useMutation(api.voice.joinChannel);
  const leaveChannel = useMutation(api.voice.leaveChannel);
  const updateState = useMutation(api.voice.updateParticipantState);
  const sendSignal = useMutation(api.voice.sendSignal);
  const getChannelParticipants = useQuery(
    api.voice.getChannelParticipants, 
    channelId ? { channelId } : "skip"
  );
  const getSignals = useQuery(
    api.voice.getSignals, 
    channelId ? { 
      channelId,
      after: lastSignalTimestamp.current
    } : "skip"
  );
  
  // Check device capabilities
  useEffect(() => {
    async function checkDevices() {
      try {
        // Check for media permissions
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMic = devices.some(device => device.kind === 'audioinput');
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        const hasAudioOutput = devices.some(device => device.kind === 'audiooutput');
        
        setDeviceInfo({
          hasMicrophone: hasMic,
          hasCamera: hasCamera,
          hasAudioOutput: hasAudioOutput
        });
        
        // Store local stream for later use
        localStream.current = stream;
        
        // If we're muted, disable audio tracks
        if (isMuted && localStream.current) {
          localStream.current.getAudioTracks().forEach(track => {
            track.enabled = false;
          });
        }
        
        return () => {
          // Clean up stream when component unmounts
          if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
          }
        };
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setDeviceInfo({
          hasMicrophone: false,
          hasCamera: false,
          hasAudioOutput: false
        });
      }
    }
    
    checkDevices();
  }, []);
  
  // Update participants when the query result changes
  useEffect(() => {
    if (getChannelParticipants) {
      setParticipants(getChannelParticipants);
    }
  }, [getChannelParticipants]);
  
  // Handle WebRTC signaling
  useEffect(() => {
    if (!getSignals || !channelId) return;
    
    getSignals.forEach(signal => {
      const { fromUserId, type, payload, timestamp } = signal;
      
      // Update last signal timestamp
      if (timestamp > lastSignalTimestamp.current) {
        lastSignalTimestamp.current = timestamp;
      }
      
      if (fromUserId === userId) return; // Ignore our own signals
      
      // Handle different signal types
      switch (type) {
        case 'offer':
          handleOffer(fromUserId, JSON.parse(payload));
          break;
        case 'answer':
          handleAnswer(fromUserId, JSON.parse(payload));
          break;
        case 'ice-candidate':
          handleIceCandidate(fromUserId, JSON.parse(payload));
          break;
      }
    });
  }, [getSignals, channelId, userId]);
  
  // Initialize peer connections when new participants join
  useEffect(() => {
    if (!channelId || !participants.length) return;
    
    // Create peer connections for new participants
    participants.forEach(participant => {
      const peerId = participant.userId;
      
      // Skip ourselves
      if (peerId === userId) return;
      
      // Skip if connection already exists
      if (peerConnections[peerId]) return;
      
      // Create new peer connection
      createPeerConnection(peerId);
    });
    
    // Clean up connections for participants who left
    const currentPeerIds = participants
      .map(p => p.userId)
      .filter(id => id !== userId);
    
    const existingPeerIds = Object.keys(peerConnections);
    
    // Find peers that are no longer in the participants list
    const peersToRemove = existingPeerIds.filter(
      id => !currentPeerIds.includes(id)
    );
    
    // Clean up those connections
    peersToRemove.forEach(peerId => {
      if (peerConnections[peerId]) {
        peerConnections[peerId].close();
      }
      
      if (audioElements.current[peerId]) {
        document.body.removeChild(audioElements.current[peerId]);
        delete audioElements.current[peerId];
      }
    });
    
    // Update peer connections state
    if (peersToRemove.length > 0) {
      const updatedConnections = { ...peerConnections };
      peersToRemove.forEach(peerId => {
        delete updatedConnections[peerId];
      });
      setPeerConnections(updatedConnections);
    }
  }, [participants, channelId, userId, peerConnections]);
  
  // WebRTC functions
  const createPeerConnection = useCallback((peerId: string) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      // Add local tracks to connection
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          if (localStream.current) {
            pc.addTrack(track, localStream.current);
          }
        });
      }
      
      // Handle ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate && channelId) {
          sendSignal({
            channelId,
            toUserId: peerId,
            type: 'ice-candidate',
            payload: JSON.stringify(event.candidate)
          });
        }
      };
      
      // Handle remote tracks
      pc.ontrack = event => {
        if (!audioElements.current[peerId]) {
          const audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.controls = false;
          audioEl.style.display = 'none';
          document.body.appendChild(audioEl);
          audioElements.current[peerId] = audioEl;
        }
        
        if (audioElements.current[peerId]) {
          audioElements.current[peerId].srcObject = event.streams[0];
        }
      };
      
      // Set up connection state handler
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          // Attempt to reconnect
          if (pc.connectionState === 'failed') {
            pc.restartIce();
          }
        }
      };
      
      // Create and send offer if we are the initiator (determined by userId comparison)
      if (userId < peerId && channelId) {
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription && channelId) {
              sendSignal({
                channelId,
                toUserId: peerId,
                type: 'offer',
                payload: JSON.stringify(pc.localDescription)
              });
            }
          })
          .catch(console.error);
      }
      
      // Store the connection
      setPeerConnections(prev => ({
        ...prev,
        [peerId]: pc
      }));
      
      return pc;
    } catch (err) {
      console.error('Error creating peer connection:', err);
      return null;
    }
  }, [userId, channelId, sendSignal]);
  
  const handleOffer = useCallback(async (peerId: string, offer: RTCSessionDescriptionInit) => {
    let pc = peerConnections[peerId];
    
    if (!pc) {
      pc = createPeerConnection(peerId);
      if (!pc) return;
    }
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (channelId) {
        sendSignal({
          channelId,
          toUserId: peerId,
          type: 'answer',
          payload: JSON.stringify(pc.localDescription)
        });
      }
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [peerConnections, createPeerConnection, channelId, sendSignal]);
  
  const handleAnswer = useCallback(async (peerId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections[peerId];
    if (!pc) return;
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, [peerConnections]);
  
  const handleIceCandidate = useCallback(async (peerId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections[peerId];
    if (!pc) return;
    
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, [peerConnections]);
  
  // Function to create a new voice channel
  const createNewChannel = useCallback(async (name: string, description?: string) => {
    if (!sessionId) return;
    
    try {
      const newChannelId = await createChannel({
        sessionId,
        name,
        description
      });
      
      setChannelId(newChannelId);
      return newChannelId;
    } catch (err) {
      console.error('Error creating channel:', err);
      return null;
    }
  }, [sessionId, createChannel]);
  
  // Function to join a voice channel
  const joinVoiceChannel = useCallback(async (targetChannelId: Id<"voiceChannels">) => {
    if (!targetChannelId) return;
    
    try {
      await joinChannel({
        channelId: targetChannelId,
        deviceInfo
      });
      
      setChannelId(targetChannelId);
      return true;
    } catch (err) {
      console.error('Error joining channel:', err);
      return false;
    }
  }, [joinChannel, deviceInfo]);
  
  // Function to leave the current voice channel
  const leaveVoiceChannel = useCallback(async () => {
    if (!channelId) return;
    
    try {
      await leaveChannel({ channelId });
      
      // Close and clean up all peer connections
      Object.entries(peerConnections).forEach(([peerId, pc]) => {
        pc.close();
        
        if (audioElements.current[peerId]) {
          document.body.removeChild(audioElements.current[peerId]);
          delete audioElements.current[peerId];
        }
      });
      
      setPeerConnections({});
      setChannelId(undefined);
      return true;
    } catch (err) {
      console.error('Error leaving channel:', err);
      return false;
    }
  }, [channelId, leaveChannel, peerConnections]);
  
  // Function to toggle mute state
  const toggleMute = useCallback(async () => {
    if (!channelId) return;
    
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    try {
      await updateState({
        channelId,
        isMuted: newMuteState
      });
      
      // Mute/unmute local audio tracks
      if (localStream.current) {
        localStream.current.getAudioTracks().forEach(track => {
          track.enabled = !newMuteState;
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error toggling mute state:', err);
      return false;
    }
  }, [channelId, isMuted, updateState]);
  
  // Function to toggle deafen state
  const toggleDeafen = useCallback(async () => {
    if (!channelId) return;
    
    const newDeafenState = !isDeafened;
    setIsDeafened(newDeafenState);
    
    try {
      await updateState({
        channelId,
        isDeafened: newDeafenState
      });
      
      // Mute/unmute all audio elements
      Object.values(audioElements.current).forEach(el => {
        el.muted = newDeafenState;
      });
      
      return true;
    } catch (err) {
      console.error('Error toggling deafen state:', err);
      return false;
    }
  }, [channelId, isDeafened, updateState]);
  
  // Function to update speaking state
  const updateSpeakingState = useCallback(async (speaking: boolean) => {
    if (!channelId || speaking === isSpeaking) return;
    
    setIsSpeaking(speaking);
    
    try {
      await updateState({
        channelId,
        isSpeaking: speaking
      });
    } catch (err) {
      console.error('Error updating speaking state:', err);
    }
  }, [channelId, isSpeaking, updateState]);
  
  // Set up voice activity detection
  useEffect(() => {
    if (!localStream.current || !channelId) return;
    
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrame: number | null = null;
    let silenceTimeout: NodeJS.Timeout | null = null;
    
    const detectVoiceActivity = () => {
      if (!analyser || !dataArray) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Threshold for speech detection (adjust as needed)
      const threshold = 20;
      
      if (average > threshold && !isMuted) {
        // Voice detected
        if (!isSpeaking) {
          updateSpeakingState(true);
        }
        
        // Reset silence timeout
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
          silenceTimeout = null;
        }
        
        // Set a timeout for silence detection
        silenceTimeout = setTimeout(() => {
          updateSpeakingState(false);
        }, 500);
      }
      
      // Continue detecting
      animationFrame = requestAnimationFrame(detectVoiceActivity);
    };
    
    // Set up audio processing
    try {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      source = audioContext.createMediaStreamSource(localStream.current);
      source.connect(analyser);
      
      // Start detection
      animationFrame = requestAnimationFrame(detectVoiceActivity);
    } catch (err) {
      console.error('Error setting up voice activity detection:', err);
    }
    
    return () => {
      // Clean up
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      
      if (source) {
        source.disconnect();
      }
      
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [channelId, isMuted, isSpeaking, updateSpeakingState]);
  
  return {
    channels: listChannels || [],
    currentChannelId: channelId,
    participants,
    isMuted,
    isDeafened,
    isSpeaking,
    deviceInfo,
    
    createChannel: createNewChannel,
    joinChannel: joinVoiceChannel,
    leaveChannel: leaveVoiceChannel,
    toggleMute,
    toggleDeafen
  };
}