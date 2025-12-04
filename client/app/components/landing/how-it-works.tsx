import type { ReactNode } from "react";

interface Step {
	number: string;
	title: string;
	description: string;
}

const steps: Step[] = [
	{
		number: "01",
		title: "Suppliers Launch Campaigns",
		description:
			"Suppliers create group buying campaigns with tiered pricing. The more organizations join, the bigger the discount for everyone.",
	},
	{
		number: "02",
		title: "Buyers Join and Pledge",
		description:
			"Browse active campaigns and commit to the quantities your organization needs. Watch real-time progress toward volume targets.",
	},
	{
		number: "03",
		title: "Target Met, Campaign Locks",
		description:
			"When the target quantity is reached, the campaign locks in the best price tier. All participants get the volume discount.",
	},
	{
		number: "04",
		title: "Fulfillment Within 60 Days",
		description:
			"Orders are processed and fulfilled within 60 days. Secure payments are collected only after campaign success.",
	},
];

function HowItWorks(): ReactNode {
	return (
		<section
			id="how-it-works"
			className="py-24 sm:py-32"
			aria-labelledby="how-it-works-heading"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2
						id="how-it-works-heading"
						className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
					>
						How Group Buying Works
					</h2>
					<p className="text-lg text-muted-foreground">
						A simple, transparent process that delivers volume discounts
						to businesses of all sizes through collective purchasing power.
					</p>
				</div>

				{/* Steps */}
				<div className="relative">
					{/* Connection line - visible on desktop */}
					<div
						className="hidden lg:block absolute top-24 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-border"
						aria-hidden="true"
					/>

					<ol
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4"
						aria-label="Steps to get started"
					>
						{steps.map((step, index) => (
							<li
								key={step.number}
								className="relative group"
								style={{ animationDelay: `${index * 0.15}s` }}
							>
								<div className="flex flex-col items-center text-center">
									{/* Step Number */}
									<div
										className="relative z-10 mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-background border-2 border-primary text-primary font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
										aria-hidden="true"
									>
										{step.number}
									</div>

									{/* Step Content */}
									<h3 className="text-xl font-semibold text-foreground mb-3">
										{step.title}
									</h3>
									<p className="text-muted-foreground leading-relaxed">
										{step.description}
									</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</div>
		</section>
	);
}

export { HowItWorks };
