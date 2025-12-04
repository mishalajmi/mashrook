import type { ReactNode } from "react";
import {
	TrendingDown,
	Shield,
	BarChart3,
	Users,
	Clock,
	BadgeCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";

interface Feature {
	icon: ReactNode;
	titleKey: string;
	descriptionKey: string;
}

const featureConfigs: Feature[] = [
	{
		icon: <TrendingDown className="h-6 w-6" aria-hidden="true" />,
		titleKey: "features.items.volumeDiscounts.title",
		descriptionKey: "features.items.volumeDiscounts.description",
	},
	{
		icon: <Shield className="h-6 w-6" aria-hidden="true" />,
		titleKey: "features.items.securePayments.title",
		descriptionKey: "features.items.securePayments.description",
	},
	{
		icon: <BarChart3 className="h-6 w-6" aria-hidden="true" />,
		titleKey: "features.items.transparentPricing.title",
		descriptionKey: "features.items.transparentPricing.description",
	},
	{
		icon: <Users className="h-6 w-6" aria-hidden="true" />,
		titleKey: "features.items.aggregatePurchaseOrders.title",
		descriptionKey: "features.items.aggregatePurchaseOrders.description",
	},
	{
		icon: <Clock className="h-6 w-6" aria-hidden="true" />,
		titleKey: "features.items.fulfillment.title",
		descriptionKey: "features.items.fulfillment.description",
	},
	{
		icon: <BadgeCheck className="h-6 w-6" aria-hidden="true" />,
		titleKey: "features.items.verifiedOrganizations.title",
		descriptionKey: "features.items.verifiedOrganizations.description",
	},
];

function Features(): ReactNode {
	const { t } = useTranslation();

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
						{t("features.title")}
					</h2>
					<p className="text-lg text-muted-foreground">
						{t("features.subtitle")}
					</p>
				</div>

				{/* Features Grid */}
				<div
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
					role="list"
					aria-label={t("features.ariaLabel")}
				>
					{featureConfigs.map((feature, index) => (
						<Card
							key={feature.titleKey}
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
									{t(feature.titleKey)}
								</CardTitle>
								<CardDescription className="text-muted-foreground leading-relaxed">
									{t(feature.descriptionKey)}
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
