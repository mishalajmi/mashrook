import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, Avatar, AvatarFallback } from "@/components/ui";

interface TestimonialConfig {
	testimonialKey: string;
	rating: number;
}

const testimonialConfigs: TestimonialConfig[] = [
	{ testimonialKey: "testimonials.items.testimonial1", rating: 5 },
	{ testimonialKey: "testimonials.items.testimonial2", rating: 5 },
	{ testimonialKey: "testimonials.items.testimonial3", rating: 5 },
];

function Testimonials(): ReactNode {
	const { t } = useTranslation();

	return (
		<section
			id="testimonials"
			className="py-24 sm:py-32"
			aria-labelledby="testimonials-heading"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2
						id="testimonials-heading"
						className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
					>
						{t("testimonials.title")}
					</h2>
					<p className="text-lg text-muted-foreground">
						{t("testimonials.subtitle")}
					</p>
				</div>

				{/* Testimonials Grid */}
				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-8"
					role="list"
					aria-label={t("testimonials.ariaLabel")}
				>
					{testimonialConfigs.map((config, index) => {
						const quote = t(`${config.testimonialKey}.quote`);
						const author = t(`${config.testimonialKey}.author`);
						const role = t(`${config.testimonialKey}.role`);
						const company = t(`${config.testimonialKey}.company`);

						return (
							<Card
								key={config.testimonialKey}
								className="bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
								role="listitem"
								style={{ animationDelay: `${index * 0.1}s` }}
							>
								<CardContent className="pt-6">
									{/* Rating */}
									<div
										className="flex items-center gap-1 mb-4"
										role="img"
										aria-label={t("testimonials.ratingLabel", { rating: config.rating })}
									>
										{Array.from({ length: config.rating }).map((_, i) => (
											<Star
												key={i}
												className="h-4 w-4 fill-primary text-primary"
												aria-hidden="true"
											/>
										))}
									</div>

									{/* Quote */}
									<blockquote className="mb-6">
										<p className="text-foreground leading-relaxed italic">
											"{quote}"
										</p>
									</blockquote>

									{/* Author */}
									<footer className="flex items-center gap-3">
										<Avatar>
											<AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
												{author
													.split(" ")
													.map((n: string) => n[0])
													.join("")}
											</AvatarFallback>
										</Avatar>
										<div>
											<cite className="not-italic">
												<p className="text-sm font-semibold text-foreground">
													{author}
												</p>
												<p className="text-xs text-muted-foreground">
													{role}, {company}
												</p>
											</cite>
										</div>
									</footer>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export { Testimonials };
