import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#0F172A] text-white hover:bg-[#1e293b] shadow-[0_10px_25px_rgba(15,23,42,0.15)]": variant === "primary",
            "bg-white text-[#0F172A] border-2 border-[#E2E8F0] hover:bg-gray-50": variant === "secondary",
            "border-2 border-brand-primary bg-transparent text-brand-primary hover:bg-brand-primary/10": variant === "outline",
            "bg-transparent hover:bg-black/5 text-[#475569] hover:text-[#0F172A]": variant === "ghost",
            "h-10 px-4 text-sm": size === "sm",
            "h-12 px-6 text-[18px]": size === "md",
            "h-[60px] px-10 text-[20px]": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
