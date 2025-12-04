import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface PricingPlan {
	name: string;
	description: string;
	price: string;
	period: string;
	features: string[];
	highlighted: boolean;
	buttonText: string;
	buttonVariant: "default" | "outline";
}

const plans: PricingPlan[] = [
	{
		name: "For Buyers",
		description: "SMEs and enterprises seeking cost savings",
		price: "Free",
		period: "to join",
		features: [
			"Browse and join active campaigns",
			"Access volume-based discounts",
			"Real-time campaign progress tracking",
			"Secure payment protection",
			"Order history and management",
			"Multi-user organization accounts",
		],
		highlighted: false,
		buttonText: "Join as Buyer",
		buttonVariant: "outline",
	},
	{
		name: "Success-Based",
		description: "Our aligned incentive model",
		price: "Small %",
		period: "of savings",
		features: [
			"Pay only when campaigns succeed",
			"Percentage of discount achieved",
			"No upfront platform fees",
			"No monthly subscriptions",
			"Aligned incentives for all parties",
			"Transparent fee structure",
		],
		highlighted: true,
		buttonText: "Learn More",
		buttonVariant: "default",
	},
	{
		name: "For Suppliers",
		description: "B2B sellers seeking volume orders",
		price: "Free",
		period: "to launch",
		features: [
			"Create group buying campaigns",
			"Set tiered pricing brackets",
			"Consolidated purchase orders",
			"Predictable sales pipeline",
			"Verified buyer organizations",
			"Streamlined fulfillment",
		],
		highlighted: false,
		buttonText: "Launch Campaign",
		buttonVariant: "outline",
	},
];

function Pricing(): ReactNode {
	return (
		<section
			id="pricing"
			className="py-24 sm:py-32 bg-muted/30"
			aria-labelledby="pricing-heading"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2
						id="pricing-heading"
						className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
					>
						Aligned Incentives, Zero Risk
					</h2>
					<p className="text-lg text-muted-foreground">
						Free to join, free to launch. We only succeed when you save.
						Our platform fee is a small percentage of the discounts achieved.
					</p>
				</div>

				{/* Pricing Cards */}
				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6"
					role="list"
					aria-label="Pricing plans"
				>
					{plans.map((plan, index) => (
						<Card
							key={plan.name}
							className={cn(
								"relative flex flex-col transition-all duration-300 hover:shadow-xl",
								plan.highlighted
									? "border-primary shadow-lg scale-[1.02] md:scale-105 bg-card"
									: "bg-card/50 hover:-translate-y-1"
							)}
							role="listitem"
							style={{ animationDelay: `${index * 0.1}s` }}
						>
							{plan.highlighted && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2">
									<Badge variant="default" className="px-3 py-1">
										Most Popular
									</Badge>
								</div>
							)}

							<CardHeader className="text-center pb-2">
								<CardTitle className="text-xl">{plan.name}</CardTitle>
								<CardDescription>{plan.description}</CardDescription>
							</CardHeader>

							<CardContent className="flex-1">
								{/* Price */}
								<div className="text-center mb-6">
									<span className="text-4xl font-bold text-foreground">
										{plan.price}
									</span>
									{plan.period && (
										<span className="text-muted-foreground">{plan.period}</span>
									)}
								</div>

								{/* Features */}
								<ul className="space-y-3" role="list" aria-label={`${plan.name} features`}>
									{plan.features.map((feature) => (
										<li
											key={feature}
											className="flex items-start gap-3"
										>
											<Check
												className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
												aria-hidden="true"
											/>
											<span className="text-sm text-muted-foreground">
												{feature}
											</span>
										</li>
									))}
								</ul>
							</CardContent>

							<CardFooter>
								<Button
									variant={plan.buttonVariant}
									className="w-full"
									size="lg"
								>
									{plan.buttonText}
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export { Pricing };
