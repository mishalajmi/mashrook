import type { ReactNode } from "react";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

function Hero(): ReactNode {
	return (
		<section
			className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
			aria-labelledby="hero-heading"
		>
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float animate-breathe" />
				<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-float animate-breathe" style={{ animationDelay: "2s" }} />
			</div>

			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
				<div className="text-center">
					{/* Announcement Badge */}
					<div className="animate-fade-in-down">
						<Badge variant="outline" className="mb-6 px-4 py-1.5">
							<span className="mr-2 inline-block w-2 h-2 rounded-full bg-primary animate-pulse-subtle" aria-hidden="true" />
							First-of-its-kind B2B Group Buy Platform
						</Badge>
					</div>

					{/* Main Heading */}
					<h1
						id="hero-heading"
						className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6"
						style={{ animationDelay: "0.1s" }}
					>
						Unlock Enterprise Pricing
						<br />
						<span className="text-primary">Through Group Buying Power</span>
					</h1>

					{/* Subheading */}
					<p
						className="animate-fade-in-up mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10"
						style={{ animationDelay: "0.2s" }}
					>
						The B2B procurement platform that aggregates purchase orders to deliver
						volume discounts to businesses of all sizes. Save 20-40% on every order.
					</p>

					{/* CTA Buttons */}
					<div
						className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4"
						style={{ animationDelay: "0.3s" }}
					>
						<Button size="xl" className="group">
							Join Campaigns and Save
							<ArrowRight
								className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
								aria-hidden="true"
							/>
						</Button>
						<Button variant="outline" size="xl" className="group">
							<Play
								className="mr-2 h-5 w-5"
								aria-hidden="true"
							/>
							See How It Works
						</Button>
					</div>

					{/* Value Props */}
					<div
						className="animate-fade-in-up mt-12 pt-8 border-t border-border/50"
						style={{ animationDelay: "0.4s" }}
					>
						<p className="text-sm text-muted-foreground mb-4">
							Trusted by SMEs and enterprises across industries
						</p>
						<div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
							{[
								{ value: "20-40%", label: "Average Savings" },
								{ value: "60 Days", label: "Fulfillment Guarantee" },
								{ value: "100%", label: "Payment Security" },
							].map((stat) => (
								<div key={stat.label} className="text-center">
									<span className="block text-2xl sm:text-3xl font-bold text-primary">
										{stat.value}
									</span>
									<span className="text-sm text-muted-foreground">
										{stat.label}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export { Hero };
