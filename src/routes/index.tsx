import { createFileRoute } from '@tanstack/react-router';
import { Check, Copy, Mic, MicOff, Monitor, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

export const Route = createFileRoute('/')({
	component: App,
});

// Simplified server configuration - fewer servers for faster discovery
const servers = {
	iceServers: [
		// Just one good STUN server
		{
			urls: 'stun:stun.l.google.com:19302',
		},
		// One TURN server for NAT traversal if needed
		{
			urls: 'turn:openrelay.metered.ca:80',
			username: 'openrelayproject',
			credential: 'openrelayproject',
		},
	],
	iceCandidatePoolSize: 5, // Reduced from 10
};

type MediaState = {
	audio: boolean;
	video: boolean;
	screen: boolean;
};

type Role = 'none' | 'caller' | 'callee';

export default function App() {
	// Refs
	const pc = useRef<RTCPeerConnection | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const localVideoRef = useRef<HTMLVideoElement | null>(null);
	const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

	// State
	const [offerSdp, setOfferSdp] = useState('');
	const [answerSdp, setAnswerSdp] = useState('');
	const [, setIsConnected] = useState(false);
	const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
	const [role, setRole] = useState<Role>('none');
	const [copied, setCopied] = useState<'offer' | 'answer' | null>(null);
	const [mediaState, setMediaState] = useState<MediaState>({
		audio: true,
		video: false,
		screen: false,
	});

	const setupPeerConnection = useCallback(() => {
		if (pc.current) {
			pc.current.close();
		}

		pc.current = new RTCPeerConnection(servers);

		// Connection state monitoring
		pc.current.onconnectionstatechange = () => {
			if (pc.current) {
				const state = pc.current.connectionState;
				setConnectionState(state);
				setIsConnected(state === 'connected');
				console.log(`[${role}] Connection state:`, state);
			}
		};

		// ICE connection state monitoring
		pc.current.oniceconnectionstatechange = () => {
			if (pc.current) {
				console.log(`[${role}] ICE connection state:`, pc.current.iceConnectionState);
			}
		};

		// Remote track handling
		pc.current.ontrack = (event) => {
			console.log(`[${role}] Received remote track:`, event.track.kind);
			if (remoteVideoRef.current && event.streams[0]) {
				remoteVideoRef.current.srcObject = event.streams[0];
			}
		};

		// ICE candidate handling
		pc.current.onicecandidate = (event) => {
			if (event.candidate) {
				console.log(`[${role}] ICE Candidate:`, event.candidate.type);
			} else {
				console.log(`[${role}] ICE gathering complete`);
				// Update SDP when ICE gathering is complete
				if (pc.current?.localDescription?.type === 'offer') {
					setOfferSdp(JSON.stringify(pc.current.localDescription, null, 2));
				} else if (pc.current?.localDescription?.type === 'answer') {
					setAnswerSdp(JSON.stringify(pc.current.localDescription, null, 2));
				}
			}
		};

		// Add negotiation needed handler
		pc.current.onnegotiationneeded = async () => {
			if (role === 'caller') {
				console.log(`[${role}] Negotiation needed - creating offer`);
				try {
					const offer = await pc.current!.createOffer();
					await pc.current!.setLocalDescription(offer);
				} catch (error) {
					console.error('Error in negotiation:', error);
				}
			}
		};
	}, [role]);

	const getMediaStream = useCallback(async (constraints: MediaStreamConstraints) => {
		try {
			return await navigator.mediaDevices.getUserMedia(constraints);
		} catch (error) {
			console.error('Error accessing media:', error);
			alert('Please allow camera/microphone access to continue.');
			throw error;
		}
	}, []);

	const getScreenStream = useCallback(async () => {
		try {
			return await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: true,
			});
		} catch (error) {
			console.error('Error accessing screen:', error);
			throw error;
		}
	}, []);

	const updateMediaStream = useCallback(async () => {
		try {
			// Stop existing tracks
			localStreamRef.current?.getTracks().forEach((track) => track.stop());

			let newStream: MediaStream;

			if (mediaState.screen) {
				// Screen sharing
				newStream = await getScreenStream();

				// Add audio if enabled
				if (mediaState.audio) {
					try {
						const audioStream = await getMediaStream({ audio: true, video: false });
						audioStream.getAudioTracks().forEach((track) => {
							newStream.addTrack(track);
						});
					} catch (error) {
						console.warn('Could not add audio to screen share:', error);
					}
				}
			} else {
				// Regular camera/audio
				const constraints: MediaStreamConstraints = {};
				if (mediaState.audio) constraints.audio = true;
				if (mediaState.video) constraints.video = true;

				if (!constraints.audio && !constraints.video) {
					// Create empty stream if no media is enabled
					newStream = new MediaStream();
				} else {
					newStream = await getMediaStream(constraints);
				}
			}

			localStreamRef.current = newStream;

			// Update local video element
			if (localVideoRef.current) {
				localVideoRef.current.srcObject = newStream;
			}

			// Replace tracks in peer connection if it exists
			if (pc.current) {
				const senders = pc.current.getSenders();

				// Handle video track
				const videoTrack = newStream.getVideoTracks()[0] || null;
				const videoSender = senders.find((s) => s.track?.kind === 'video');
				if (videoSender) {
					await videoSender.replaceTrack(videoTrack);
				} else if (videoTrack) {
					pc.current.addTrack(videoTrack, newStream);
				}

				// Handle audio track
				const audioTrack = newStream.getAudioTracks()[0] || null;
				const audioSender = senders.find((s) => s.track?.kind === 'audio');
				if (audioSender) {
					await audioSender.replaceTrack(audioTrack);
				} else if (audioTrack) {
					pc.current.addTrack(audioTrack, newStream);
				}
			}
		} catch (error) {
			console.error('Error updating media stream:', error);
		}
	}, [mediaState, getMediaStream, getScreenStream]);

	const handleStartAsCaller = async () => {
		setRole('caller');
		setupPeerConnection();
		await updateMediaStream();

		// Auto-create offer after setting up
		setTimeout(async () => {
			if (pc.current) {
				try {
					const offer = await pc.current.createOffer({
						offerToReceiveAudio: true,
						offerToReceiveVideo: true,
					});
					await pc.current.setLocalDescription(offer);
					console.log('[Caller] Offer created automatically');
				} catch (error) {
					console.error('Error creating initial offer:', error);
				}
			}
		}, 100);
	};

	const handleStartAsCallee = async () => {
		setRole('callee');
		setupPeerConnection();
		await updateMediaStream();
	};

	const handleCreateAnswer = async () => {
		if (!pc.current || role !== 'callee') {
			alert('Please start as callee first and paste the offer!');
			return;
		}

		try {
			const offer = JSON.parse(offerSdp);
			await pc.current.setRemoteDescription(new RTCSessionDescription(offer));

			const answerDescription = await pc.current.createAnswer();
			await pc.current.setLocalDescription(answerDescription);

			console.log('[Callee] Answer created');
		} catch (error) {
			console.error('Error creating answer:', error);
			alert('Invalid offer SDP. Please check the format.');
		}
	};

	const handleAddAnswer = async () => {
		if (!pc.current || role !== 'caller') {
			alert('Please start as caller first!');
			return;
		}

		try {
			const answer = JSON.parse(answerSdp);
			if (!pc.current.currentRemoteDescription) {
				await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
				console.log('[Caller] Answer added - connection should establish');
			}
		} catch (error) {
			console.error('Error setting answer:', error);
			alert('Invalid answer SDP. Please check the format.');
		}
	};

	const handleEndCall = () => {
		pc.current?.close();
		pc.current = null;

		localStreamRef.current?.getTracks().forEach((track) => track.stop());
		localStreamRef.current = null;

		if (localVideoRef.current) localVideoRef.current.srcObject = null;
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

		setOfferSdp('');
		setAnswerSdp('');
		setIsConnected(false);
		setConnectionState('new');
		setRole('none');
		setCopied(null);
	};

	const copyToClipboard = async (text: string, type: 'offer' | 'answer') => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(type);
			setTimeout(() => setCopied(null), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	const toggleAudio = async () => {
		const newState = { ...mediaState, audio: !mediaState.audio };
		setMediaState(newState);

		if (localStreamRef.current) {
			await updateMediaStream();
		}
	};

	const toggleVideo = async () => {
		const newState = { ...mediaState, video: !mediaState.video, screen: false };
		setMediaState(newState);

		if (localStreamRef.current) {
			await updateMediaStream();
		}
	};

	const toggleScreenShare = async () => {
		const newState = {
			...mediaState,
			screen: !mediaState.screen,
			video: mediaState.screen ? mediaState.video : false,
		};
		setMediaState(newState);

		if (localStreamRef.current) {
			await updateMediaStream();
		}
	};

	const getConnectionStatusColor = () => {
		switch (connectionState) {
			case 'connected':
				return 'text-green-600';
			case 'connecting':
				return 'text-yellow-600';
			case 'failed':
				return 'text-red-600';
			case 'disconnected':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center bg-gray-100 p-4">
			<header className="w-full max-w-6xl text-center">
				<h1 className="mb-2 text-3xl font-bold">WebRTC Local Test</h1>
				<p className="mb-2 text-gray-600">Open two tabs to test P2P connection locally</p>
				<div className="flex items-center justify-center gap-4 text-sm">
					<span className={`font-medium ${getConnectionStatusColor()}`}>Status: {connectionState.toUpperCase()}</span>
					<span className="font-medium text-blue-600">Role: {role.toUpperCase()}</span>
				</div>
			</header>

			{/* Instructions */}
			{role === 'none' && (
				<div className="mb-6 w-full max-w-4xl rounded-lg bg-blue-50 p-4">
					<h3 className="mb-2 font-semibold text-blue-800">How to test locally:</h3>
					<ol className="list-inside list-decimal space-y-1 text-blue-700">
						<li>Open two browser tabs with this page</li>
						<li>In Tab 1: Click &quot;Start as Caller&quot;</li>
						<li>In Tab 2: Click &quot;Start as Callee&quot;</li>
						<li>Copy the offer from Tab 1 to Tab 2</li>
						<li>In Tab 2: Click &quot;Create Answer&quot;</li>
						<li>Copy the answer from Tab 2 to Tab 1</li>
						<li>In Tab 1: Click &quot;Add Answer&quot;</li>
						<li>Connection should establish!</li>
					</ol>
				</div>
			)}

			{/* Role Selection / Connection Controls */}
			{role === 'none' ? (
				<div className="mb-4 flex w-full max-w-6xl justify-center gap-4">
					<button className="flex items-center gap-2 rounded bg-blue-500 px-6 py-3 text-white hover:bg-blue-600" onClick={handleStartAsCaller}>
						<Phone size={20} />
						Start as Caller (Tab 1)
					</button>

					<button className="flex items-center gap-2 rounded bg-green-500 px-6 py-3 text-white hover:bg-green-600" onClick={handleStartAsCallee}>
						<Phone size={20} />
						Start as Callee (Tab 2)
					</button>
				</div>
			) : (
				<>
					{/* Media Controls */}
					<div className="mb-4 flex w-full max-w-6xl justify-center gap-4">
						<button
							onClick={toggleAudio}
							className={`flex items-center gap-2 rounded px-4 py-2 text-white ${
								mediaState.audio ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
							}`}
						>
							{mediaState.audio ? <Mic size={20} /> : <MicOff size={20} />}
							{mediaState.audio ? 'Mute' : 'Unmute'}
						</button>

						<button
							onClick={toggleVideo}
							className={`flex items-center gap-2 rounded px-4 py-2 text-white ${
								mediaState.video ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
							}`}
						>
							{mediaState.video ? <Video size={20} /> : <VideoOff size={20} />}
							{mediaState.video ? 'Stop Video' : 'Start Video'}
						</button>

						<button
							onClick={toggleScreenShare}
							className={`flex items-center gap-2 rounded px-4 py-2 text-white ${
								mediaState.screen ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
							}`}
						>
							<Monitor size={20} />
							{mediaState.screen ? 'Stop Sharing' : 'Share Screen'}
						</button>

						<button className="flex items-center gap-2 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600" onClick={handleEndCall}>
							<PhoneOff size={20} />
							End Call
						</button>
					</div>

					{/* Video Elements */}
					<div className="mb-4 grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
						<div className="relative">
							<h3 className="mb-2 text-center font-semibold">You ({role})</h3>
							<video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black shadow-md">
								<track kind="captions" />
							</video>
							<div className="absolute bottom-2 left-2 flex gap-1">
								{!mediaState.audio && (
									<div className="rounded bg-red-500 p-1">
										<MicOff size={16} className="text-white" />
									</div>
								)}
								{mediaState.screen && (
									<div className="rounded bg-blue-500 p-1">
										<Monitor size={16} className="text-white" />
									</div>
								)}
							</div>
						</div>

						<div className="relative">
							<h3 className="mb-2 text-center font-semibold">Remote Peer</h3>
							<video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-lg bg-black shadow-md">
								<track kind="captions" />
							</video>
						</div>
					</div>

					{/* SDP Exchange - Simplified based on role */}
					{role === 'caller' && (
						<div className="w-full max-w-4xl space-y-4">
							<div className="rounded-lg bg-blue-50 p-4">
								<h3 className="mb-2 font-semibold text-blue-800">Step 1: Copy this offer to the other tab (callee)</h3>
								<div className="relative">
									<textarea
										className="h-32 w-full rounded border p-2 font-mono text-xs"
										value={offerSdp}
										readOnly
										placeholder="Offer will appear here automatically..."
									/>
									{offerSdp && (
										<button
											onClick={() => copyToClipboard(offerSdp, 'offer')}
											className="absolute top-2 right-2 flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
										>
											{copied === 'offer' ? <Check size={12} /> : <Copy size={12} />}
											{copied === 'offer' ? 'Copied!' : 'Copy'}
										</button>
									)}
								</div>
							</div>

							<div className="rounded-lg bg-green-50 p-4">
								<h3 className="mb-2 font-semibold text-green-800">Step 2: Paste answer from callee here</h3>
								<textarea
									className="mb-2 h-32 w-full rounded border p-2 font-mono text-xs"
									value={answerSdp}
									onChange={(e) => setAnswerSdp(e.target.value)}
									placeholder="Paste the answer from the callee tab here..."
								/>
								<button
									className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
									onClick={handleAddAnswer}
									disabled={!answerSdp.trim()}
								>
									Add Answer & Connect
								</button>
							</div>
						</div>
					)}

					{role === 'callee' && (
						<div className="w-full max-w-4xl space-y-4">
							<div className="rounded-lg bg-orange-50 p-4">
								<h3 className="mb-2 font-semibold text-orange-800">Step 1: Paste offer from caller here</h3>
								<textarea
									className="mb-2 h-32 w-full rounded border p-2 font-mono text-xs"
									value={offerSdp}
									onChange={(e) => setOfferSdp(e.target.value)}
									placeholder="Paste the offer from the caller tab here..."
								/>
								<button
									className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
									onClick={handleCreateAnswer}
									disabled={!offerSdp.trim()}
								>
									Create Answer
								</button>
							</div>

							<div className="rounded-lg bg-purple-50 p-4">
								<h3 className="mb-2 font-semibold text-purple-800">Step 2: Copy this answer back to caller</h3>
								<div className="relative">
									<textarea
										className="h-32 w-full rounded border p-2 font-mono text-xs"
										value={answerSdp}
										readOnly
										placeholder="Answer will appear here after creating..."
									/>
									{answerSdp && (
										<button
											onClick={() => copyToClipboard(answerSdp, 'answer')}
											className="absolute top-2 right-2 flex items-center gap-1 rounded bg-purple-500 px-2 py-1 text-xs text-white hover:bg-purple-600"
										>
											{copied === 'answer' ? <Check size={12} /> : <Copy size={12} />}
											{copied === 'answer' ? 'Copied!' : 'Copy'}
										</button>
									)}
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
