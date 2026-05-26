/** 교사 30초 원터치 — 생활습관 · 칭찬 · 통장 입금 */
export type TeacherHabitQuick = {
  id: string;
  label: string;
  emoji: string;
  amount: number;
  praise: string;
};

export const TEACHER_HABIT_QUICK_ACTIONS: TeacherHabitQuick[] = [
  {
    id: "praise",
    label: "칭찬 적립",
    emoji: "⭐",
    amount: 100,
    praise: "오늘도 반짝반짝 잘했어요!",
  },
  {
    id: "tidy",
    label: "정리정돈",
    emoji: "🧹",
    amount: 500,
    praise: "스스로 정리정돈했어요!",
  },
  {
    id: "greet",
    label: "인사 잘하기",
    emoji: "👋",
    amount: 500,
    praise: "친구에게 먼저 인사했어요!",
  },
  {
    id: "help",
    label: "친구 도움",
    emoji: "🤝",
    amount: 500,
    praise: "친구를 도와주었어요!",
  },
  {
    id: "self-care",
    label: "스스로 하기",
    emoji: "🌱",
    amount: 500,
    praise: "스스로 해냈어요!",
  },
];
