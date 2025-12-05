import type { ReactNode } from "react";
import { ArrowRight, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Badge } from "@/components/ui";
import { useLanguage } from "@/i18n/language-context";

function Hero(): ReactNode {
	const { t } = useTranslation();
	const { isRtl } = useLanguage();

	const stats = [
		{ value: t("hero.stats.savings.value"), label: t("hero.stats.savings.label") },
		{ value: t("hero.stats.fulfillment.value"), label: t("hero.stats.fulfillment.label") },
		{ value: t("hero.stats.security.value"), label: t("hero.stats.security.label") },
	];

	return (
		<section
			className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
			aria-labelledby="hero-heading"
		>
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
				<div className="absolute top-1/4 start-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float animate-breathe" />
				<div className="absolute bottom-1/4 end-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-float animate-breathe" style={{ animationDelay: "2s" }} />
			</div>

			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
				<div className="text-center">
					{/* Announcement Badge */}
					<div className="animate-fade-in-down">
						<Badge variant="outline" className="mb-6 px-4 py-1.5">
							<span className="me-2 inline-block w-2 h-2 rounded-full bg-primary animate-pulse-subtle" aria-hidden="true" />
							{t("hero.badge")}
						</Badge>
					</div>

					{/* Main Heading */}
					<h1
						id="hero-heading"
						className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6"
						style={{ animationDelay: "0.1s" }}
					>
						{t("hero.titleLine1")}
						<br />
						<span className="text-primary">{t("hero.titleLine2")}</span>
					</h1>

					{/* Subheading */}
					<p
						className="animate-fade-in-up mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10"
						style={{ animationDelay: "0.2s" }}
					>
						{t("hero.subtitle")}
					</p>

					{/* CTA Buttons */}
					<div
						className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4"
						style={{ animationDelay: "0.3s" }}
					>
						<Button size="xl" className="group">
							{t("hero.ctaPrimary")}
							<ArrowRight
								className={`h-5 w-5 transition-transform duration-200 ${isRtl ? "me-2 group-hover:-translate-x-1 rotate-180" : "ms-2 group-hover:translate-x-1"}`}
								aria-hidden="true"
							/>
						</Button>
						<Button variant="outline" size="xl" className="group">
							<Play
								className="me-2 h-5 w-5"
								aria-hidden="true"
							/>
							{t("hero.ctaSecondary")}
						</Button>
					</div>

					{/* Value Props */}
					<div
						className="animate-fade-in-up mt-12 pt-8 border-t border-border/50"
						style={{ animationDelay: "0.4s" }}
					>
						<p className="text-sm text-muted-foreground mb-4">
							{t("hero.trusted")}
						</p>
						<div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
							{stats.map((stat) => (
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
