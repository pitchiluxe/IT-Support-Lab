import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/15 text-warning',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        // Glowing "in-progress" badge — green border, no transparency so the glow
        // is visible. Applied via `variant` rather than className so the border
        // is not overridden by the `border-transparent` defaults.
        glowGreen: 'border-emerald-500/60 bg-emerald-500/25 text-emerald-800 dark:text-emerald-100',
        glowRed: 'border-red-500/60 bg-red-500/25 text-red-800 dark:text-red-100',
        // "Strong" — gold gradient. Used on the readiness card when the
        // learner has reached the top level.
        strong: 'border-amber-500/50 bg-gradient-to-r from-amber-400 to-amber-600 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
