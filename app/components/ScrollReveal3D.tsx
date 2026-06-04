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
  duration = 0.85,
  direction = "up",
  threshold = 0.1,
}: ScrollReveal3DProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, we can unobserve if we want a one-shot animation
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px", // triggers slightly before entering full viewport
      }
    );

    const currentRef = elementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  // Define starting states based on animation type
  const getTransformStart = () => {
    switch (direction) {
      case "tilt-up":
        return "perspective(1200px) rotateX(16deg) translateY(45px) scale(0.96)";
      case "tilt-down":
        return "perspective(1200px) rotateX(-16deg) translateY(-45px) scale(0.96)";
      case "down":
        return "perspective(1200px) rotateX(-8deg) translateY(-30px) scale(0.98)";
      case "left":
        return "perspective(1200px) rotateY(12deg) translateX(40px) scale(0.98)";
      case "right":
        return "perspective(1200px) rotateY(-12deg) translateX(-40px) scale(0.98)";
      case "up":
      default:
        return "perspective(1200px) rotateX(12deg) translateY(40px) scale(0.97)";
    }
  };

  const transformStyle = isVisible
    ? "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) translateX(0px) scale(1)"
    : getTransformStart();

  const opacityStyle = 1; // Always visible to ensure content legibility and prevent rendering bugs on mobile/iOS
  const blurStyle = "blur(0px)";

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        transform: transformStyle,
        opacity: opacityStyle,
        filter: blurStyle,
        transitionProperty: "transform, opacity, filter",
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", // Premium fluid ease-out curve
        transformOrigin: "center bottom",
        willChange: "transform, opacity, filter",
      }}
    >
      {children}
    </div>
  );
}
