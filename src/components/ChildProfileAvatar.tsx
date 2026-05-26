"use client";

import { resolveProfileDisplay } from "@/lib/childProfilePhoto";

type ChildProfileAvatarProps = {
  avatar?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<ChildProfileAvatarProps["size"]>, string> = {
  xs: "child-profile-avatar--xs",
  sm: "child-profile-avatar--sm",
  md: "child-profile-avatar--md",
  lg: "child-profile-avatar--lg",
  xl: "child-profile-avatar--xl",
};

export function ChildProfileAvatar({
  avatar,
  name,
  size = "md",
  className = "",
}: ChildProfileAvatarProps) {
  const display = resolveProfileDisplay(avatar, name);
  const sizeClass = SIZE_CLASS[size];

  if (display.type === "photo") {
    return (
      <span
        className={`child-profile-avatar child-profile-avatar--photo ${sizeClass} ${className}`}
        role="img"
        aria-label={name ? `${name} 프로필 사진` : "프로필 사진"}
      >
        <img src={display.src} alt="" className="child-profile-avatar-img" />
      </span>
    );
  }

  return (
    <span
      className={`child-profile-avatar child-profile-avatar--emoji ${sizeClass} ${className}`}
      aria-hidden
    >
      {display.emoji}
    </span>
  );
}
