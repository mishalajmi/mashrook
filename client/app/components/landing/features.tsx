import type { ReactNode } from "react";
import {
	TrendingDown,
	Shield,
	BarChart3,
	Users,
	Clock,
	BadgeCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";

interface Feature {
	icon: ReactNode;
	title: string;
	description: string;
}

const features: Feature[] = [
	{
		icon: <TrendingDown className="h-6 w-6" aria-hidden="true" />,
		title: "Volume Discounts",
		description:
			"Access enterprise-level pricing through collective buying power. Save 20-40% on purchases that would otherwise be out of reach.",
	},
	{
		icon: <Shield className="h-6 w-6" aria-hidden="true" />,
		title: "Secure Payments",
		description:
			"Payment intents protect all parties. Funds are only charged when campaigns successfully complete their targets.",
	},
	{
		icon: <BarChart3 className="h-6 w-6" aria-hidden="true" />,
		title: "Transparent Pricing",
		description:
			"See exactly how volume affects pricing with tiered price brackets. Know your discount before you commit.",
	},
	{
		icon: <Users className="h-6 w-6" aria-hidden="true" />,
		title: "Aggregate Purchase Orders",
		description:
			"Multiple buyers consolidated into single purchase orders. Suppliers get predictable, large-volume orders.",
	},
	{
		icon: <Clock className="h-6 w-6" aria-hidden="true" />,
		title: "60-Day Fulfillment",
		description:
			"Guaranteed fulfillment within 60 days of campaign completion. Certainty for both buyers and suppliers.",
	},
	{
		icon: <BadgeCheck className="h-6 w-6" aria-hidden="true" />,
		title: "Verified Organizations",
		description:
			"Admin verification ensures only legitimate businesses participate. Trade with confidence on a trusted platform.",
	},
];

function Features(): ReactNode {
	return (
		<section
			id="features"
			className="py-24 sm:py-32 bg-muted/30"
			aria-labelledby="features-heading"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2
						id="features-heading"
						className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
					>
						Built for B2B Procurement Excellence
					</h2>
					<p className="text-lg text-muted-foreground">
						A win-win marketplace connecting buyers and suppliers through
						group buying campaigns. Better prices for buyers, predictable orders for suppliers.
					</p>
				</div>

				{/* Features Grid */}
				<div
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
					role="list"
					aria-label="Product features"
				>
					{features.map((feature, index) => (
						<Card
							key={feature.title}
							className="group hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 bg-card/50 backdrop-blur-sm"
							role="listitem"
							style={{ animationDelay: `${index * 0.1}s` }}
						>
							<CardHeader>
								<div
									className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
									aria-hidden="true"
								>
									{feature.icon}
								</div>
								<CardTitle className="group-hover:text-primary transition-colors duration-200">
									{feature.title}
								</CardTitle>
								<CardDescription className="text-muted-foreground leading-relaxed">
									{feature.description}
								</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export { Features };
