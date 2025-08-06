'use client';

import { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import ClientOnly from './ClientOnly';

interface VideoCallProps {
  username?: string;
}

export default function VideoCall({ username }: VideoCallProps) {
  // Generate a stable user ID using useRef to prevent regeneration on re-renders
  const stableIdRef = useRef<string>('user_' + Math.floor(Math.random() * 1000));
  // Use state to store the actual username so we can update it for reconnection
  const [actualUsername, setActualUsername] = useState<string>(username || stableIdRef.current);

  const [peerId, setPeerId] = useState<string>('');
  const [remotePeerId, setRemotePeerId] = useState<string>('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [callActive, setCallActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Using more specific type for the connection reference
  const connectionRef = useRef<MediaConnection | null>(null);

  // Update actualUsername when username prop changes
  useEffect(() => {
    if (username) {
      setActualUsername(username);
    }
  }, [username]);

  // Initialize peer connection
  useEffect(() => {
    // Only initialize peer if it doesn't exist yet
    if (peer) return;

    // Update connection status
    setConnectionStatus('connecting');
    console.log('Attempting to connect with ID:', actualUsername);

    // Create peer with more reliable configuration
    const newPeer = new Peer(actualUsername, {
      debug: 2,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun.stunprotocol.org:3478' },
          { urls: 'stun:stun.sipgate.net:3478' }
        ],
        iceCandidatePoolSize: 10
      },
      // Increase timeout for connections
      pingInterval: 5000
    });

    // Connection timeout
    const connectionTimeout = setTimeout(() => {
      if (connectionStatus === 'connecting') {
        console.error('Connection timed out');
        setConnectionStatus('error');
        // Don't destroy the peer here, just update the UI
      }
    }, 15000);

    // Set up event listeners
    newPeer.on('open', (id) => {
      console.log('%c🔑 Your Peer ID: ' + id, 'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
      console.log('Copy this ID and share it with someone to start a call');
      setPeerId(id);
      setConnectionStatus('connected');
      clearTimeout(connectionTimeout);

      // Log to console in a more visible way
      console.group('📞 PeerJS Connection Info');
      console.log('Connection Status: Connected');
      console.log('Your ID: ' + id);
      console.log('Use this ID to receive calls from others');
      console.groupEnd();
    });

    newPeer.on('call', (call) => {
      connectionRef.current = call;

      // Try to get media with fallbacks
      const getMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          handleIncomingCall(call, stream);
        } catch (err) {
          console.error('Failed to get video+audio: ', err);
          try {
            // Try audio only as fallback
            const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            handleIncomingCall(call, audioStream);
          } catch (audioErr) {
            console.error('Failed to get audio-only stream:', audioErr);
            alert('Could not access camera or microphone. Please check permissions.');
          }
        }
      };

      getMedia();
    });

    // Handle errors
    newPeer.on('error', (err) => {
      console.error('%c❌ Peer Connection Error', 'background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;', err);

      // Check for specific error types
      if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
        console.group('🔄 Connection Troubleshooting');
        console.log('Network or server error detected. Your connection may be unstable.');
        console.log('Error type:', err.type);
        console.log('Error message:', err.message);
        console.log('Try the following:');
        console.log('1. Check your internet connection');
        console.log('2. Try using the "Retry Connection" button');
        console.log('3. Refresh the page if the issue persists');
        console.groupEnd();
        setConnectionStatus('error');
      } else if (err.type === 'unavailable-id') {
        console.group('🔄 Connection Troubleshooting');
        console.log('The ID is already in use. This can happen if:');
        console.log('1. You have another tab open with the same ID');
        console.log('2. Someone else is using this ID');
        console.log('3. The server still thinks your previous connection is active');
        console.log('Try using the "Retry Connection" button to generate a new ID');
        console.groupEnd();
        setConnectionStatus('error');
      } else if (err.type === 'browser-incompatible') {
        console.group('🔄 Connection Troubleshooting');
        console.log('Your browser may not support WebRTC or has it disabled.');
        console.log('Try using a modern browser like Chrome, Firefox, or Edge.');
        console.groupEnd();
        setConnectionStatus('error');
      } else {
        console.group('🔄 Connection Troubleshooting');
        console.log('An unknown error occurred. Details:');
        console.log('Error type:', err.type);
        console.log('Error message:', err.message);
        console.groupEnd();
        setConnectionStatus('error');
      }
    });

    newPeer.on('disconnected', () => {
      console.warn('%c⚠️ Disconnected', 'background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
      console.group('🔄 Reconnection Process');
      console.log('Disconnected from the PeerJS server. This may be due to:');
      console.log('1. Network interruption');
      console.log('2. Server maintenance');
      console.log('3. Inactivity timeout');
      console.log('Attempting automatic reconnection...');
      console.groupEnd();

      setConnectionStatus('disconnected');

      // Attempt to reconnect
      newPeer.reconnect();
    });

    newPeer.on('close', () => {
      console.warn('%c🔒 Connection Closed', 'background: #607d8b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
      console.log('The connection was intentionally closed or could not be maintained.');
      setConnectionStatus('disconnected');
    });

    // Add a connection event for reconnection success
    newPeer.on('connection', () => {
      console.log('%c🔄 New Connection', 'background: #2196F3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
    });

    // Set the peer in state
    setPeer(newPeer);

    // Clean up function
    return () => {
      clearTimeout(connectionTimeout);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (newPeer) {
        try {
          newPeer.destroy();
        } catch (err) {
          console.error('Error destroying peer:', err);
        }
      }
      setConnectionStatus('disconnected');
    };
  }, [actualUsername]); // Depend on the state variable to trigger reconnection

  // Helper function to handle incoming calls
  const handleIncomingCall = (call: MediaConnection, stream: MediaStream) => {
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    call.answer(stream);
    setCallActive(true);

    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
  };

  const startCall = async () => {
    if (!peer || !remotePeerId) return;

    try {
      // Try to get video+audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      makeOutgoingCall(stream);
    } catch (err) {
      console.error('Failed to get video+audio stream:', err);

      try {
        // Fallback to audio only
        const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        makeOutgoingCall(audioStream);
        // Inform user that video is not available
        setIsVideoOff(true);
        alert('Video is not available. Proceeding with audio only.');
      } catch (audioErr) {
        console.error('Failed to get audio-only stream:', audioErr);
        alert('Could not access camera or microphone. Please check permissions.');
      }
    }
  };

  // Helper function to handle outgoing calls
  const makeOutgoingCall = (stream: MediaStream) => {
    if (!peer || !remotePeerId) return;

    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    try {
      const call = peer.call(remotePeerId, stream);
      connectionRef.current = call;

      // Set a timeout to detect connection failures
      const connectionTimeout = setTimeout(() => {
        if (!remoteVideoRef.current?.srcObject) {
          console.error('Connection timed out');
          alert('Could not connect to peer. Please check the remote ID and try again.');
          endCall();
        }
      }, 15000); // 15 seconds timeout

      call.on('stream', (remoteStream) => {
        clearTimeout(connectionTimeout);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      call.on('close', () => {
        clearTimeout(connectionTimeout);
        endCall();
      });

      call.on('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error('Call error:', err);
        alert('Call error: ' + err.message);
        endCall();
      });

      setCallActive(true);
    } catch (err) {
      console.error('Error making call:', err);
      alert('Failed to establish call. Please try again.');
    }
  };

  const endCall = () => {
    // Close the connection if it exists
    if (connectionRef.current) {
      try {
        connectionRef.current.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
      connectionRef.current = null;
    }

    // Stop all tracks in the local stream
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (trackErr) {
            console.error('Error stopping track:', trackErr);
          }
        });
      } catch (streamErr) {
        console.error('Error accessing stream tracks:', streamErr);
      }
      localStreamRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset state
    setCallActive(false);
    setRemotePeerId(''); // Clear remote ID when call ends

    // Reset mute and video states to default
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Function to retry connection when it fails
  const retryConnection = () => {
    console.log('%c🔄 Retrying Connection', 'background: #2196F3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
    console.group('Connection Retry Process');
    console.log('Attempting to establish a new connection with a fresh ID');

    // Clean up existing peer if any
    if (peer) {
      try {
        console.log('Cleaning up existing peer connection...');
        peer.destroy();
        console.log('Existing peer connection destroyed successfully');
      } catch (err) {
        console.error('Error destroying peer during retry:', err);
      }
      setPeer(null);
    }

    // Reset state
    setPeerId('');
    setConnectionStatus('connecting');

    // Create a new peer with a slightly modified ID to avoid conflicts
    const newId = 'user_' + Math.floor(Math.random() * 1000);
    stableIdRef.current = newId;
    console.log('Generated new connection ID:', newId);
    console.log('Initializing new peer connection...');
    console.groupEnd();

    // Show a temporary message to the user
    alert('Attempting to reconnect with a new ID. Please wait a moment...');

    // Force the useEffect to run again by updating actualUsername
    setActualUsername(newId);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">PeerJS Video Call Demo</h1>

      <div className="mb-4 w-full">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <p className="font-medium mr-2 text-gray-900 dark:text-gray-100">Your ID:</p>
              {/* Connection status indicator */}
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`}
                title={`Status: ${connectionStatus}`}
              ></span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'error' ? 'Connection error' : 'Disconnected'}
              </span>
            </div>
            <div className="flex">
              <input
                type="text"
                value={peerId || 'Waiting for connection...'}
                readOnly
                className={`w-full p-2 border rounded ${peerId ? 'bg-gray-50 dark:bg-gray-800 font-medium dark:text-gray-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic'}`}
              />
              <button
                onClick={() => {navigator.clipboard.writeText(peerId)}}
                className="ml-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                title="Copy to clipboard"
                disabled={!peerId}
              >
                Copy
              </button>
            </div>
            {connectionStatus === 'error' && (
              <div className="mt-1 flex items-center">
                <p className="text-xs text-red-500 mr-2">
                  Connection failed.
                </p>
                <button
                  onClick={retryConnection}
                  className="text-xs bg-blue-500 dark:bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="mb-1 font-medium text-gray-900 dark:text-gray-100">Remote ID:</p>
            <input
              type="text"
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
              placeholder="Enter remote peer ID"
              className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
              disabled={callActive || connectionStatus !== 'connected'}
            />
            {connectionStatus !== 'connected' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                You need to be connected to make a call
              </p>
            )}
          </div>
        </div>

        {!callActive ? (
          <button
            onClick={startCall}
            disabled={!remotePeerId || !peerId || connectionStatus !== 'connected'}
            className="w-full py-2 bg-green-500 dark:bg-green-600 text-white rounded flex items-center justify-center gap-2 hover:bg-green-600 dark:hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <ClientOnly><FaPhone /></ClientOnly> Start Call
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={toggleMute}
              className={`flex-1 py-2 ${isMuted ? 'bg-red-500 dark:bg-red-600' : 'bg-blue-500 dark:bg-blue-600'} text-white rounded flex items-center justify-center gap-2 hover:opacity-90`}
            >
              <ClientOnly>{isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}</ClientOnly>
              {isMuted ? 'Unmute' : 'Mute'}
            </button>

            <button
              onClick={toggleVideo}
              className={`flex-1 py-2 ${isVideoOff ? 'bg-red-500 dark:bg-red-600' : 'bg-blue-500 dark:bg-blue-600'} text-white rounded flex items-center justify-center gap-2 hover:opacity-90`}
            >
              <ClientOnly>{isVideoOff ? <FaVideoSlash /> : <FaVideo />}</ClientOnly>
              {isVideoOff ? 'Show Video' : 'Hide Video'}
            </button>

            <button
              onClick={endCall}
              className="flex-1 py-2 bg-red-500 dark:bg-red-600 text-white rounded flex items-center justify-center gap-2 hover:bg-red-600 dark:hover:bg-red-700"
            >
              <ClientOnly><FaPhoneSlash /></ClientOnly> End Call
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <div className="relative bg-black rounded overflow-hidden aspect-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            You {isMuted && '(Muted)'} {isVideoOff && '(Video Off)'}
          </div>
        </div>

        <div className="relative bg-black rounded overflow-hidden aspect-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            Remote User
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        <p>Instructions:</p>
        <ol className="list-decimal list-inside">
          <li>Share your ID with the person you want to call</li>
          <li>Enter their ID in the Remote ID field</li>
          <li>Click &quot;Start Call&quot; to begin the video call</li>
        </ol>
      </div>
    </div>
  );
}
