import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-primary-foreground shadow-panel hover:bg-slate-950 dark:hover:bg-slate-100",
  secondary: "border-border bg-card text-card-foreground hover:border-slate-300 hover:bg-muted dark:hover:border-slate-600",
  ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
  danger: "border-destructive bg-destructive text-destructive-foreground hover:bg-red-700",
};

export function buttonClasses({ variant = "primary", className }: { variant?: ButtonVariant; className?: string } = {}) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55 active:translate-y-px",
    variants[variant],
    className,
  );
}

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClasses({ variant, className })} {...props} />;
}

export function ButtonLink({ className, variant = "primary", href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; href: string }) {
  return <Link href={href} className={buttonClasses({ variant, className })} {...props} />;
}
