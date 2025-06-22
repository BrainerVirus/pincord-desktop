import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePeerConnectionOptions {
	iceServers?: RTCIceServer[];
	onDataChannelMessage?: (data: string) => void;
	onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export const usePeerConnection = (options: UsePeerConnectionOptions = {}) => {
	const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const dataChannelRef = useRef<RTCDataChannel | null>(null);

	const { iceServers = [{ urls: 'stun:stun.l.google.com:19302' }], onDataChannelMessage, onConnectionStateChange } = options;

	// Initialize peer connection
	const initializePeerConnection = useCallback(() => {
		if (peerConnectionRef.current) return peerConnectionRef.current;

		const pc = new RTCPeerConnection({ iceServers });

		// Handle connection state changes
		pc.onconnectionstatechange = () => {
			setConnectionState(pc.connectionState);
			onConnectionStateChange?.(pc.connectionState);
		};

		// Handle remote stream
		pc.ontrack = (event) => {
			setRemoteStream(event.streams[0]);
		};

		// Handle data channel
		pc.ondatachannel = (event) => {
			const channel = event.channel;
			channel.onmessage = (event) => {
				onDataChannelMessage?.(event.data);
			};
		};

		peerConnectionRef.current = pc;
		return pc;
	}, [iceServers, onDataChannelMessage, onConnectionStateChange]);

	// Get user media
	const getUserMedia = useCallback(
		async (constraints: MediaStreamConstraints) => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				setLocalStream(stream);

				const pc = initializePeerConnection();
				stream.getTracks().forEach((track) => {
					pc.addTrack(track, stream);
				});

				return stream;
			} catch (error) {
				console.error('Error accessing media devices:', error);
				throw error;
			}
		},
		[initializePeerConnection],
	);

	// Create offer
	const createOffer = useCallback(async () => {
		const pc = initializePeerConnection();

		// Create data channel
		dataChannelRef.current = pc.createDataChannel('messages');

		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		return offer;
	}, [initializePeerConnection]);

	// Create answer
	const createAnswer = useCallback(
		async (offer: RTCSessionDescriptionInit) => {
			const pc = initializePeerConnection();

			await pc.setRemoteDescription(offer);
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			return answer;
		},
		[initializePeerConnection],
	);

	// Set remote answer
	const setRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
		const pc = peerConnectionRef.current;
		if (pc) {
			await pc.setRemoteDescription(answer);
		}
	}, []);

	// Add ICE candidate
	const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
		const pc = peerConnectionRef.current;
		if (pc) {
			await pc.addIceCandidate(candidate);
		}
	}, []);

	// Send data through data channel
	const sendData = useCallback((data: string) => {
		if (dataChannelRef.current?.readyState === 'open') {
			dataChannelRef.current.send(data);
		}
	}, []);

	// Close connection
	const closeConnection = useCallback(() => {
		localStream?.getTracks().forEach((track) => track.stop());
		peerConnectionRef.current?.close();
		setLocalStream(null);
		setRemoteStream(null);
		setConnectionState('closed');
	}, [localStream]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			closeConnection();
		};
	}, [closeConnection]);

	return {
		connectionState,
		localStream,
		remoteStream,
		getUserMedia,
		createOffer,
		createAnswer,
		setRemoteAnswer,
		addIceCandidate,
		sendData,
		closeConnection,
		peerConnection: peerConnectionRef.current,
	};
};

// Example usage of the usePeerConnection hook in a React component
// import React, { useRef, useEffect } from 'react';
// import { usePeerConnection } from './usePeerConnection';

// const VideoCall: React.FC = () => {
//   const localVideoRef = useRef<HTMLVideoElement>(null);
//   const remoteVideoRef = useRef<HTMLVideoElement>(null);

//   const {
//     connectionState,
//     localStream,
//     remoteStream,
//     getUserMedia,
//     createOffer,
//     createAnswer,
//     setRemoteAnswer,
//     sendData,
//     closeConnection,
//   } = usePeerConnection({
//     onDataChannelMessage: (message) => {
//       console.log('Received message:', message);
//     },
//     onConnectionStateChange: (state) => {
//       console.log('Connection state:', state);
//     },
//   });

//   // Set video streams to video elements
//   useEffect(() => {
//     if (localVideoRef.current && localStream) {
//       localVideoRef.current.srcObject = localStream;
//     }
//   }, [localStream]);

//   useEffect(() => {
//     if (remoteVideoRef.current && remoteStream) {
//       remoteVideoRef.current.srcObject = remoteStream;
//     }
//   }, [remoteStream]);

//   const startCall = async () => {
//     await getUserMedia({ video: true, audio: true });
//     const offer = await createOffer();
//     // Send offer to remote peer via signaling server
//     console.log('Created offer:', offer);
//   };

//   return (
//     <div>
//       <div>Connection State: {connectionState}</div>

//       <video ref={localVideoRef} autoPlay muted style={{ width: 300 }} />
//       <video ref={remoteVideoRef} autoPlay style={{ width: 300 }} />

//       <div>
//         <button onClick={startCall}>Start Call</button>
//         <button onClick={() => sendData('Hello!')}>Send Message</button>
//         <button onClick={closeConnection}>End Call</button>
//       </div>
//     </div>
//   );
// };

// export default VideoCall;
