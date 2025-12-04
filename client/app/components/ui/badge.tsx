import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground",
				secondary:
					"bg-secondary text-secondary-foreground",
				outline:
					"border border-border text-foreground",
				muted:
					"bg-muted text-muted-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

export interface BadgeProps
	extends HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {
	children: ReactNode;
}

function Badge({ className, variant, children, ...props }: BadgeProps): ReactNode {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props}>
			{children}
		</div>
	);
}

export { Badge, badgeVariants };
