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
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  const Content = (
    <div className="flex items-center gap-2.5 group cursor-pointer select-none">
      <div
        className={`${iconSizes[size]} rounded-xl flex items-center justify-center bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-[#0B0F19] transition-all duration-200 group-hover:scale-105 shadow-[0_4px_12px_rgba(245,158,11,0.35),inset_2px_2px_3px_rgba(255,255,255,0.6),inset_-2px_-2px_4px_rgba(180,83,9,0.6)]`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 text-[#0B0F19] drop-shadow-sm transition-transform duration-200 group-hover:rotate-6"
        >
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center tracking-tight">
          <span className={`${textSizes[size]} font-black text-white transition-colors`}>
            FLASH
          </span>
          <span className={`${textSizes[size]} font-black text-[#F59E0B] transition-colors`}>
            WORD
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] text-[#94A3B8] font-medium tracking-wider uppercase -mt-0.5">
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
