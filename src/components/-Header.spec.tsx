import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { Component, type ErrorInfo, type ReactNode, Suspense } from 'react';
import { expect, test } from 'vitest';
import Header from './Header';

// Error boundary component for catching router-related errors
class ErrorBoundary extends Component<{ children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }> {
	state = { hasError: false, error: null as Error | null };

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Error caught by boundary:', error);
		this.props.onError?.(error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return <div data-testid="error-boundary">Error: {this.state.error?.message}</div>;
		}
		return this.props.children;
	}
}

// Create a test-specific Root Layout that includes the Header
const RootLayout = () => {
	return (
		<div>
			<Header />
			<div id="outlet"></div>
		</div>
	);
};

test('Header renders with a link to the home page', async () => {
	// Create a root route with the RootLayout
	const rootRoute = createRootRoute({
		component: RootLayout,
	});

	// Create a home route
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <div>Home Page Content</div>,
	});

	// Build the route tree
	const routeTree = rootRoute.addChildren([indexRoute]);

	// Create the router with memory history
	const memoryHistory = createMemoryHistory({
		initialEntries: ['/'],
	});

	const router = createRouter({
		routeTree,
		history: memoryHistory,
	});

	// Capture any errors that occur during rendering
	let renderError: Error | null = null;

	// Render with the RouterProvider inside an ErrorBoundary and Suspense
	render(
		<ErrorBoundary
			onError={(error) => {
				renderError = error;
			}}
		>
			<Suspense fallback={<div>Loading...</div>}>
				<RouterProvider router={router} />
			</Suspense>
		</ErrorBoundary>,
	);

	// Wait for the router to be ready
	await waitFor(
		() => {
			const container = screen.queryByText(/Loading/i);
			if (container) {
				throw new Error('Still loading');
			}
		},
		{ timeout: 2000 },
	);

	if (renderError) {
		throw renderError;
	}

	// Test that the Header link is present using role
	await waitFor(() => {
		const linkElement = screen.getByRole('link', { name: /home/i });
		expect(linkElement).toBeInTheDocument();
		expect(linkElement).toHaveAttribute('href', '/');
	});
});
