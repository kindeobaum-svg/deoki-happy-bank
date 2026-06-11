export const ROLES = {
  DIRECTOR: "director",
  TEACHER: "teacher",
  PARENT: "parent"
};

export const ROLE_LABELS = {
  [ROLES.DIRECTOR]: "원장",
  [ROLES.TEACHER]: "교사",
  [ROLES.PARENT]: "학부모"
};

export const STORAGE_KEY = "deoki-happy-bank-state-v1";
export const SESSION_KEY = "deoki-happy-bank-session-v1";

export const STANDARD_MISSIONS = [
  { key: "dress", title: "스스로 옷 입기", point: 500 },
  { key: "greeting", title: "인사하기", point: 500 },
  { key: "cleanup", title: "정리정돈하기", point: 500 },
  { key: "help-friend", title: "친구 도와주기", point: 500 },
  { key: "brush-teeth", title: "양치하기", point: 500 }
];

export const GROWTH_STAGES = [
  {
    id: "seed",
    name: "씨앗 단계",
    threshold: 0,
    description: "행복부자 여정을 시작했어요."
  },
  {
    id: "sprout",
    name: "새싹 단계",
    threshold: 5000,
    description: "좋은 습관이 새싹처럼 올라와요."
  },
  {
    id: "young-tree",
    name: "어린나무 단계",
    threshold: 10000,
    description: "스스로 해내는 힘이 자라고 있어요."
  },
  {
    id: "happy-tree",
    name: "행복나무 단계",
    threshold: 15000,
    description: "따뜻한 마음이 단단한 나무가 되었어요."
  },
  {
    id: "forest-keeper",
    name: "숲지킴이 단계",
    threshold: 20000,
    description: "친구와 교실의 행복을 함께 지켜요."
  },
  {
    id: "happy-rich",
    name: "행복부자 단계",
    threshold: 30000,
    description: "행복을 나누는 멋진 부자가 되었어요."
  }
];

export function toDateKey(value = new Date()) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createInitialData(today = toDateKey()) {
  const base = {
    classes: [
      { id: "sun", name: "햇살반", teacherId: "teacher-sun", color: "#ffb84d" },
      { id: "star", name: "별님반", teacherId: "teacher-star", color: "#7d8cff" }
    ],
    users: [
      {
        id: "director-1",
        role: ROLES.DIRECTOR,
        name: "김하늘 원장",
        title: "원장용",
        description: "모든 반과 모든 아이를 조회합니다."
      },
      {
        id: "teacher-sun",
        role: ROLES.TEACHER,
        name: "박소라 선생님",
        classId: "sun",
        title: "교사용",
        description: "햇살반 아이만 조회하고 미션을 생성합니다."
      },
      {
        id: "teacher-star",
        role: ROLES.TEACHER,
        name: "이도윤 선생님",
        classId: "star",
        title: "교사용",
        description: "별님반 아이만 조회하고 미션을 생성합니다."
      },
      {
        id: "parent-minjun",
        role: ROLES.PARENT,
        name: "김민준 학부모",
        childIds: ["child-minjun"],
        title: "학부모용",
        description: "김민준 어린이의 기록만 조회합니다."
      },
      {
        id: "parent-seoa",
        role: ROLES.PARENT,
        name: "박서아 학부모",
        childIds: ["child-seoa"],
        title: "학부모용",
        description: "박서아 어린이의 기록만 조회합니다."
      }
    ],
    children: [
      {
        id: "child-minjun",
        name: "김민준",
        classId: "sun",
        birthMonth: "2020.03",
        parentUserIds: ["parent-minjun"],
        balance: 12800,
        forest: { treeName: "용기나무", level: 4, seeds: 18, nextLevelSeeds: 25 }
      },
      {
        id: "child-harin",
        name: "이하린",
        classId: "sun",
        birthMonth: "2020.08",
        parentUserIds: [],
        balance: 9400,
        forest: { treeName: "배려나무", level: 3, seeds: 11, nextLevelSeeds: 18 }
      },
      {
        id: "child-seoa",
        name: "박서아",
        classId: "star",
        birthMonth: "2019.12",
        parentUserIds: ["parent-seoa"],
        balance: 15600,
        forest: { treeName: "감사나무", level: 5, seeds: 31, nextLevelSeeds: 40 }
      },
      {
        id: "child-doyun",
        name: "최도윤",
        classId: "star",
        birthMonth: "2020.06",
        parentUserIds: [],
        balance: 7200,
        forest: { treeName: "친절나무", level: 2, seeds: 7, nextLevelSeeds: 12 }
      }
    ],
    transactions: [
      {
        id: "tx-1",
        childId: "child-minjun",
        date: today,
        amount: 500,
        title: "친구 장난감 정리 도와주기",
        category: "배려"
      },
      {
        id: "tx-2",
        childId: "child-minjun",
        date: "2026-06-08",
        amount: 300,
        title: "아침 인사 먼저 하기",
        category: "예절"
      },
      {
        id: "tx-6",
        childId: "child-minjun",
        date: "2026-06-08",
        amount: -1000,
        title: "행복상점 연필 구입",
        category: "지출"
      },
      {
        id: "tx-3",
        childId: "child-harin",
        date: today,
        amount: 400,
        title: "급식 남기지 않기",
        category: "습관"
      },
      {
        id: "tx-4",
        childId: "child-seoa",
        date: today,
        amount: 700,
        title: "동생에게 책 읽어주기",
        category: "나눔"
      },
      {
        id: "tx-5",
        childId: "child-doyun",
        date: "2026-06-08",
        amount: 200,
        title: "신발 바르게 정리하기",
        category: "생활"
      }
    ],
    growthRecords: [
      {
        id: "growth-1",
        childId: "child-minjun",
        date: today,
        author: "박소라 선생님",
        title: "친구 마음을 먼저 물어봤어요",
        note: "블록 놀이 중 속상한 친구에게 먼저 다가가 이유를 물어보며 해결을 도왔습니다.",
        tags: ["사회성", "공감"]
      },
      {
        id: "growth-2",
        childId: "child-harin",
        date: "2026-06-08",
        author: "박소라 선생님",
        title: "스스로 식사 준비를 했어요",
        note: "수저와 물컵을 챙기고 주변 친구를 기다려 주는 모습이 돋보였습니다.",
        tags: ["자립", "기다림"]
      },
      {
        id: "growth-3",
        childId: "child-seoa",
        date: today,
        author: "이도윤 선생님",
        title: "이야기 발표에 자신감이 생겼어요",
        note: "주말 이야기를 또렷한 목소리로 발표하며 친구들의 질문에도 차분히 답했습니다.",
        tags: ["언어", "자신감"]
      }
    ],
    forestMoments: [
      {
        id: "forest-1",
        childId: "child-minjun",
        date: today,
        seed: 3,
        title: "용기 씨앗",
        note: "새로운 노래 율동을 앞에서 시도했습니다."
      },
      {
        id: "forest-2",
        childId: "child-seoa",
        date: today,
        seed: 5,
        title: "감사 꽃",
        note: "급식 선생님께 감사 인사를 전했습니다."
      },
      {
        id: "forest-3",
        childId: "child-harin",
        date: "2026-06-08",
        seed: 2,
        title: "배려 새싹",
        note: "친구에게 색연필을 양보했습니다."
      }
    ],
    missionTemplates: [
      {
        id: "mission-template-greeting",
        title: "친구에게 먼저 인사하기",
        point: 300,
        targetType: "class",
        targetId: "sun",
        createdBy: "teacher-sun",
        createdAt: "2026-06-08",
        repeatDaily: true,
        active: true
      },
      {
        id: "mission-template-cleanup",
        title: "놀이 후 스스로 정리하기",
        point: 200,
        targetType: "child",
        targetId: "child-seoa",
        createdBy: "teacher-star",
        createdAt: today,
        repeatDaily: false,
        active: true
      },
      {
        id: "mission-template-thanks",
        title: "고마운 사람에게 감사 표현하기",
        point: 400,
        targetType: "class",
        targetId: "star",
        createdBy: "teacher-star",
        createdAt: "2026-06-08",
        repeatDaily: true,
        active: true
      }
    ],
    dailyMissions: [],
    lastMissionDate: null
  };

  return normalizeDailyMissions(normalizeStandardMissionTemplates(normalizeBankAccounts(base), today), today);
}

export function getUser(data, userId) {
  return data.users.find((user) => user.id === userId) ?? null;
}

export function getClass(data, classId) {
  return data.classes.find((classroom) => classroom.id === classId) ?? null;
}

export function getChild(data, childId) {
  return data.children.find((child) => child.id === childId) ?? null;
}

export function canViewChild(user, child) {
  if (!user || !child) {
    return false;
  }

  if (user.role === ROLES.DIRECTOR) {
    return true;
  }

  if (user.role === ROLES.TEACHER) {
    return child.classId === user.classId;
  }

  if (user.role === ROLES.PARENT) {
    return Array.isArray(user.childIds) && user.childIds.includes(child.id);
  }

  return false;
}

export function getVisibleChildren(data, user) {
  return data.children.filter((child) => canViewChild(user, child));
}

function getChildTransactionTotal(data, childId) {
  return data.transactions
    .filter((transaction) => transaction.childId === childId)
    .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);
}

export function normalizeBankAccounts(data) {
  return {
    ...data,
    children: data.children.map((child) => {
      if (Number.isFinite(Number(child.openingBalance))) {
        return child;
      }

      return {
        ...child,
        openingBalance: Number(child.balance ?? 0) - getChildTransactionTotal(data, child.id)
      };
    })
  };
}

export function getChildAccountBalance(data, child) {
  if (!child) {
    return 0;
  }

  const openingBalance = Number.isFinite(Number(child.openingBalance))
    ? Number(child.openingBalance)
    : Number(child.balance ?? 0) - getChildTransactionTotal(data, child.id);

  return openingBalance + getChildTransactionTotal(data, child.id);
}

export function getVisibleClasses(data, user) {
  if (!user) {
    return [];
  }

  if (user.role === ROLES.DIRECTOR) {
    return data.classes;
  }

  if (user.role === ROLES.TEACHER) {
    return data.classes.filter((classroom) => classroom.id === user.classId);
  }

  const childClassIds = new Set(getVisibleChildren(data, user).map((child) => child.classId));
  return data.classes.filter((classroom) => childClassIds.has(classroom.id));
}

export function getMissionTemplateTargets(data, template) {
  if (!template.active) {
    return [];
  }

  if (template.targetType === "child") {
    return data.children.some((child) => child.id === template.targetId) ? [template.targetId] : [];
  }

  if (template.targetType === "class") {
    return data.children
      .filter((child) => child.classId === template.targetId)
      .map((child) => child.id);
  }

  return [];
}

export function shouldGenerateTemplateForDate(template, dateKey) {
  return Boolean(template.active && (template.repeatDaily || template.createdAt === dateKey));
}

export function normalizeDailyMissions(data, date = new Date()) {
  const dateKey = toDateKey(date);
  const existingKeys = new Set(
    data.dailyMissions
      .filter((mission) => mission.date === dateKey)
      .map((mission) => `${mission.templateId}:${mission.childId}`)
  );

  const generated = [];

  for (const template of data.missionTemplates) {
    if (!shouldGenerateTemplateForDate(template, dateKey)) {
      continue;
    }

    for (const childId of getMissionTemplateTargets(data, template)) {
      const key = `${template.id}:${childId}`;
      if (existingKeys.has(key)) {
        continue;
      }

      existingKeys.add(key);
      generated.push({
        id: makeId("daily-mission"),
        templateId: template.id,
        childId,
        date: dateKey,
        completed: false,
        completedAt: null
      });
    }
  }

  return {
    ...data,
    dailyMissions: [...data.dailyMissions, ...generated],
    lastMissionDate: dateKey
  };
}

export function normalizeStandardMissionTemplates(data, date = new Date()) {
  const dateKey = toDateKey(date);
  const existingKeys = new Set(
    data.missionTemplates.map((template) => `${template.standardKey ?? ""}:${template.targetId}`)
  );
  const generatedTemplates = [];

  for (const classroom of data.classes) {
    for (const mission of STANDARD_MISSIONS) {
      const key = `${mission.key}:${classroom.id}`;
      if (existingKeys.has(key)) {
        continue;
      }

      existingKeys.add(key);
      generatedTemplates.push({
        id: `standard-${classroom.id}-${mission.key}`,
        title: mission.title,
        point: mission.point,
        targetType: "class",
        targetId: classroom.id,
        createdBy: classroom.teacherId,
        createdAt: dateKey,
        repeatDaily: true,
        active: true,
        standardKey: mission.key
      });
    }
  }

  if (!generatedTemplates.length) {
    return data;
  }

  return {
    ...data,
    missionTemplates: [...generatedTemplates, ...data.missionTemplates]
  };
}

export function createMissionTemplate(data, user, missionInput, date = new Date()) {
  if (!user || user.role !== ROLES.TEACHER) {
    throw new Error("교사만 미션을 생성할 수 있습니다.");
  }

  if (!canCreateMissionForTarget(data, user, missionInput.targetType, missionInput.targetId)) {
    throw new Error("자기 반 아이에게만 미션을 생성할 수 있습니다.");
  }

  const title = String(missionInput.title ?? "").trim();
  if (!title) {
    throw new Error("미션 제목을 입력해주세요.");
  }

  const point = Number(missionInput.point);
  if (!Number.isFinite(point) || point < 0) {
    throw new Error("포인트는 0 이상 숫자로 입력해주세요.");
  }

  const template = {
    id: makeId("mission-template"),
    title,
    point,
    targetType: missionInput.targetType,
    targetId: missionInput.targetId,
    createdBy: user.id,
    createdAt: toDateKey(date),
    repeatDaily: Boolean(missionInput.repeatDaily),
    active: true
  };

  return normalizeDailyMissions(
    {
      ...data,
      missionTemplates: [template, ...data.missionTemplates]
    },
    date
  );
}

export function canCreateMissionForTarget(data, user, targetType, targetId) {
  if (!user || user.role !== ROLES.TEACHER) {
    return false;
  }

  if (targetType === "class") {
    return targetId === user.classId;
  }

  if (targetType === "child") {
    const child = getChild(data, targetId);
    return canViewChild(user, child);
  }

  return false;
}

export function getVisibleDailyMissions(data, user, date = new Date()) {
  const dateKey = toDateKey(date);

  return data.dailyMissions
    .filter((mission) => mission.date === dateKey)
    .filter((mission) => canViewChild(user, getChild(data, mission.childId)))
    .map((mission) => decorateMission(data, mission))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed);
      }
      return a.child.name.localeCompare(b.child.name, "ko");
    });
}

export function getVisibleChecklistMissions(data, user, childId = "all", date = new Date()) {
  const standardKeys = new Set(STANDARD_MISSIONS.map((mission) => mission.key));

  return getVisibleDailyMissions(data, user, date)
    .filter((mission) => standardKeys.has(mission.template.standardKey))
    .filter((mission) => childId === "all" || mission.childId === childId)
    .sort((a, b) => {
      const aIndex = STANDARD_MISSIONS.findIndex((mission) => mission.key === a.template.standardKey);
      const bIndex = STANDARD_MISSIONS.findIndex((mission) => mission.key === b.template.standardKey);
      if (a.child.name !== b.child.name) {
        return a.child.name.localeCompare(b.child.name, "ko");
      }
      return aIndex - bIndex;
    });
}

export function getVisibleMissionHistory(data, user) {
  return data.dailyMissions
    .filter((mission) => canViewChild(user, getChild(data, mission.childId)))
    .map((mission) => decorateMission(data, mission))
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function decorateMission(data, mission) {
  const child = getChild(data, mission.childId);
  const template = data.missionTemplates.find((item) => item.id === mission.templateId);
  const classroom = child ? getClass(data, child.classId) : null;

  if (!child || !template || !classroom) {
    return null;
  }

  return {
    ...mission,
    child,
    template,
    classroom
  };
}

export function completeMission(data, user, missionId, date = new Date()) {
  const mission = data.dailyMissions.find((item) => item.id === missionId);
  const child = mission ? getChild(data, mission.childId) : null;

  if (!mission || !child) {
    throw new Error("미션을 찾을 수 없습니다.");
  }

  if (!user || user.role !== ROLES.TEACHER || !canViewChild(user, child)) {
    throw new Error("교사는 자기 반 아이의 미션만 완료 처리할 수 있습니다.");
  }

  if (mission.completed) {
    return data;
  }

  const template = data.missionTemplates.find((item) => item.id === mission.templateId);
  const point = template?.point ?? 0;
  const dateKey = toDateKey(date);

  return {
    ...data,
    children: data.children.map((item) =>
      item.id === child.id
        ? {
            ...item,
            balance: item.balance + point,
            forest: {
              ...item.forest,
              seeds: item.forest.seeds + Math.max(1, Math.round(point / 100))
            }
          }
        : item
    ),
    transactions: [
      {
        id: makeId("tx"),
        childId: child.id,
        date: dateKey,
        amount: point,
        title: template?.title ?? "미션 완료",
        category: "미션"
      },
      ...data.transactions
    ],
    forestMoments: [
      {
        id: makeId("forest"),
        childId: child.id,
        date: dateKey,
        seed: Math.max(1, Math.round(point / 100)),
        title: "미션 씨앗",
        note: `${template?.title ?? "미션"} 완료로 행복 씨앗을 모았습니다.`
      },
      ...data.forestMoments
    ],
    dailyMissions: data.dailyMissions.map((item) =>
      item.id === missionId
        ? {
            ...item,
            completed: true,
            completedAt: new Date().toISOString()
          }
        : item
    )
  };
}

export function getVisibleTransactions(data, user, childId = "all") {
  const visibleChildIds = new Set(getVisibleChildren(data, user).map((child) => child.id));

  return data.transactions
    .filter((transaction) => visibleChildIds.has(transaction.childId))
    .filter((transaction) => childId === "all" || transaction.childId === childId)
    .map((transaction) => decorateTransaction(data, transaction))
    .filter((transaction) => transaction.child)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function decorateTransaction(data, transaction) {
  const amount = Number(transaction.amount ?? 0);

  return {
    ...transaction,
    amount,
    child: getChild(data, transaction.childId),
    direction: amount < 0 ? "expense" : "deposit",
    absoluteAmount: Math.abs(amount)
  };
}

export function getVisibleAccountSummary(data, user, childId = "all") {
  const visibleChildren = getVisibleChildren(data, user).filter(
    (child) => childId === "all" || child.id === childId
  );
  const visibleChildIds = new Set(visibleChildren.map((child) => child.id));
  const transactions = data.transactions
    .filter((transaction) => visibleChildIds.has(transaction.childId))
    .map((transaction) => decorateTransaction(data, transaction));

  return {
    totalDeposit: transactions
      .filter((transaction) => transaction.amount > 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
    totalExpense: transactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((sum, transaction) => sum + transaction.absoluteAmount, 0),
    currentBalance: visibleChildren.reduce(
      (sum, child) => sum + getChildAccountBalance(data, child),
      0
    ),
    transactionCount: transactions.length
  };
}

export function getVisibleGrowthRecords(data, user, childId = "all") {
  const visibleChildIds = new Set(getVisibleChildren(data, user).map((child) => child.id));

  return data.growthRecords
    .filter((record) => visibleChildIds.has(record.childId))
    .filter((record) => childId === "all" || record.childId === childId)
    .map((record) => ({
      ...record,
      child: getChild(data, record.childId)
    }))
    .filter((record) => record.child)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getGrowthProgress(child) {
  const balance = Math.max(0, Number(child?.balance ?? 0));
  const stages = GROWTH_STAGES.map((stage) => ({
    ...stage,
    achieved: balance >= stage.threshold,
    remaining: Math.max(0, stage.threshold - balance)
  }));
  const achievedStages = stages.filter((stage) => stage.achieved);
  const currentStage = achievedStages.at(-1) ?? stages[0];
  const nextStage = stages.find((stage) => !stage.achieved) ?? null;
  const previousThreshold = currentStage?.threshold ?? 0;
  const nextThreshold = nextStage?.threshold ?? previousThreshold;
  const requiredToNext = nextStage ? nextStage.threshold - balance : 0;
  const range = Math.max(1, nextThreshold - previousThreshold);
  const progressPercent = nextStage
    ? Math.min(100, Math.max(0, Math.round(((balance - previousThreshold) / range) * 100)))
    : 100;

  return {
    balance,
    stages,
    currentStage,
    nextStage,
    requiredToNext,
    progressPercent,
    completedStageCount: achievedStages.length,
    totalStageCount: stages.length
  };
}

export function getVisibleGrowthProgress(data, user, childId = "all") {
  return getVisibleChildren(data, user)
    .filter((child) => childId === "all" || child.id === childId)
    .map((child) => ({
      child,
      progress: getGrowthProgress({
        ...child,
        balance: getChildAccountBalance(data, child)
      })
    }));
}

export function getVisibleForestMoments(data, user, childId = "all") {
  const visibleChildIds = new Set(getVisibleChildren(data, user).map((child) => child.id));

  return data.forestMoments
    .filter((moment) => visibleChildIds.has(moment.childId))
    .filter((moment) => childId === "all" || moment.childId === childId)
    .map((moment) => ({
      ...moment,
      child: getChild(data, moment.childId)
    }))
    .filter((moment) => moment.child)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getDashboardStats(data, user, date = new Date()) {
  const visibleChildren = getVisibleChildren(data, user);
  const visibleChildIds = new Set(visibleChildren.map((child) => child.id));
  const missions = getVisibleDailyMissions(data, user, date);
  const totalBalance = visibleChildren.reduce(
    (sum, child) => sum + getChildAccountBalance(data, child),
    0
  );
  const todayTransactions = data.transactions.filter(
    (transaction) =>
      transaction.date === toDateKey(date) &&
      visibleChildIds.has(transaction.childId) &&
      Number(transaction.amount) > 0
  );

  return {
    childCount: visibleChildren.length,
    classCount: getVisibleClasses(data, user).length,
    totalBalance,
    missionCount: missions.length,
    completedMissionCount: missions.filter((mission) => mission.completed).length,
    todayDeposit: todayTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  };
}

export function getDefaultChildId(data, user) {
  return getVisibleChildren(data, user)[0]?.id ?? "all";
}
