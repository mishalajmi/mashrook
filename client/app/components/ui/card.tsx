import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

function Card({ className, children, ...props }: CardProps): ReactNode {
	return (
		<div
			className={cn(
				"rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300",
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

function CardHeader({ className, children, ...props }: CardHeaderProps): ReactNode {
	return (
		<div
			className={cn("flex flex-col space-y-1.5 p-6", className)}
			{...props}
		>
			{children}
		</div>
	);
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
	children: ReactNode;
}

function CardTitle({ className, children, ...props }: CardTitleProps): ReactNode {
	return (
		<h3
			className={cn(
				"text-xl font-semibold leading-none tracking-tight text-card-foreground mb-0",
				className
			)}
			{...props}
		>
			{children}
		</h3>
	);
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
	children: ReactNode;
}

function CardDescription({ className, children, ...props }: CardDescriptionProps): ReactNode {
	return (
		<p
			className={cn("text-sm text-muted-foreground mb-0", className)}
			{...props}
		>
			{children}
		</p>
	);
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

function CardContent({ className, children, ...props }: CardContentProps): ReactNode {
	return (
		<div className={cn("p-6 pt-0", className)} {...props}>
			{children}
		</div>
	);
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

function CardFooter({ className, children, ...props }: CardFooterProps): ReactNode {
	return (
		<div
			className={cn("flex items-center p-6 pt-0", className)}
			{...props}
		>
			{children}
		</div>
	);
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
