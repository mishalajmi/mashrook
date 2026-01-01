import type { ReactNode } from "react";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
} from "react-router";

import indexStylesHref from "./index.css?url";
import "./i18n";
import { LanguageProvider } from "@/i18n/language-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui";
import LoginPage from "@/routes/login";

interface LayoutProps {
	children: ReactNode;
}

// The Layout component is a special export for the root route.
// It acts as your document's "app shell" for all route components, HydrateFallback, and ErrorBoundary
// For more information, see https://reactrouter.com/explanation/special-files#layout-export
export function Layout({ children }: LayoutProps): ReactNode {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* Favicon */}
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				<link rel="manifest" href="/site.webmanifest" />
				<meta name="theme-color" content="#0F766E" />
				<Meta />
				<Links />
				<link rel="stylesheet" href={indexStylesHref} />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

interface ErrorBoundaryProps {
	error: unknown;
}

// The top most error boundary for the app, rendered when your app throws an error
// For more information, see https://reactrouter.com/start/framework/route-module#errorboundary
export function ErrorBoundary({ error }: ErrorBoundaryProps): ReactNode {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main id="error-page">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre>
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}

export function HydrateFallback(): ReactNode {
	return (
		<div id="loading-splash">
			<div id="loading-splash-spinner" />
			<p>Loading, please wait...</p>
		</div>
	);
}

export default function App(): ReactNode {
	return (
		<LanguageProvider>
			<AuthProvider>
				<Outlet />
				<Toaster />
			</AuthProvider>
		</LanguageProvider>
	);
}
