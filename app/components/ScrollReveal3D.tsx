"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollReveal3DProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in milliseconds
  duration?: number; // duration in seconds
  direction?: "up" | "down" | "left" | "right" | "tilt-up" | "tilt-down";
  threshold?: number;
}

export default function ScrollReveal3D({
  children,
  className = "",
  delay = 0,
  duration = 0.7,
  direction = "up",
  threshold = 0.05,
}: ScrollReveal3DProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is unavailable (SSR edge case) show immediately
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px 0px 0px", // no negative margin — never miss elements
      }
    );

    const currentRef = elementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Safety fallback: if still not visible after 1.5s, force show
    const fallback = setTimeout(() => setIsVisible(true), 1500);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
      clearTimeout(fallback);
    };
  }, [threshold]);

  // Translate offset based on direction (subtle, not 3D tilt)
  const getTranslate = () => {
    if (isVisible) return "translateY(0px) translateX(0px)";
    switch (direction) {
      case "down":       return "translateY(-18px)";
      case "left":       return "translateX(18px)";
      case "right":      return "translateX(-18px)";
      case "tilt-up":    return "translateY(22px)";
      case "tilt-down":  return "translateY(-22px)";
      case "up":
      default:           return "translateY(18px)";
    }
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTranslate(),
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
