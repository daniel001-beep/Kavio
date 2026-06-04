import React from "react";

// ScrollReveal3D — simplified to a plain pass-through wrapper.
// All content is always fully visible with no opacity/transform tricks
// that could cause hiding bugs on mobile or slow browsers.
interface ScrollReveal3DProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: string;
  threshold?: number;
}

export default function ScrollReveal3D({
  children,
  className = "",
}: ScrollReveal3DProps) {
  return <div className={className}>{children}</div>;
}

