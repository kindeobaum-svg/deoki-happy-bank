import type { AttendanceStatus } from "@/lib/types";

export type { AttendanceStatus };

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "출석",
  LATE: "지각",
  ABSENT: "결석",
};

export const ATTENDANCE_EMOJI: Record<AttendanceStatus, string> = {
  PRESENT: "✅",
  LATE: "⏰",
  ABSENT: "🏠",
};

export const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100 text-green-800 ring-green-200",
  LATE: "bg-amber-100 text-amber-800 ring-amber-200",
  ABSENT: "bg-rose-100 text-rose-800 ring-rose-200",
};

export const PRAISE_PRESETS = [
  { emoji: "👋", message: "친구에게 먼저 인사 했어요" },
  { emoji: "⭐", message: "오늘도 반짝반짝 잘했어요!" },
  { emoji: "🤝", message: "친구와 사이좋게 지냈어요!" },
  { emoji: "🧹", message: "스스로 정리정돈했어요!" },
  { emoji: "😊", message: "웃음이 예뻤어요!" },
  { emoji: "🎨", message: "창의적으로 표현했어요!" },
  { emoji: "🍽️", message: "밥을 깨끗이 다 먹었어요!" },
];

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
