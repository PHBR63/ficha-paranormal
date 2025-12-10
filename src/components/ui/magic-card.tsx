"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  borderWidth?: number;
  spotlight?: boolean;
  tilt?: boolean;
  tiltAmount?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "hsl(var(--primary))",
  gradientOpacity = 0.15,
  borderWidth = 1,
  spotlight = true,
  tilt = true,
  tiltAmount = 10,
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position for gradient
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring for smooth tilt
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Update gradient position
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);

      // Update tilt
      if (tilt) {
        const x = (e.clientY - centerY) / (rect.height / 2);
        const y = (e.clientX - centerX) / (rect.width / 2);
        rotateX.set(-x * tiltAmount);
        rotateY.set(y * tiltAmount);
      }
    },
    [mouseX, mouseY, rotateX, rotateY, tilt, tiltAmount]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  const background = useMotionTemplate`
    radial-gradient(
      ${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientColor} 0%,
      transparent 100%
    )
  `;

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative rounded-lg bg-card border border-border overflow-hidden",
        className
      )}
      style={{
        transformStyle: "preserve-3d",
        rotateX: tilt ? rotateX : 0,
        rotateY: tilt ? rotateY : 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ scale: { duration: 0.2 } }}
    >
      {/* Spotlight gradient */}
      {spotlight && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background,
            opacity: isHovered ? gradientOpacity : 0,
          }}
          transition={{ opacity: { duration: 0.3 } }}
        />
      )}

      {/* Border glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-lg z-20"
        style={{
          boxShadow: isHovered
            ? `0 0 20px 2px ${gradientColor}40, inset 0 0 20px 2px ${gradientColor}20`
            : "none",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
    </motion.div>
  );
}

// Shimmer button effect
interface ShimmerButtonProps {
  shimmerColor?: string;
  shimmerSize?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function ShimmerButton({
  children,
  className,
  onClick,
  disabled,
}: ShimmerButtonProps) {
  return (
    <motion.button
      className={cn(
        "relative overflow-hidden rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium",
        "before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)]",
        "before:bg-[length:250%_100%] before:animate-shimmer",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
