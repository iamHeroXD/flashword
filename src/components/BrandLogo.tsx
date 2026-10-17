"use client";

import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  showTagline?: boolean;
}

export function BrandLogo({ size = "md", href = "/", showTagline = false }: BrandLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const Content = (
    <div className="flex items-center gap-2.5 group cursor-pointer select-none">
      <div
        className={`${iconSizes[size]} rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105`}
        style={{
          background: "linear-gradient(135deg, #8B5CF6 0%, #6EE7B7 100%)",
          boxShadow: "0 0 16px -2px rgba(139, 92, 246, 0.4)",
        }}
      >
        {/* Crisp lightning flash SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-4/5 h-4/5 text-white drop-shadow-sm transition-transform duration-300 group-hover:rotate-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            fill="white"
            stroke="none"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center">
          <span className={`${textSizes[size]} font-extrabold tracking-tight text-[var(--text-primary)] transition-colors`}>
            Flash
          </span>
          <span className={`${textSizes[size]} font-extrabold tracking-tight text-[var(--accent-primary)] transition-colors`}>
            word
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mint)] ml-1 mb-2 animate-pulse" />
        </div>
        {showTagline && (
          <span className="text-xs text-[var(--text-secondary)] -mt-1 font-medium tracking-wide">
            Brain on the clock
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-block">{Content}</Link>;
  }

  return Content;
}
