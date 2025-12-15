import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-[#115E59] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)] hover:bg-destructive/90 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-background shadow-[var(--shadow-sm)] hover:bg-muted hover:text-foreground hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--shadow-sm)] hover:bg-secondary/80 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        ghost:
          "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[6px] px-3",
        lg: "h-12 rounded-[6px] px-8 text-base",
        xl: "h-14 rounded-[6px] px-10 text-lg",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
