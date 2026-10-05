import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, string> = {
  info: "border-border bg-muted text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  danger: "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
};

export function Alert({ className, tone = "info", ...props }: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  const enter = tone === "danger" || tone === "success" ? "animate__animated animate__fadeIn animate__faster" : undefined;
  return <div className={cn("rounded-2xl border p-4 text-sm leading-6", tones[tone], enter, className)} {...props} />;
}
