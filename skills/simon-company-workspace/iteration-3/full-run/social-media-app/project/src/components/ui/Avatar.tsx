"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-lg",
};

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export default function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const initials = alt.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center flex-shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={size === "xl" ? "80px" : size === "lg" ? "56px" : size === "md" ? "40px" : "32px"}
        />
      ) : (
        <span className="font-semibold text-white">{initials}</span>
      )}
    </div>
  );
}
