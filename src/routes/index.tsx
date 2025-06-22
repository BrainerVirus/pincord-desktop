// src/routes/index.tsx (or wherever your root route component is)
import { Button } from '@/components/ui/button'; // Assuming you have shadcn Button component
import { useWebRTCStore } from '@/store/webrtcStore'; // Import your Zustand store
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	component: App,
});

export default function App() {
	const navigate = useNavigate({ from: '/' });
	const { setCallRole } = useWebRTCStore(); // Get the setter from Zustand

	const handleRoleSelection = (role: 'caller' | 'callee') => {
		setCallRole(role); // Set the role in the Zustand store
		navigate({ to: '/calling', search: { callRole: role } }); // Navigate to the calling route with the selected role
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-100 p-4">
			<header className="flex flex-col items-center gap-3 text-center">
				<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">WebRTC Test</h1>
				<p className="text-muted-foreground text-xl">Full-featured WebRTC with device selection and permissions</p>
				<h2 className="mt-6 scroll-m-20 text-center text-2xl font-semibold tracking-tight">Select your Role</h2>
			</header>

			<div className="flex gap-4">
				<Button size="lg" onClick={() => handleRoleSelection('caller')}>
					Start as Caller
				</Button>
				<Button size="lg" variant="secondary" onClick={() => handleRoleSelection('callee')}>
					Start as Callee
				</Button>
			</div>
		</div>
	);
}
