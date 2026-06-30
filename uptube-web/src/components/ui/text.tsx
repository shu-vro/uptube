import { cn } from "@/lib/cn";

type TextProps = React.ComponentProps<"p"> & {
  variant?: "default" | "muted" | "h1" | "h2" | "h3";
};

export function Text({ className, variant = "default", ...props }: TextProps) {
  const variants = {
    default: "text-foreground",
    muted: "text-muted-foreground",
    h1: "text-4xl font-bold tracking-tight",
    h2: "text-3xl font-semibold tracking-tight",
    h3: "text-2xl font-semibold tracking-tight",
  };
  return <p className={cn(variants[variant], className)} {...props} />;
}
