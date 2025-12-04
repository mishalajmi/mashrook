import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface Testimonial {
	quote: string;
	author: string;
	role: string;
	company: string;
	rating: number;
}

const testimonials: Testimonial[] = [
	{
		quote:
			"We saved 35% on our office supplies procurement by joining group campaigns. As a mid-sized company, we never had access to these volume discounts before.",
		author: "Sarah Chen",
		role: "Procurement Manager",
		company: "TechFlow Inc.",
		rating: 5,
	},
	{
		quote:
			"Mashrook gave us predictable, large-volume orders that transformed our sales pipeline. The consolidated purchase orders make fulfillment seamless.",
		author: "Marcus Rodriguez",
		role: "Sales Director",
		company: "Industrial Supply Co.",
		rating: 5,
	},
	{
		quote:
			"The transparent tiered pricing let us plan our budget accurately. We knew exactly what discount we'd get once the campaign reached its target.",
		author: "Emily Watson",
		role: "CFO",
		company: "Growth Ventures",
		rating: 5,
	},
];

function Testimonials(): ReactNode {
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
						Trusted by Buyers and Suppliers
					</h2>
					<p className="text-lg text-muted-foreground">
						See how businesses are saving on procurement and suppliers are
						growing their volume through group buying campaigns.
					</p>
				</div>

				{/* Testimonials Grid */}
				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-8"
					role="list"
					aria-label="Customer testimonials"
				>
					{testimonials.map((testimonial, index) => (
						<Card
							key={testimonial.author}
							className="bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
							role="listitem"
							style={{ animationDelay: `${index * 0.1}s` }}
						>
							<CardContent className="pt-6">
								{/* Rating */}
								<div
									className="flex items-center gap-1 mb-4"
									role="img"
									aria-label={`${testimonial.rating} out of 5 stars`}
								>
									{Array.from({ length: testimonial.rating }).map((_, i) => (
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
										"{testimonial.quote}"
									</p>
								</blockquote>

								{/* Author */}
								<footer className="flex items-center gap-3">
									<div
										className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
										aria-hidden="true"
									>
										<span className="text-sm font-semibold text-primary">
											{testimonial.author
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</span>
									</div>
									<div>
										<cite className="not-italic">
											<p className="text-sm font-semibold text-foreground">
												{testimonial.author}
											</p>
											<p className="text-xs text-muted-foreground">
												{testimonial.role}, {testimonial.company}
											</p>
										</cite>
									</div>
								</footer>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export { Testimonials };
