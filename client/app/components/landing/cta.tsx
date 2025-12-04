import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

function CTA(): ReactNode {
	return (
		<section
			className="relative py-24 sm:py-32 bg-primary overflow-hidden"
			aria-labelledby="cta-heading"
		>
			{/* Breathing background effect */}
			<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-3xl animate-breathe" />
			</div>
			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="text-center max-w-3xl mx-auto">
					<h2
						id="cta-heading"
						className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6"
					>
						Ready to Unlock Volume Discounts?
					</h2>
					<p className="text-lg text-primary-foreground/80 mb-10">
						Join the B2B group buying revolution. Whether you're looking to save
						on procurement or grow your sales volume, Mashrook connects you with the right partners.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Button
							size="xl"
							variant="secondary"
							className="group bg-background text-foreground hover:bg-background/90"
						>
							Join as Buyer
							<ArrowRight
								className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
								aria-hidden="true"
							/>
						</Button>
						<Button
							size="xl"
							variant="outline"
							className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
						>
							Launch as Supplier
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}

export { CTA };
