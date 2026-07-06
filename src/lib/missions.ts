export const MISSION_SUCCESS_MESSAGE = "참 잘했어요!";

export type Mission = {
  id: string;
  name: string;
  amount: number;
  emoji: string;
  description: string;
};

export const MISSIONS: Mission[] = [
  {
    id: "help-friend",
    name: "친구 도와주기",
    amount: 500,
    emoji: "🤝",
    description: "친구를 도와주면 행복숲에 씨앗이 자라요",
  },
  {
    id: "tidy-up",
    name: "정리정돈",
    amount: 500,
    emoji: "🧹",
    description: "장난감과 물건을 제자리에 두었어요",
  },
  {
    id: "greet-well",
    name: "인사 잘하기",
    amount: 500,
    emoji: "👋",
    description: "먼저 밝게 인사했어요",
  },
  {
    id: "help-errand",
    name: "심부름 돕기",
    amount: 500,
    emoji: "🏃",
    description: "심부름을 기분 좋게 도왔어요",
  },
  {
    id: "recycle-help",
    name: "분리수거 도와주기",
    amount: 500,
    emoji: "♻️",
    description: "분리수거를 함께 실천했어요",
  },
  {
    id: "choose-one",
    name: "사고 싶은 물건 두 개 중 하나만 선택하기",
    amount: 1000,
    emoji: "🎁",
    description: "욕심을 참고 하나만 골랐어요",
  },
  {
    id: "lights-off",
    name: "불 끄기",
    amount: 300,
    emoji: "💡",
    description: "사용하지 않는 불을 껐어요",
  },
  {
    id: "save-water",
    name: "물 절약하기",
    amount: 300,
    emoji: "💧",
    description: "물을 아껴 썼어요",
  },
  {
    id: "shoes-self",
    name: "스스로 신발 신기",
    amount: 500,
    emoji: "👟",
    description: "혼자서 신발을 신었어요",
  },
  {
    id: "socks-self",
    name: "스스로 양말 신기",
    amount: 500,
    emoji: "🧦",
    description: "혼자서 양말을 신었어요",
  },
  {
    id: "dress-self",
    name: "스스로 옷 입기",
    amount: 1000,
    emoji: "👕",
    description: "혼자서 옷을 입었어요",
  },
];

export function getTodayCompletedMissionIds(
  childId: string,
  completions: { childId: string; missionId: string; date: string }[],
  today: string,
): string[] {
  return completions
    .filter((c) => c.childId === childId && c.date === today)
    .map((c) => c.missionId);
}

export async function completeMission(
  childId: string,
  missionId: string,
): Promise<{ alreadyDone: boolean; error?: string }> {
  const res = await fetch(`/api/children/${childId}/missions/${missionId}/complete`, {
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { alreadyDone: false, error: data.error ?? "미션 완료에 실패했습니다." };
  return { alreadyDone: data.alreadyDone ?? false };
}
