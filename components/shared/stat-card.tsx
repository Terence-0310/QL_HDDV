"use client";

import type { ReactNode } from "react";

import Link from "next/link";

type StatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
  href?: string;
};

function resolveTone(tone: StatCardProps["tone"]) {
  if (tone === "success") {
    return {
      bg: "linear-gradient(145deg, rgba(236,253,245,0.7) 0%, rgba(209,250,229,0.3) 100%)",
      textGradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      line: "#10b981",
    };
  }
  if (tone === "warning") {
    return {
      bg: "linear-gradient(145deg, rgba(255,251,235,0.7) 0%, rgba(254,243,199,0.3) 100%)",
      textGradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
      line: "#f59e0b",
    };
  }
  if (tone === "danger") {
    return {
      bg: "linear-gradient(145deg, rgba(254,242,242,0.7) 0%, rgba(254,226,226,0.3) 100%)",
      textGradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      line: "#ef4444",
    };
  }
  if (tone === "info") {
    return {
      bg: "linear-gradient(145deg, rgba(239,246,255,0.7) 0%, rgba(219,234,254,0.3) 100%)",
      textGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      line: "#3b82f6",
    };
  }
  return {
    bg: "linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.3) 100%)",
    textGradient: "linear-gradient(135deg, #475569 0%, #334155 100%)",
    line: "#94a3b8",
  };
}

export function StatCard({ label, value, hint, tone = "default", icon, href }: StatCardProps) {
  const colors = resolveTone(tone);

  const cardContent = (
    <div 
      className={`stat-card group ${href ? 'hover-scale' : ''}`}
      style={{ 
        background: colors.bg,
        cursor: href ? "pointer" : "default",
        transition: "all 0.2s ease"
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p className="stat-card-label">{label}</p>
        {icon && (
          <div 
            className="stat-card-icon"
            style={{ color: colors.line }}
          >
            {icon}
          </div>
        )}
      </div>
      
      <p 
        className="stat-card-value" 
        style={{ 
          backgroundImage: colors.textGradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {value}
      </p>
      {hint ? <p className="stat-card-hint">{hint}</p> : null}
      
      {/* Decorative side line */}
      <div 
        style={{ 
          position: "absolute", 
          left: 0, 
          top: 0, 
          bottom: 0, 
          width: "4px", 
          background: colors.line,
          borderRadius: "4px 0 0 4px"
        }} 
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block", color: "inherit" }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
