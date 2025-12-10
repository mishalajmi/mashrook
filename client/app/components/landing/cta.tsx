import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { useLanguage } from "@/i18n/language-context";

function CTA(): ReactNode {
	const { t } = useTranslation();
	const { isRtl } = useLanguage();

	return (
		<section
			className="relative py-24 sm:py-32 bg-primary overflow-hidden"
			aria-labelledby="cta-heading"
		>
			{/* Breathing background effect */}
			<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
				<div className="absolute top-1/2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-3xl animate-breathe" />
			</div>
			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="text-center max-w-3xl mx-auto">
					<h2
						id="cta-heading"
						className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6"
					>
						{t("cta.title")}
					</h2>
					<p className="text-lg text-primary-foreground/80 mb-10">
						{t("cta.subtitle")}
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Button
							size="xl"
							variant="secondary"
							className="group bg-background text-foreground hover:bg-background/90"
						>
							{t("cta.buyerButton")}
							<ArrowRight
								className={`h-5 w-5 transition-transform duration-200 ${isRtl ? "me-2 group-hover:-translate-x-1 rotate-180" : "ms-2 group-hover:translate-x-1"}`}
								aria-hidden="true"
							/>
						</Button>
						<Button
							size="xl"
							variant="outline"
							className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
						>
							{t("cta.supplierButton")}
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}

export { CTA };
