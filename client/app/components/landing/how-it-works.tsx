import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface StepConfig {
	numberKey: string;
	titleKey: string;
	descriptionKey: string;
}

const stepConfigs: StepConfig[] = [
	{
		numberKey: "howItWorks.steps.step1.number",
		titleKey: "howItWorks.steps.step1.title",
		descriptionKey: "howItWorks.steps.step1.description",
	},
	{
		numberKey: "howItWorks.steps.step2.number",
		titleKey: "howItWorks.steps.step2.title",
		descriptionKey: "howItWorks.steps.step2.description",
	},
	{
		numberKey: "howItWorks.steps.step3.number",
		titleKey: "howItWorks.steps.step3.title",
		descriptionKey: "howItWorks.steps.step3.description",
	},
	{
		numberKey: "howItWorks.steps.step4.number",
		titleKey: "howItWorks.steps.step4.title",
		descriptionKey: "howItWorks.steps.step4.description",
	},
];

function HowItWorks(): ReactNode {
	const { t } = useTranslation();

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
						{t("howItWorks.title")}
					</h2>
					<p className="text-lg text-muted-foreground">
						{t("howItWorks.subtitle")}
					</p>
				</div>

				{/* Steps */}
				<div className="relative">
					{/* Connection line - visible on desktop */}
					<div
						className="hidden lg:block absolute top-24 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 w-3/4 h-0.5 bg-border"
						aria-hidden="true"
					/>

					<ol
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4"
						aria-label={t("howItWorks.ariaLabel")}
					>
						{stepConfigs.map((step, index) => (
							<li
								key={step.numberKey}
								className="relative group"
								style={{ animationDelay: `${index * 0.15}s` }}
							>
								<div className="flex flex-col items-center text-center">
									{/* Step Number */}
									<div
										className="relative z-10 mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-background border-2 border-primary text-primary font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
										aria-hidden="true"
									>
										{t(step.numberKey)}
									</div>

									{/* Step Content */}
									<h3 className="text-xl font-semibold text-foreground mb-3">
										{t(step.titleKey)}
									</h3>
									<p className="text-muted-foreground leading-relaxed">
										{t(step.descriptionKey)}
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
