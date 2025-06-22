// src/utils/webrtc.ts

// You can tweak these or pull from env‐vars for production
export const servers: RTCConfiguration = {
	iceServers: [
		// Google STUN
		{
			urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
		},
		// Public TURN – replace with your own for production!
		{
			urls: 'turn:openrelay.metered.ca:80',
			username: 'openrelayproject',
			credential: 'openrelayproject',
		},
		{
			urls: 'turn:relay1.expressturn.com:3478',
			username: 'efJBIBF0YGZQBQRSYG',
			credential: 'ZUpTRENCREE',
		},
	],
	// How many ICE candidates to gather before emitting a "complete" event
	iceCandidatePoolSize: 5,
};
export const defaultConstraints: MediaStreamConstraints = {
	audio: true,
	video: {
		width: { ideal: 1280 },
		height: { ideal: 720 },
		frameRate: { ideal: 30 },
	},
};
