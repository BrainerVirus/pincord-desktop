import { createFileRoute } from '@tanstack/react-router';
import { AlertCircle, Check, CheckCircle, Copy, Mic, MicOff, Monitor, Phone, PhoneOff, Settings, Video, VideoOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/')({
	component: App,
});

// Enhanced server configuration with multiple TURN servers for better reliability
const servers = {
	iceServers: [
		{
			urls: [
				'stun:stun.l.google.com:19302',
				'stun:stun1.l.google.com:19302',
				'stun:stun2.l.google.com:19302',
				'stun:stun3.l.google.com:19302',
				'stun:stun4.l.google.com:19302',
			],
		},
	],
	iceCandidatePoolSize: 5,
};

type MediaState = {
	audio: boolean;
	video: boolean;
	screen: boolean;
};

type Role = 'none' | 'caller' | 'callee';

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'prompt';

type DeviceInfo = {
	deviceId: string;
	label: string;
	kind: MediaDeviceKind;
};

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

	// Permissions and devices
	const [permissions, setPermissions] = useState<{
		camera: PermissionStatus;
		microphone: PermissionStatus;
	}>({
		camera: 'unknown',
		microphone: 'unknown',
	});

	const [devices, setDevices] = useState<{
		audioInputs: DeviceInfo[];
		videoInputs: DeviceInfo[];
		audioOutputs: DeviceInfo[];
	}>({
		audioInputs: [],
		videoInputs: [],
		audioOutputs: [],
	});

	const [selectedDevices, setSelectedDevices] = useState<{
		audioInput: string;
		videoInput: string;
		audioOutput: string;
	}>({
		audioInput: '',
		videoInput: '',
		audioOutput: '',
	});

	const [showDeviceSettings, setShowDeviceSettings] = useState(false);

	// Check permissions on component mount
	useEffect(() => {
		checkPermissions();
		enumerateDevices();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const checkPermissions = async () => {
		try {
			// Check camera permission
			const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
			// Check microphone permission
			const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

			setPermissions({
				camera: cameraPermission.state as PermissionStatus,
				microphone: micPermission.state as PermissionStatus,
			});

			// Listen for permission changes
			cameraPermission.onchange = () => {
				setPermissions((prev) => ({ ...prev, camera: cameraPermission.state as PermissionStatus }));
			};

			micPermission.onchange = () => {
				setPermissions((prev) => ({ ...prev, microphone: micPermission.state as PermissionStatus }));
			};
		} catch (error) {
			console.warn('Permission API not supported:', error);
		}
	};

	const requestPermissions = async () => {
		try {
			// Request both camera and microphone permissions
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});

			// Stop the stream immediately, we just wanted permissions
			stream.getTracks().forEach((track) => track.stop());

			// Update permissions and enumerate devices
			await checkPermissions();
			await enumerateDevices();

			alert('Permissions granted! You can now use camera and microphone.');
		} catch (error) {
			console.error('Permission denied:', error);
			alert('Please allow camera and microphone access in your browser settings.');
		}
	};

	const enumerateDevices = async () => {
		try {
			const deviceList = await navigator.mediaDevices.enumerateDevices();

			const audioInputs: DeviceInfo[] = [];
			const videoInputs: DeviceInfo[] = [];
			const audioOutputs: DeviceInfo[] = [];

			deviceList.forEach((device) => {
				const deviceInfo: DeviceInfo = {
					deviceId: device.deviceId,
					label: device.label || `${device.kind} ${device.deviceId.substring(0, 8)}`,
					kind: device.kind,
				};

				switch (device.kind) {
					case 'audioinput':
						audioInputs.push(deviceInfo);
						break;
					case 'videoinput':
						videoInputs.push(deviceInfo);
						break;
					case 'audiooutput':
						audioOutputs.push(deviceInfo);
						break;
				}
			});

			setDevices({ audioInputs, videoInputs, audioOutputs });

			// Set default devices if not already set
			if (!selectedDevices.audioInput && audioInputs.length > 0) {
				setSelectedDevices((prev) => ({ ...prev, audioInput: audioInputs[0].deviceId }));
			}
			if (!selectedDevices.videoInput && videoInputs.length > 0) {
				setSelectedDevices((prev) => ({ ...prev, videoInput: videoInputs[0].deviceId }));
			}
			if (!selectedDevices.audioOutput && audioOutputs.length > 0) {
				setSelectedDevices((prev) => ({ ...prev, audioOutput: audioOutputs[0].deviceId }));
			}
		} catch (error) {
			console.error('Error enumerating devices:', error);
		}
	};

	const setupPeerConnection = useCallback(() => {
		if (pc.current) {
			pc.current.close();
		}

		pc.current = new RTCPeerConnection(servers);

		// Enhanced connection monitoring
		pc.current.onconnectionstatechange = () => {
			if (pc.current) {
				const state = pc.current.connectionState;
				setConnectionState(state);
				setIsConnected(state === 'connected');
				console.log(`[${role}] Connection state:`, state);

				if (state === 'failed') {
					console.error('Connection failed - trying to restart ICE');
					pc.current?.restartIce();
				}
			}
		};

		pc.current.oniceconnectionstatechange = () => {
			if (pc.current) {
				console.log(`[${role}] ICE connection state:`, pc.current.iceConnectionState);

				if (pc.current.iceConnectionState === 'failed') {
					console.error('ICE connection failed');
				}
			}
		};

		pc.current.ontrack = (event) => {
			console.log(`[${role}] Received remote track:`, event.track.kind);
			if (remoteVideoRef.current && event.streams[0]) {
				remoteVideoRef.current.srcObject = event.streams[0];
			}
		};

		pc.current.onicecandidate = (event) => {
			if (event.candidate) {
				console.log(`[${role}] ICE Candidate:`, event.candidate.type, event.candidate.address);
			} else {
				console.log(`[${role}] ICE gathering complete`);
				if (pc.current?.localDescription?.type === 'offer') {
					setOfferSdp(JSON.stringify(pc.current.localDescription, null, 2));
				} else if (pc.current?.localDescription?.type === 'answer') {
					setAnswerSdp(JSON.stringify(pc.current.localDescription, null, 2));
				}
			}
		};

		pc.current.onnegotiationneeded = async () => {
			if (role === 'caller' && pc.current?.signalingState === 'stable') {
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

	const getMediaStream = useCallback(
		async (constraints: MediaStreamConstraints) => {
			try {
				// Apply device constraints if devices are selected
				if (typeof constraints.audio === 'object' || constraints.audio === true) {
					constraints.audio = {
						deviceId: selectedDevices.audioInput ? { exact: selectedDevices.audioInput } : undefined,
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true,
					};
				}

				if (typeof constraints.video === 'object' || constraints.video === true) {
					constraints.video = {
						deviceId: selectedDevices.videoInput ? { exact: selectedDevices.videoInput } : undefined,
						width: { ideal: 1280 },
						height: { ideal: 720 },
						frameRate: { ideal: 30 },
					};
				}

				console.log('Requesting media with constraints:', constraints);
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				console.log(
					'Media stream obtained:',
					stream.getTracks().map((t) => `${t.kind}: ${t.label}`),
				);
				return stream;
			} catch (error) {
				console.error('Error accessing media:', error);
				throw error;
			}
		},
		[selectedDevices.audioInput, selectedDevices.videoInput],
	);

	const getScreenStream = useCallback(async () => {
		try {
			console.log('Requesting screen share...');
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					frameRate: { ideal: 30 },
				},
				audio: true, // Include system audio
			});
			console.log(
				'Screen stream obtained:',
				stream.getTracks().map((t) => `${t.kind}: ${t.label}`),
			);
			return stream;
		} catch (error) {
			console.error('Error accessing screen:', error);
			throw error;
		}
	}, []);

	const updateMediaStream = useCallback(async () => {
		try {
			// Stop existing tracks
			localStreamRef.current?.getTracks().forEach((track) => {
				console.log('Stopping track:', track.kind, track.label);
				track.stop();
			});

			let newStream: MediaStream;

			if (mediaState.screen) {
				// Screen sharing
				newStream = await getScreenStream();

				// Add microphone audio if enabled and not already included
				if (mediaState.audio && newStream.getAudioTracks().length === 0) {
					try {
						const audioStream = await getMediaStream({ audio: true, video: false });
						audioStream.getAudioTracks().forEach((track) => {
							newStream.addTrack(track);
						});
					} catch (error) {
						console.warn('Could not add microphone to screen share:', error);
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

			// Set audio output device if supported
			if (selectedDevices.audioOutput && 'setSinkId' in HTMLVideoElement.prototype) {
				try {
					await (remoteVideoRef.current as HTMLVideoElement & { setSinkId: (deviceId: string) => Promise<void> })?.setSinkId(
						selectedDevices.audioOutput,
					);
				} catch (error) {
					console.warn('Could not set audio output device:', error);
				}
			}

			// Replace tracks in peer connection if it exists
			if (pc.current) {
				const senders = pc.current.getSenders();

				// Handle video track
				const videoTrack = newStream.getVideoTracks()[0] || null;
				const videoSender = senders.find((s) => s.track?.kind === 'video');
				if (videoSender) {
					console.log('Replacing video track');
					await videoSender.replaceTrack(videoTrack);
				} else if (videoTrack) {
					console.log('Adding video track');
					pc.current.addTrack(videoTrack, newStream);
				}

				// Handle audio track
				const audioTrack = newStream.getAudioTracks()[0] || null;
				const audioSender = senders.find((s) => s.track?.kind === 'audio');
				if (audioSender) {
					console.log('Replacing audio track');
					await audioSender.replaceTrack(audioTrack);
				} else if (audioTrack) {
					console.log('Adding audio track');
					pc.current.addTrack(audioTrack, newStream);
				}
			}
		} catch (error) {
			console.error('Error updating media stream:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			alert(`Error accessing media: ${errorMessage}. Please check permissions and try again.`);
		}
	}, [mediaState, getMediaStream, getScreenStream, selectedDevices.audioOutput]);

	const handleStartAsCaller = async () => {
		if (permissions.microphone !== 'granted' || permissions.camera !== 'granted') {
			const proceed = confirm('Camera and microphone permissions are required. Grant permissions now?');
			if (proceed) {
				await requestPermissions();
			} else {
				return;
			}
		}

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
		}, 1000);
	};

	const handleStartAsCallee = async () => {
		if (permissions.microphone !== 'granted' || permissions.camera !== 'granted') {
			const proceed = confirm('Camera and microphone permissions are required. Grant permissions now?');
			if (proceed) {
				await requestPermissions();
			} else {
				return;
			}
		}

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

	const getPermissionIcon = (status: PermissionStatus) => {
		switch (status) {
			case 'granted':
				return <CheckCircle size={16} className="text-green-600" />;
			case 'denied':
				return <AlertCircle size={16} className="text-red-600" />;
			default:
				return <AlertCircle size={16} className="text-yellow-600" />;
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center bg-gray-100 p-4">
			<header className="w-full max-w-6xl text-center">
				<h1 className="mb-2 text-3xl font-bold">Enhanced WebRTC Test</h1>
				<p className="mb-2 text-gray-600">Full-featured WebRTC with device selection and permissions</p>
				<div className="flex items-center justify-center gap-4 text-sm">
					<span className={`font-medium ${getConnectionStatusColor()}`}>Status: {connectionState.toUpperCase()}</span>
					<span className="font-medium text-blue-600">Role: {role.toUpperCase()}</span>
				</div>
			</header>

			{/* Permissions Status */}
			<div className="mb-4 w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
				<h3 className="mb-2 font-semibold">Permissions Status</h3>
				<div className="flex items-center justify-between">
					<div className="flex gap-4">
						<div className="flex items-center gap-2">
							{getPermissionIcon(permissions.microphone)}
							<span>Microphone: {permissions.microphone}</span>
						</div>
						<div className="flex items-center gap-2">
							{getPermissionIcon(permissions.camera)}
							<span>Camera: {permissions.camera}</span>
						</div>
					</div>
					<div className="flex gap-2">
						<button onClick={requestPermissions} className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
							Request Permissions
						</button>
						<button
							onClick={() => setShowDeviceSettings(!showDeviceSettings)}
							className="flex items-center gap-1 rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
						>
							<Settings size={16} />
							Devices
						</button>
					</div>
				</div>
			</div>

			{/* Device Settings */}
			{showDeviceSettings && (
				<div className="mb-4 w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
					<h3 className="mb-4 font-semibold">Device Settings</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							<label htmlFor="audioInput" className="mb-1 block text-sm font-medium">
								Microphone
							</label>
							<select
								id="audioInput"
								value={selectedDevices.audioInput}
								onChange={(e) => setSelectedDevices((prev) => ({ ...prev, audioInput: e.target.value }))}
								className="w-full rounded border p-2 text-sm"
							>
								{devices.audioInputs.map((device) => (
									<option key={device.deviceId} value={device.deviceId}>
										{device.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="videoInput" className="mb-1 block text-sm font-medium">
								Camera
							</label>
							<select
								id="videoInput"
								value={selectedDevices.videoInput}
								onChange={(e) => setSelectedDevices((prev) => ({ ...prev, videoInput: e.target.value }))}
								className="w-full rounded border p-2 text-sm"
							>
								{devices.videoInputs.map((device) => (
									<option key={device.deviceId} value={device.deviceId}>
										{device.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="audioOutput" className="mb-1 block text-sm font-medium">
								Speakers
							</label>
							<select
								id="audioOutput"
								value={selectedDevices.audioOutput}
								onChange={(e) => setSelectedDevices((prev) => ({ ...prev, audioOutput: e.target.value }))}
								className="w-full rounded border p-2 text-sm"
							>
								{devices.audioOutputs.map((device) => (
									<option key={device.deviceId} value={device.deviceId}>
										{device.label}
									</option>
								))}
							</select>
						</div>
					</div>
					<button onClick={enumerateDevices} className="mt-2 rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600">
						Refresh Devices
					</button>
				</div>
			)}

			{/* Instructions */}
			{role === 'none' && (
				<div className="mb-6 w-full max-w-4xl rounded-lg bg-blue-50 p-4">
					<h3 className="mb-2 font-semibold text-blue-800">Testing Instructions:</h3>
					<ol className="list-inside list-decimal space-y-1 text-blue-700">
						<li>Make sure permissions are granted (green checkmarks above)</li>
						<li>Configure your preferred devices in settings</li>
						<li>Open two instances (tabs/windows/separate computers)</li>
						<li>One person: &quot;Start as Caller&quot;, other: &quot;Start as Callee&quot;</li>
						<li>Copy/paste the SDP offers and answers</li>
						<li>Connection should establish with audio/video!</li>
					</ol>
				</div>
			)}

			{/* Role Selection / Connection Controls */}
			{role === 'none' ? (
				<div className="mb-4 flex w-full max-w-6xl justify-center gap-4">
					<button className="flex items-center gap-2 rounded bg-blue-500 px-6 py-3 text-white hover:bg-blue-600" onClick={handleStartAsCaller}>
						<Phone size={20} />
						Start as Caller
					</button>

					<button className="flex items-center gap-2 rounded bg-green-500 px-6 py-3 text-white hover:bg-green-600" onClick={handleStartAsCallee}>
						<Phone size={20} />
						Start as Callee
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

					{/* SDP Exchange - Same as before but with better styling */}
					{role === 'caller' && (
						<div className="w-full max-w-4xl space-y-4">
							<div className="rounded-lg bg-blue-50 p-4">
								<h3 className="mb-2 font-semibold text-blue-800">Step 1: Copy this offer to the other peer</h3>
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
									placeholder="Paste the answer from the callee here..."
								/>
								<button
									className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:bg-gray-400"
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
									placeholder="Paste the offer from the caller here..."
								/>
								<button
									className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:bg-gray-400"
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

			{/* Debug Info */}
			{connectionState === 'failed' && (
				<div className="mt-4 w-full max-w-4xl rounded-lg bg-red-50 p-4">
					<h3 className="mb-2 font-semibold text-red-800">Connection Failed - Troubleshooting:</h3>
					<ul className="list-inside list-disc space-y-1 text-sm text-red-700">
						<li>Both peers might be behind strict NATs/firewalls</li>
						<li>Try using a different network (mobile hotspot)</li>
						<li>Check if both devices have internet connectivity</li>
						<li>TURN servers might be overloaded - try refreshing and reconnecting</li>
						<li>For production, use your own TURN servers</li>
					</ul>
				</div>
			)}
		</div>
	);
}
