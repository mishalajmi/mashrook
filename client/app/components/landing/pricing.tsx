import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface PlanConfig {
	planKey: string;
	highlighted: boolean;
	buttonVariant: "default" | "outline";
}

const planConfigs: PlanConfig[] = [
	{
		planKey: "pricing.plans.buyers",
		highlighted: false,
		buttonVariant: "outline",
	},
	{
		planKey: "pricing.plans.successBased",
		highlighted: true,
		buttonVariant: "default",
	},
	{
		planKey: "pricing.plans.suppliers",
		highlighted: false,
		buttonVariant: "outline",
	},
];

function Pricing(): ReactNode {
	const { t } = useTranslation();

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
						{t("pricing.title")}
					</h2>
					<p className="text-lg text-muted-foreground">
						{t("pricing.subtitle")}
					</p>
				</div>

				{/* Pricing Cards */}
				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6"
					role="list"
					aria-label={t("pricing.ariaLabel")}
				>
					{planConfigs.map((config, index) => {
						const name = t(`${config.planKey}.name`);
						const description = t(`${config.planKey}.description`);
						const price = t(`${config.planKey}.price`);
						const period = t(`${config.planKey}.period`);
						const buttonText = t(`${config.planKey}.buttonText`);
						const features = t(`${config.planKey}.features`, { returnObjects: true }) as string[];

						return (
							<Card
								key={config.planKey}
								className={cn(
									"relative flex flex-col transition-all duration-300 hover:shadow-xl",
									config.highlighted
										? "border-primary shadow-lg scale-[1.02] md:scale-105 bg-card"
										: "bg-card/50 hover:-translate-y-1"
								)}
								role="listitem"
								style={{ animationDelay: `${index * 0.1}s` }}
							>
								{config.highlighted && (
									<div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
										<Badge variant="default" className="px-3 py-1">
											{t("pricing.mostPopular")}
										</Badge>
									</div>
								)}

								<CardHeader className="text-center pb-2">
									<CardTitle className="text-xl">{name}</CardTitle>
									<CardDescription>{description}</CardDescription>
								</CardHeader>

								<CardContent className="flex-1">
									{/* Price */}
									<div className="text-center mb-6">
										<span className="text-4xl font-bold text-foreground">
											{price}
										</span>
										{period && (
											<span className="text-muted-foreground ms-1">{period}</span>
										)}
									</div>

									{/* Features */}
									<ul className="space-y-3" role="list" aria-label={`${name} features`}>
										{features.map((feature) => (
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
										variant={config.buttonVariant}
										className="w-full"
										size="lg"
									>
										{buttonText}
									</Button>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export { Pricing };
