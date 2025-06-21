import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/')({
	component: App,
});

export default function App() {
	const [showDeviceSettings, setShowDeviceSettings] = useState(false);

	return (
		<div className="flex min-h-screen flex-col items-center gap-4 bg-gray-100 p-4">
			<header className="mb-8 flex w-full max-w-6xl flex-col items-center gap-3 text-center">
				<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">WebRTC Test</h1>
				<p className="text-muted-foreground text-xl">Full-featured WebRTC with device selection and permissions</p>
				<div className="flex items-center justify-center gap-4 text-sm">
					<span className="font-medium">Connection status: </span>
					<span className="font-medium">Call Role:</span>
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
							<TooltipTrigger>
								<Button variant="ghost" size="icon" className="size-8" onClick={() => setShowDeviceSettings(!showDeviceSettings)} asChild>
									<div>
										<ChevronDown className={cn('transition-transform duration-300', showDeviceSettings ? 'rotate-180' : 'rotate-0')} />
									</div>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{showDeviceSettings ? 'Hide settings' : 'Show settings'}</p>
							</TooltipContent>
						</Tooltip>
					</CardAction>
				</CardHeader>

				<CardContent
					className={cn(
						'grid',
						'transition-[grid-template-rows,padding,opacity,margin] duration-300 ease-in-out',
						'will-change-[grid-template-rows,padding,opacity,margin]',
						!showDeviceSettings && 'grid-rows-[0fr] opacity-0',
						showDeviceSettings && 'mt-4 grid-rows-[1fr] opacity-100',
					)}
					data-state={showDeviceSettings ? 'open' : 'closed'}
				>
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
