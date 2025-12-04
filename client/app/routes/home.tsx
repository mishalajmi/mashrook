import type { ReactNode } from "react";
import type { MetaDescriptor } from "react-router";

export function meta(): MetaDescriptor[] {
	return [
		{ title: "Mashrook" },
		{ name: "description", content: "Welcome to Mashrook" },
	];
}

export default function Home(): ReactNode {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">Mashrook</h1>
				<p className="text-gray-600">Your application is ready.</p>
			</div>
		</div>
	);
}
