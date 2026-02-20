import * as React from "react";
import { Link } from "react-router";

interface LogoProps {
    height?: number;
    showText?: boolean;
    linkTo?: string;
    className?: string;
}

/**
 * Reusable CollabSpace Logo component.
 * Premium glassmorphic style with gradient accents.
 */
export function Logo({ height = 40, showText = true, linkTo = "/dashboard", className }: LogoProps) {
    const iconSize = height;
    const textSize = height * 0.45;

    const content = (
        <div className={`inline-flex items-center gap-2.5 select-none ${className ?? ""}`}>
            {/* Icon */}
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="logoGrad1" x1="14" y1="10" x2="46" y2="52" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#C4B5FD" />
                        <stop offset="1" stopColor="#818CF8" />
                    </linearGradient>
                    <linearGradient id="logoGrad2" x1="20" y1="16" x2="52" y2="58" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" />
                        <stop offset="1" stopColor="#F5F3FF" />
                    </linearGradient>
                </defs>
                {/* Back page */}
                <rect x="14" y="10" width="32" height="42" rx="6" fill="url(#logoGrad1)" stroke="#8B5CF6" strokeWidth="1.5" />
                {/* Front page (offset) */}
                <rect x="20" y="16" width="32" height="42" rx="6" fill="url(#logoGrad2)" stroke="#8B5CF6" strokeWidth="1.5" />
                {/* Text lines on front page */}
                <line x1="27" y1="28" x2="45" y2="28" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
                <line x1="27" y1="34" x2="42" y2="34" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
                <line x1="27" y1="40" x2="39" y2="40" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
                {/* Collaboration indicator — two small user dots with glow */}
                <circle cx="44" cy="48" r="4" fill="#6366F1" />
                <circle cx="36" cy="48" r="4" fill="#A78BFA" />
                {/* Subtle glow */}
                <circle cx="44" cy="48" r="6" fill="#6366F1" opacity="0.15" />
                <circle cx="36" cy="48" r="6" fill="#A78BFA" opacity="0.15" />
            </svg>

            {/* Wordmark */}
            {showText && (
                <span
                    style={{ fontSize: `${textSize}px`, lineHeight: 1, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                    className="font-bold whitespace-nowrap"
                >
                    <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">Collab</span>
                    <span className="text-[#1E1B4B] dark:text-[#E8E6F0]">Space</span>
                </span>
            )}
        </div>
    );

    if (linkTo) {
        return (
            <Link to={linkTo} className="inline-flex items-center no-underline hover:opacity-90 transition-opacity">
                {content}
            </Link>
        );
    }

    return content;
}
