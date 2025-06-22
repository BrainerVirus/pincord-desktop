import { create } from 'zustand';

// Define the type for the call role
export type CallRole = 'caller' | 'callee' | 'none';

// Define the store's state and actions
interface WebRTCState {
	callRole: CallRole;
	connectionStatus: 'connected' | 'disconnected' | 'connecting'; // Keeping connection status here for future global use
	setCallRole: (role: CallRole) => void;
	setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
	// Add other WebRTC related states and actions here as you build out the features
}

// Create the Zustand store
export const useWebRTCStore = create<WebRTCState>((set) => ({
	callRole: 'none', // Initial role
	connectionStatus: 'disconnected', // Initial connection status
	setCallRole: (role) => set({ callRole: role }),
	setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
