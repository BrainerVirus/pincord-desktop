import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type CallRole } from '@/store/webrtcStore';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

type CallingSeach = {
	callRole: CallRole;
};

export const Route = createFileRoute('/calling')({
	validateSearch: (search: Record<string, unknown>): CallingSeach => ({
		callRole: (search.callRole as CallRole) || 'none',
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const [showDeviceSettings, setShowDeviceSettings] = useState(false);
	// New state for connection status and call role
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
	const { callRole } = Route.useSearch();
	return (
		<div className="flex min-h-screen flex-col items-center gap-4 bg-gray-100 p-4">
			<header className="mb-8 flex w-full max-w-6xl flex-col items-center gap-3 text-center">
				<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">WebRTC Test</h1>
				<p className="text-muted-foreground text-xl">Full-featured WebRTC with device selection and permissions</p>
				{/* Connection Status and Call Role display */}
				<div className="flex items-center justify-center gap-4 text-sm">
					<span className="font-medium">Connection status: </span>
					<span
						className={cn('font-medium', {
							'text-green-600': connectionStatus === 'connected', // Green for connected
							'text-red-600': connectionStatus === 'disconnected', // Red for disconnected
							'text-yellow-600': connectionStatus === 'connecting', // Yellow for connecting
						})}
					>
						{connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'disconnected' ? 'Disconnected' : 'Connecting...'}
					</span>
					<span className="font-medium">Call Role:</span>
					<span className="font-medium text-blue-500">{callRole.charAt(0).toUpperCase() + callRole.slice(1)}</span>
				</div>
			</header>

			{/* Calling */}
			<Card className="w-full max-w-6xl">
				<CardContent>
					<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
						<div className="col-span-1 flex flex-col gap-4 sm:col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2">
							<h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">You</h2>
							<AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
								<img
									src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
									alt="A scenic view captured by Drew Beamer"
									className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
								/>
							</AspectRatio>
						</div>
						<div className="col-span-1 flex flex-col gap-4 sm:col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2">
							<h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">Callee</h2>
							<AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
								<img
									src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
									alt="A scenic view captured by Drew Beamer"
									className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
								/>
							</AspectRatio>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Device Settings */}
			<Card className="block w-full max-w-6xl">
				<CardHeader>
					<CardTitle>Device Settings</CardTitle>
					<CardDescription>Select your devices for the call</CardDescription>
					<CardAction>
						<Tooltip>
							<TooltipTrigger asChild>
								{/* asChild is on TooltipTrigger, not Button, allowing Button to render its native <button> element */}
								<Button variant="ghost" size="icon" className="size-8" onClick={() => setShowDeviceSettings(!showDeviceSettings)}>
									{/* ChevronDown icon with conditional rotation */}
									<ChevronDown
										className={cn(
											'transition-transform duration-300', // Smooth transition for rotation
											showDeviceSettings ? 'rotate-180' : 'rotate-0', // Apply rotation based on state
										)}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{/* Dynamic Tooltip content */}
								<p>{showDeviceSettings ? 'Hide settings' : 'Show settings'}</p>
							</TooltipContent>
						</Tooltip>
					</CardAction>
				</CardHeader>

				<CardContent
					className={cn(
						'grid', // Crucial: This makes CardContent a CSS Grid container
						// Explicitly transition grid-template-rows, padding, opacity, and margin
						'transition-[grid-template-rows,padding,opacity,margin] duration-300 ease-in-out',
						'will-change-[grid-template-rows,padding,opacity,margin]', // Optimization hint

						// When showDeviceSettings is FALSE (closed state)
						// Collapse height to 0fr, fade out, remove padding and margin
						!showDeviceSettings && '!mt-0 grid-rows-[0fr] !p-0 !pt-0 opacity-0',
						// When showDeviceSettings is TRUE (open state)
						// Expand to content height (1fr), fade in, add top margin, and restore padding (if default p-6 pt-0 is implied)
						showDeviceSettings && 'mt-4 grid-rows-[1fr] p-6 pt-0 opacity-100', // Added p-6 pt-0 for explicit padding when open
					)}
					data-state={showDeviceSettings ? 'open' : 'closed'}
				>
					{/* The direct child of the grid container (CardContent) must have overflow-hidden.
                          This div contains all the actual content being animated. */}
					<div className="flex items-center gap-4 overflow-hidden">
						<div className="flex flex-col items-start gap-2">
							<label htmlFor="camera-select" className="text-sm font-medium">
								Camera:
							</label>
							<Select>
								<SelectTrigger id="camera-select" className="w-[180px]">
									<SelectValue placeholder="Default" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="light">Camera 1</SelectItem>
									<SelectItem value="system">Camera 2</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col items-start gap-2">
							<label className="text-sm font-medium" htmlFor="microphone-select">
								Microphone:
							</label>
							<Select>
								<SelectTrigger id="microphone-select" className="w-[180px]">
									<SelectValue placeholder="Default" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="light">Microphone 1</SelectItem>
									<SelectItem value="system">Microphone 2</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col items-start gap-2">
							<label className="text-sm font-medium" htmlFor="speaker-select">
								Speaker:
							</label>
							<Select>
								<SelectTrigger id="microphone-select" className="w-[180px]">
									<SelectValue placeholder="Default" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="light">Speaker 1</SelectItem>
									<SelectItem value="system">Speaker 2</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Permissions Status */}
			{/* Instructions */}
			{/* Role Selection / Connection Controls */}
		</div>
	);
}
