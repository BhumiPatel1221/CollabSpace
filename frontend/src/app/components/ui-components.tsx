import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility for Tailwind class merging */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Button Component — Glassmorphic */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:from-[#4F46E5] hover:to-[#7C3AED] shadow-lg shadow-[#6366F1]/25 hover:shadow-xl hover:shadow-[#6366F1]/30",
      secondary: "bg-gradient-to-r from-[#6EE7B7] to-[#34D399] text-[#064E3B] hover:from-[#34D399] hover:to-[#10B981] shadow-lg shadow-[#10B981]/20",
      ghost: "bg-transparent text-[#6B7280] hover:bg-[rgba(139,92,246,0.06)] dark:hover:bg-[rgba(139,92,246,0.1)]",
      danger: "bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white hover:from-[#DC2626] hover:to-[#B91C1C] shadow-lg shadow-red-500/20",
      outline: "border border-[rgba(139,92,246,0.2)] bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(30,27,75,0.3)] text-[#1E1B4B] dark:text-[#E8E6F0] hover:bg-[rgba(139,92,246,0.06)] dark:hover:bg-[rgba(139,92,246,0.1)] backdrop-blur-sm",
      glass: "glass-button text-[#1E1B4B] dark:text-[#E8E6F0]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg font-semibold",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[14px] transition-all duration-250 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer font-medium",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

/** Input Component — Glassmorphic */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-[14px] border border-[rgba(139,92,246,0.15)] bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(30,27,75,0.4)] px-4 py-2.5 text-[#1E1B4B] dark:text-[#E8E6F0] placeholder-[#9CA3AF] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 focus:outline-none transition-all duration-250 relative",
          className
        )}
        {...props}
      />
    );
  }
);

/** Badge Component */
export function Badge({ children, className, variant = "default" }: { children: React.ReactNode; className?: string; variant?: "default" | "success" | "warning" }) {
  const variants = {
    default: "bg-[rgba(139,92,246,0.08)] text-[#6366F1] dark:bg-[rgba(139,92,246,0.15)] dark:text-[#C4B5FD]",
    success: "bg-[rgba(110,231,183,0.12)] text-[#065F46] dark:bg-[rgba(110,231,183,0.1)] dark:text-[#6EE7B7]",
    warning: "bg-[rgba(251,191,36,0.12)] text-[#92400E] dark:bg-[rgba(251,191,36,0.1)] dark:text-[#FBBF24]",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm", variants[variant], className)}>
      {children}
    </span>
  );
}

/** Avatar Component — with glass ring */
export function Avatar({ src, fallback, size = "md", online }: { src?: string; fallback: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("relative rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#818CF8] flex items-center justify-center overflow-visible ring-2 ring-white/30 dark:ring-white/10", sizes[size])}>
      {src ? (
        <img src={src} className="w-full h-full rounded-full object-cover" alt={fallback} />
      ) : (
        <span className={cn("text-white font-semibold", textSizes[size])}>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#6EE7B7] border-2 border-white dark:border-[#1E1B4B] rounded-full shadow-lg shadow-[#6EE7B7]/40" />
      )}
    </div>
  );
}

/** Modal Component — Glassmorphic */
export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F0D1F]/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-panel-strong rounded-[20px] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[rgba(139,92,246,0.1)] rounded-full transition-colors">
            <svg className="w-5 h-5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
