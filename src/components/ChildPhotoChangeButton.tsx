"use client";

import { useRef, useState } from "react";
import { fileToProfilePhotoDataUrl, getDefaultProfileIcon } from "@/lib/childProfilePhoto";

type ChildPhotoChangeButtonProps = {
  childId: string;
  childName: string;
  onPhotoChange: (childId: string, avatar: string) => Promise<{ error?: string }>;
  compact?: boolean;
};

export function ChildPhotoChangeButton({
  childId,
  childName,
  onPhotoChange,
  compact = false,
}: ChildPhotoChangeButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const dataUrl = await fileToProfilePhotoDataUrl(file);
      const result = await onPhotoChange(childId, dataUrl);
      if (result.error) setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 변경에 실패했어요.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function resetToDefault() {
    setLoading(true);
    setError("");
    const result = await onPhotoChange(childId, getDefaultProfileIcon(childName));
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="child-photo-change">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className={`child-photo-change-btn ${compact ? "compact" : ""}`}
      >
        {loading ? "..." : compact ? "사진 변경" : "사진 변경"}
      </button>
      {!compact && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void resetToDefault()}
          className="child-photo-reset-btn"
          title="기본 아이콘으로"
        >
          🌸
        </button>
      )}
      {error && <p className="child-photo-change-error">{error}</p>}
    </div>
  );
}
