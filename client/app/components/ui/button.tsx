import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/90 active:scale-[0.98]",
				outline:
					"border border-border bg-transparent hover:bg-muted hover:text-foreground active:scale-[0.98]",
				ghost:
					"hover:bg-muted hover:text-foreground",
				link:
					"text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-12 rounded-lg px-8 text-base",
				xl: "h-14 rounded-xl px-10 text-lg",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	children: ReactNode;
}

function Button({
	className,
	variant,
	size,
	children,
	...props
}: ButtonProps): ReactNode {
	return (
		<button
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			{children}
		</button>
	);
}

export { Button, buttonVariants };
