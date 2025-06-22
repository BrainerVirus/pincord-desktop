/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';

interface MediaDevice extends MediaDeviceInfo {
	isDefault?: boolean;
}

interface ScreenSource {
	id: string;
	name: string;
	type: 'screen' | 'window' | 'tab';
	thumbnail?: string;
}

interface DeviceState {
	videoInputs: MediaDevice[];
	audioInputs: MediaDevice[];
	audioOutputs: MediaDevice[];
	screenSources: ScreenSource[];
	isLoading: boolean;
	error: string | null;
	permissions: {
		camera: PermissionState | null;
		microphone: PermissionState | null;
		displayCapture: boolean;
	};
	capabilities: {
		hasGetUserMedia: boolean;
		hasGetDisplayMedia: boolean;
		hasEnumerateDevices: boolean;
	};
}

interface UseDevicesOptions {
	autoRefresh?: boolean;
	includeScreenCapture?: boolean;
	onDeviceChange?: (devices: MediaDeviceInfo[]) => void;
	onPermissionChange?: (permissions: DeviceState['permissions']) => void;
	onScreenSourcesChange?: (sources: ScreenSource[]) => void;
}

interface ScreenCaptureOptions {
	video?: boolean | MediaTrackConstraints;
	audio?: boolean | MediaTrackConstraints;
	preferCurrentTab?: boolean;
	systemAudio?: boolean;
}

export const useDevices = (options: UseDevicesOptions = {}) => {
	const [state, setState] = useState<DeviceState>({
		videoInputs: [],
		audioInputs: [],
		audioOutputs: [],
		screenSources: [],
		isLoading: true,
		error: null,
		permissions: {
			camera: null,
			microphone: null,
			displayCapture: false,
		},
		capabilities: {
			hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
			hasGetDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
			hasEnumerateDevices: !!navigator.mediaDevices?.enumerateDevices,
		},
	});

	const deviceChangeListenerRef = useRef<(() => void) | null>(null);
	const permissionWatchersRef = useRef<{
		camera?: PermissionStatus;
		microphone?: PermissionStatus;
	}>({});

	const { autoRefresh = true, includeScreenCapture = true, onDeviceChange, onPermissionChange, onScreenSourcesChange } = options;

	// Get device label safely
	const getDeviceLabel = useCallback((device: MediaDeviceInfo, index: number): string => {
		if (device.label) return device.label;

		switch (device.kind) {
			case 'videoinput':
				return `Camera ${index + 1}`;
			case 'audioinput':
				return `Microphone ${index + 1}`;
			case 'audiooutput':
				return `Speaker ${index + 1}`;
			default:
				return `Device ${index + 1}`;
		}
	}, []);

	// Check if device is default
	const isDefaultDevice = useCallback((device: MediaDeviceInfo): boolean => {
		return device.deviceId === 'default' || device.deviceId === 'communications';
	}, []);

	// Process regular media devices
	const processDevices = useCallback(
		(devices: MediaDeviceInfo[]): Omit<DeviceState, 'isLoading' | 'error' | 'permissions' | 'screenSources' | 'capabilities'> => {
			const videoInputs: MediaDevice[] = [];
			const audioInputs: MediaDevice[] = [];
			const audioOutputs: MediaDevice[] = [];

			devices.forEach((device, index) => {
				const processedDevice: MediaDevice = {
					...device,
					label: getDeviceLabel(device, index),
					isDefault: isDefaultDevice(device),
				};

				switch (device.kind) {
					case 'videoinput':
						videoInputs.push(processedDevice);
						break;
					case 'audioinput':
						audioInputs.push(processedDevice);
						break;
					case 'audiooutput':
						audioOutputs.push(processedDevice);
						break;
				}
			});

			// Sort devices (default first, then by label)
			const sortDevices = (devices: MediaDevice[]) =>
				devices.sort((a, b) => {
					if (a.isDefault && !b.isDefault) return -1;
					if (!a.isDefault && b.isDefault) return 1;
					return a.label.localeCompare(b.label);
				});

			return {
				videoInputs: sortDevices(videoInputs),
				audioInputs: sortDevices(audioInputs),
				audioOutputs: sortDevices(audioOutputs),
			};
		},
		[getDeviceLabel, isDefaultDevice],
	);

	// Get screen sources (for Electron apps)
	const getScreenSources = useCallback(async (): Promise<ScreenSource[]> => {
		if (!includeScreenCapture) return [];

		try {
			// Check if we're in Electron environment
			if (typeof window !== 'undefined' && (window as any).electronAPI?.getScreenSources) {
				const sources = await (window as any).electronAPI.getScreenSources();
				const screenSources: ScreenSource[] = sources.map((source: any) => ({
					id: source.id,
					name: source.name,
					type: source.id.startsWith('screen:') ? 'screen' : 'window',
					thumbnail: source.thumbnail,
				}));

				setState((prev) => ({ ...prev, screenSources }));
				onScreenSourcesChange?.(screenSources);
				return screenSources;
			}

			// For web browsers, we can't enumerate screen sources
			// but we can provide generic options
			const webScreenSources: ScreenSource[] = [
				{ id: 'screen', name: 'Entire Screen', type: 'screen' },
				{ id: 'window', name: 'Application Window', type: 'window' },
				{ id: 'tab', name: 'Browser Tab', type: 'tab' },
			];

			setState((prev) => ({ ...prev, screenSources: webScreenSources }));
			onScreenSourcesChange?.(webScreenSources);
			return webScreenSources;
		} catch (error) {
			console.error('Error getting screen sources:', error);
			return [];
		}
	}, [includeScreenCapture, onScreenSourcesChange]);

	// Get all available devices
	const getDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
		if (!state.capabilities.hasEnumerateDevices) {
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: 'Device enumeration not supported',
			}));
			return [];
		}

		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const [devices, screenSources] = await Promise.all([navigator.mediaDevices.enumerateDevices(), getScreenSources()]);

			const processedDevices = processDevices(devices);

			setState((prev) => ({
				...prev,
				...processedDevices,
				screenSources,
				isLoading: false,
				error: null,
			}));

			onDeviceChange?.(devices);
			return devices;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to enumerate devices';
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: errorMessage,
			}));
			throw error;
		}
	}, [state.capabilities.hasEnumerateDevices, processDevices, getScreenSources, onDeviceChange]);

	// Check media permissions
	const checkPermissions = useCallback(async () => {
		try {
			const permissionChecks = [];

			if ('permissions' in navigator) {
				permissionChecks.push(
					navigator.permissions.query({ name: 'camera' as PermissionName }),
					navigator.permissions.query({ name: 'microphone' as PermissionName }),
				);
			}

			const results = await Promise.allSettled(permissionChecks);

			let cameraPermission: PermissionState | null = null;
			let microphonePermission: PermissionState | null = null;

			if (results[0]?.status === 'fulfilled') {
				cameraPermission = (results[0].value as PermissionStatus).state;
				permissionWatchersRef.current.camera = results[0].value as PermissionStatus;

				(results[0].value as PermissionStatus).onchange = () => {
					setState((prev) => ({
						...prev,
						permissions: {
							...prev.permissions,
							camera: results[0]?.status === 'fulfilled' ? (results[0].value as PermissionStatus).state : null,
						},
					}));
				};
			}

			if (results[1]?.status === 'fulfilled') {
				microphonePermission = (results[1].value as PermissionStatus).state;
				permissionWatchersRef.current.microphone = results[1].value as PermissionStatus;

				(results[1].value as PermissionStatus).onchange = () => {
					setState((prev) => ({
						...prev,
						permissions: {
							...prev.permissions,
							microphone: results[1]?.status === 'fulfilled' ? (results[1].value as PermissionStatus).state : null,
						},
					}));
				};
			}

			// Test display capture capability
			let displayCapture = false;
			if (state.capabilities.hasGetDisplayMedia) {
				try {
					// We can't actually test without user interaction,
					// so we just check if the API exists
					displayCapture = true;
				} catch (error) {
					displayCapture = false;
				}
			}

			const permissions = {
				camera: cameraPermission,
				microphone: microphonePermission,
				displayCapture,
			};

			setState((prev) => ({ ...prev, permissions }));
			onPermissionChange?.(permissions);
			return permissions;
		} catch (error) {
			console.error('Error checking permissions:', error);
			return null;
		}
	}, [state.capabilities.hasGetDisplayMedia, onPermissionChange]);

	// Request media permissions
	const requestPermissions = useCallback(
		async (
			options: {
				video?: boolean;
				audio?: boolean;
			} = { video: true, audio: true },
		) => {
			if (!state.capabilities.hasGetUserMedia) {
				throw new Error('getUserMedia not supported');
			}

			try {
				const constraints: MediaStreamConstraints = {};
				if (options.video) constraints.video = true;
				if (options.audio) constraints.audio = true;

				const stream = await navigator.mediaDevices.getUserMedia(constraints);

				// Stop all tracks immediately as we only needed permission
				stream.getTracks().forEach((track) => track.stop());

				// Refresh devices and permissions
				await Promise.all([getDevices(), checkPermissions()]);

				return true;
			} catch (error) {
				console.error('Error requesting permissions:', error);
				throw error;
			}
		},
		[state.capabilities.hasGetUserMedia, getDevices, checkPermissions],
	);

	// Start screen capture
	const startScreenCapture = useCallback(
		async (sourceId?: string, options: ScreenCaptureOptions = {}): Promise<MediaStream> => {
			if (!state.capabilities.hasGetDisplayMedia) {
				throw new Error('Screen capture not supported');
			}

			try {
				const constraints: MediaStreamConstraints = {
					video: options.video !== false ? options.video || true : false,
					audio: options.audio !== false ? options.audio || true : false,
				};

				// For Electron apps with source selection
				if (sourceId && typeof window !== 'undefined' && (window as any).electronAPI) {
					(constraints.video as any) = {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: sourceId,
						},
					};
				}

				// Web API options
				if (typeof constraints.video === 'object' && constraints.video) {
					Object.assign(constraints.video, {
						cursor: 'always',
						displaySurface: sourceId === 'screen' ? 'monitor' : sourceId === 'window' ? 'window' : sourceId === 'tab' ? 'browser' : undefined,
					});
				}

				if (options.systemAudio && typeof constraints.audio === 'object' && constraints.audio) {
					Object.assign(constraints.audio, {
						systemAudio: 'include',
					});
				}

				const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

				// Update display capture permission status
				setState((prev) => ({
					...prev,
					permissions: {
						...prev.permissions,
						displayCapture: true,
					},
				}));

				return stream;
			} catch (error) {
				console.error('Error starting screen capture:', error);
				throw error;
			}
		},
		[state.capabilities.hasGetDisplayMedia],
	);

	// Get device by ID
	const getDeviceById = useCallback(
		(deviceId: string): MediaDevice | null => {
			const allDevices = [...state.videoInputs, ...state.audioInputs, ...state.audioOutputs];
			return allDevices.find((device) => device.deviceId === deviceId) || null;
		},
		[state.videoInputs, state.audioInputs, state.audioOutputs],
	);

	// Get devices by kind
	const getDevicesByKind = useCallback(
		(kind: MediaDeviceKind): MediaDevice[] => {
			switch (kind) {
				case 'videoinput':
					return state.videoInputs;
				case 'audioinput':
					return state.audioInputs;
				case 'audiooutput':
					return state.audioOutputs;
				default:
					return [];
			}
		},
		[state.videoInputs, state.audioInputs, state.audioOutputs],
	);

	// Get default device for a kind
	const getDefaultDevice = useCallback(
		(kind: MediaDeviceKind): MediaDevice | null => {
			const devices = getDevicesByKind(kind);
			return devices.find((device) => device.isDefault) || devices[0] || null;
		},
		[getDevicesByKind],
	);

	// Get screen source by ID
	const getScreenSourceById = useCallback(
		(sourceId: string): ScreenSource | null => {
			return state.screenSources.find((source) => source.id === sourceId) || null;
		},
		[state.screenSources],
	);

	// Check if devices are available
	const hasDevices = useCallback(
		(kind?: MediaDeviceKind | 'screen'): boolean => {
			if (kind === 'screen') {
				return state.screenSources.length > 0;
			}
			if (!kind) {
				return state.videoInputs.length > 0 || state.audioInputs.length > 0;
			}
			return getDevicesByKind(kind).length > 0;
		},
		[state.videoInputs.length, state.audioInputs.length, state.screenSources.length, getDevicesByKind],
	);

	// Set up device change listener
	useEffect(() => {
		if (!autoRefresh || !state.capabilities.hasEnumerateDevices) return;

		const handleDeviceChange = () => {
			getDevices();
		};

		deviceChangeListenerRef.current = handleDeviceChange;
		navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

		return () => {
			if (deviceChangeListenerRef.current) {
				navigator.mediaDevices.removeEventListener('devicechange', deviceChangeListenerRef.current);
			}
		};
	}, [autoRefresh, state.capabilities.hasEnumerateDevices, getDevices]);

	// Initial load
	useEffect(() => {
		const initialize = async () => {
			await Promise.all([getDevices(), checkPermissions()]);
		};

		initialize();
	}, [getDevices, checkPermissions]);

	// Cleanup permission watchers
	useEffect(() => {
		return () => {
			if (permissionWatchersRef.current.camera) {
				permissionWatchersRef.current.camera.onchange = null;
			}
			if (permissionWatchersRef.current.microphone) {
				permissionWatchersRef.current.microphone.onchange = null;
			}
		};
	}, []);

	return {
		// State
		...state,

		// Actions
		getDevices,
		checkPermissions,
		requestPermissions,
		startScreenCapture,
		getScreenSources,

		// Helpers
		getDeviceById,
		getDevicesByKind,
		getDefaultDevice,
		getScreenSourceById,
		hasDevices,

		// Computed values
		totalDevices: state.videoInputs.length + state.audioInputs.length + state.audioOutputs.length,
		hasCamera: state.videoInputs.length > 0,
		hasMicrophone: state.audioInputs.length > 0,
		hasSpeakers: state.audioOutputs.length > 0,
		hasScreenCapture: state.capabilities.hasGetDisplayMedia,
		canAccessCamera: state.permissions.camera === 'granted',
		canAccessMicrophone: state.permissions.microphone === 'granted',
		canCaptureScreen: state.permissions.displayCapture,
		needsPermission: state.permissions.camera === 'prompt' || state.permissions.microphone === 'prompt',
	};
};
