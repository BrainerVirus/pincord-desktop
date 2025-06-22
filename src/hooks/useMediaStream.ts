import { useCallback, useEffect, useRef, useState } from 'react';

interface UseMediaStreamOptions {
	video?: boolean | MediaTrackConstraints;
	audio?: boolean | MediaTrackConstraints;
	onStreamReady?: (stream: MediaStream) => void;
	onError?: (error: Error) => void;
}

interface MediaStreamState {
	stream: MediaStream | null;
	isLoading: boolean;
	error: string | null;
	devices: {
		videoInputs: MediaDeviceInfo[];
		audioInputs: MediaDeviceInfo[];
		audioOutputs: MediaDeviceInfo[];
	};
	permissions: {
		camera: PermissionState | null;
		microphone: PermissionState | null;
	};
}

export const useMediaStream = (options: UseMediaStreamOptions = {}) => {
	const [state, setState] = useState<MediaStreamState>({
		stream: null,
		isLoading: false,
		error: null,
		devices: {
			videoInputs: [],
			audioInputs: [],
			audioOutputs: [],
		},
		permissions: {
			camera: null,
			microphone: null,
		},
	});

	const streamRef = useRef<MediaStream | null>(null);
	const constraintsRef = useRef<MediaStreamConstraints>({
		video: options.video ?? true,
		audio: options.audio ?? true,
	});

	// Update constraints when options change
	useEffect(() => {
		constraintsRef.current = {
			video: options.video ?? true,
			audio: options.audio ?? true,
		};
	}, [options.video, options.audio]);

	// Get available media devices
	const getDevices = useCallback(async () => {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();

			setState((prevState) => ({
				...prevState,
				devices: {
					videoInputs: devices.filter((device) => device.kind === 'videoinput'),
					audioInputs: devices.filter((device) => device.kind === 'audioinput'),
					audioOutputs: devices.filter((device) => device.kind === 'audiooutput'),
				},
			}));

			return devices;
		} catch (error) {
			console.error('Error enumerating devices:', error);
			return [];
		}
	}, []);

	// Check permissions
	const checkPermissions = useCallback(async () => {
		try {
			const [cameraPermission, microphonePermission] = await Promise.all([
				navigator.permissions.query({ name: 'camera' as PermissionName }),
				navigator.permissions.query({ name: 'microphone' as PermissionName }),
			]);

			setState((prevState) => ({
				...prevState,
				permissions: {
					camera: cameraPermission.state,
					microphone: microphonePermission.state,
				},
			}));
		} catch (error) {
			console.error('Error checking permissions:', error);
		}
	}, []);

	// Start media stream
	const startStream = useCallback(
		async (constraints?: MediaStreamConstraints) => {
			setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

			try {
				const streamConstraints = constraints || constraintsRef.current;
				const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);

				streamRef.current = stream;
				setState((prevState) => ({
					...prevState,
					stream,
					isLoading: false,
					error: null,
				}));

				options.onStreamReady?.(stream);
				await getDevices();
				await checkPermissions();

				return stream;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				setState((prevState) => ({
					...prevState,
					isLoading: false,
					error: errorMessage,
				}));

				options.onError?.(error as Error);
				throw error;
			}
		},
		[options, getDevices, checkPermissions],
	);

	// Stop media stream
	const stopStream = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => {
				track.stop();
			});
			streamRef.current = null;
			setState((prevState) => ({
				...prevState,
				stream: null,
				error: null,
			}));
		}
	}, []);

	// Toggle video track
	const toggleVideo = useCallback((enabled?: boolean) => {
		if (streamRef.current) {
			const videoTracks = streamRef.current.getVideoTracks();
			videoTracks.forEach((track) => {
				track.enabled = enabled !== undefined ? enabled : !track.enabled;
			});
			return videoTracks.length > 0 ? videoTracks[0].enabled : false;
		}
		return false;
	}, []);

	// Toggle audio track
	const toggleAudio = useCallback((enabled?: boolean) => {
		if (streamRef.current) {
			const audioTracks = streamRef.current.getAudioTracks();
			audioTracks.forEach((track) => {
				track.enabled = enabled !== undefined ? enabled : !track.enabled;
			});
			return audioTracks.length > 0 ? audioTracks[0].enabled : false;
		}
		return false;
	}, []);

	// Switch camera (front/back)
	const switchCamera = useCallback(async () => {
		if (!streamRef.current) return;

		const videoTrack = streamRef.current.getVideoTracks()[0];
		if (!videoTrack) return;

		try {
			const currentConstraints = videoTrack.getConstraints();
			const currentFacingMode = currentConstraints.facingMode;

			const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

			await stopStream();
			await startStream({
				...constraintsRef.current,
				video: {
					...(typeof constraintsRef.current.video === 'object' ? constraintsRef.current.video : {}),
					facingMode: newFacingMode,
				},
			});
		} catch (error) {
			console.error('Error switching camera:', error);
			// Fallback: restart with original constraints
			await startStream(constraintsRef.current);
		}
	}, [startStream, stopStream]);

	// Switch to specific device
	const switchToDevice = useCallback(
		async (deviceId: string, kind: 'videoinput' | 'audioinput') => {
			try {
				const newConstraints = { ...constraintsRef.current };

				if (kind === 'videoinput' && newConstraints.video) {
					newConstraints.video = {
						...(typeof newConstraints.video === 'object' ? newConstraints.video : {}),
						deviceId: { exact: deviceId },
					};
				} else if (kind === 'audioinput' && newConstraints.audio) {
					newConstraints.audio = {
						...(typeof newConstraints.audio === 'object' ? newConstraints.audio : {}),
						deviceId: { exact: deviceId },
					};
				}

				await stopStream();
				await startStream(newConstraints);
			} catch (error) {
				console.error('Error switching device:', error);
				throw error;
			}
		},
		[startStream, stopStream],
	);

	// Get current track states
	const getTrackStates = useCallback(() => {
		if (!streamRef.current) {
			return { video: false, audio: false };
		}

		const videoTracks = streamRef.current.getVideoTracks();
		const audioTracks = streamRef.current.getAudioTracks();

		return {
			video: videoTracks.length > 0 ? videoTracks[0].enabled : false,
			audio: audioTracks.length > 0 ? audioTracks[0].enabled : false,
		};
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopStream();
		};
	}, [stopStream]);

	// Initialize devices and permissions on mount
	useEffect(() => {
		getDevices();
		checkPermissions();
	}, [getDevices, checkPermissions]);

	return {
		...state,
		startStream,
		stopStream,
		toggleVideo,
		toggleAudio,
		switchCamera,
		switchToDevice,
		getTrackStates,
		getDevices,
		checkPermissions,
		isVideoEnabled: getTrackStates().video,
		isAudioEnabled: getTrackStates().audio,
	};
};

// Example usage of the useMediaStream hook in a React component
// import React, { useRef, useEffect } from 'react';
// import { useMediaStream } from './useMediaStream';

// const MediaStreamComponent: React.FC = () => {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   const {
//     stream,
//     isLoading,
//     error,
//     devices,
//     permissions,
//     startStream,
//     stopStream,
//     toggleVideo,
//     toggleAudio,
//     switchCamera,
//     switchToDevice,
//     isVideoEnabled,
//     isAudioEnabled,
//   } = useMediaStream({
//     video: { width: 1280, height: 720 },
//     audio: true,
//     onStreamReady: (stream) => {
//       console.log('Stream ready:', stream);
//     },
//     onError: (error) => {
//       console.error('Stream error:', error);
//     },
//   });

//   // Set stream to video element
//   useEffect(() => {
//     if (videoRef.current && stream) {
//       videoRef.current.srcObject = stream;
//     }
//   }, [stream]);

//   return (
//     <div>
//       <div>
//         <video
//           ref={videoRef}
//           autoPlay
//           muted
//           style={{ width: 400, height: 300 }}
//         />
//       </div>

//       {error && <div style={{ color: 'red' }}>Error: {error}</div>}

//       <div>
//         <button onClick={() => startStream()} disabled={isLoading}>
//           {isLoading ? 'Starting...' : 'Start Stream'}
//         </button>
//         <button onClick={stopStream}>Stop Stream</button>
//         <button onClick={() => toggleVideo()}>
//           {isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
//         </button>
//         <button onClick={() => toggleAudio()}>
//           {isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
//         </button>
//         <button onClick={switchCamera}>Switch Camera</button>
//       </div>

//       <div>
//         <h3>Cameras:</h3>
//         {devices.videoInputs.map(device => (
//           <button
//             key={device.deviceId}
//             onClick={() => switchToDevice(device.deviceId, 'videoinput')}
//           >
//             {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
//           </button>
//         ))}
//       </div>

//       <div>
//         <h3>Microphones:</h3>
//         {devices.audioInputs.map(device => (
//           <button
//             key={device.deviceId}
//             onClick={() => switchToDevice(device.deviceId, 'audioinput')}
//           >
//             {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
//           </button>
//         ))}
//       </div>

//       <div>
//         <p>Camera Permission: {permissions.camera}</p>
//         <p>Microphone Permission: {permissions.microphone}</p>
//       </div>
//     </div>
//   );
// };

// export default MediaStreamComponent;
