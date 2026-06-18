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

export const DEFAULT_PARENT_INVITE_CODES = [
  {
    code: "DK-MINJUN-2026",
    childId: "child-minjun",
    label: "김민준 학부모 초대코드",
    active: true
  },
  {
    code: "DK-SEOA-2026",
    childId: "child-seoa",
    label: "박서아 학부모 초대코드",
    active: true
  },
  {
    code: "DK-HARIN-2026",
    childId: "child-harin",
    label: "이하린 학부모 초대코드",
    active: true
  },
  {
    code: "DK-DOYUN-2026",
    childId: "child-doyun",
    label: "최도윤 학부모 초대코드",
    active: true
  }
];

export const STANDARD_MISSIONS = [
  { key: "greeting", title: "인사하기", point: 500 },
  { key: "cleanup", title: "정리정돈", point: 500 },
  { key: "brush-teeth", title: "양치하기", point: 500 },
  { key: "help-friend", title: "친구 돕기", point: 500 }
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

function getNextChildSequence(data) {
  const numericIds = data.children
    .map((child) => /^child-(\d+)$/.exec(child.id)?.[1])
    .filter(Boolean)
    .map(Number);
  const maxExisting = numericIds.length ? Math.max(...numericIds) : data.children.length;

  return maxExisting + 1;
}

function makeChildId(data) {
  let sequence = getNextChildSequence(data);
  let childId = `child-${String(sequence).padStart(3, "0")}`;
  const existingIds = new Set(data.children.map((child) => child.id));

  while (existingIds.has(childId)) {
    sequence += 1;
    childId = `child-${String(sequence).padStart(3, "0")}`;
  }

  return childId;
}

function getChildInviteCodePart(childId = "") {
  const numeric = /^child-(\d+)$/.exec(childId)?.[1];

  if (numeric) {
    return numeric.padStart(6, "0");
  }

  return String(childId)
    .replace(/^child-/i, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6)
    .padStart(6, "0") || "000000";
}

function makeInviteCodeForChild(child) {
  return `DK-CHILD-${getChildInviteCodePart(child.id)}`;
}

function makeUniqueInviteCode(data, child) {
  const base = makeInviteCodeForChild(child);
  const existingCodes = new Set((data.inviteCodes ?? []).map((invite) => String(invite.code).toUpperCase()));

  if (!existingCodes.has(base.toUpperCase())) {
    return base;
  }

  let suffix = 2;
  let code = `${base}-${suffix}`;
  while (existingCodes.has(code.toUpperCase())) {
    suffix += 1;
    code = `${base}-${suffix}`;
  }

  return code;
}

function dedupeParentInviteCodes(data, inviteCodes) {
  const byChildId = new Map();

  for (const invite of inviteCodes) {
    const child = data.children.find((item) => item.id === invite.childId);
    if (!child) {
      continue;
    }

    const existing = byChildId.get(invite.childId);
    const preferredCode = makeInviteCodeForChild(child).toUpperCase();
    const inviteIsPreferred = String(invite.code).toUpperCase() === preferredCode;
    const existingIsPreferred = existing && String(existing.code).toUpperCase() === preferredCode;

    if (!existing || (inviteIsPreferred && !existingIsPreferred)) {
      byChildId.set(invite.childId, invite);
    }
  }

  return [...byChildId.values()];
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
    inviteCodes: DEFAULT_PARENT_INVITE_CODES,
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

export function normalizeParentInviteCodes(data) {
  const inviteCodes = Array.isArray(data.inviteCodes) ? data.inviteCodes : [];
  const existingCodes = new Set(inviteCodes.map((invite) => String(invite.code).toUpperCase()));
  const canonicalInvites = DEFAULT_PARENT_INVITE_CODES.filter(
    (invite) =>
      data.children.some((child) => child.id === invite.childId) &&
      !existingCodes.has(invite.code.toUpperCase())
  );
  const invitedChildIds = new Set([...inviteCodes, ...canonicalInvites].map((invite) => invite.childId));
  const generatedInvites = data.children
    .filter((child) => !invitedChildIds.has(child.id))
    .map((child) => ({
      code: makeUniqueInviteCode({ ...data, inviteCodes: [...inviteCodes, ...canonicalInvites] }, child),
      childId: child.id,
      label: `${child.name} 학부모 초대코드`,
      active: true,
      createdAt: toDateKey()
    }));

  const dedupedInvites = dedupeParentInviteCodes(data, [...inviteCodes, ...canonicalInvites, ...generatedInvites]);

  if (
    !canonicalInvites.length &&
    !generatedInvites.length &&
    Array.isArray(data.inviteCodes) &&
    dedupedInvites.length === data.inviteCodes.length
  ) {
    return data;
  }

  return {
    ...data,
    inviteCodes: dedupedInvites
  };
}

export function createParentInviteCode(data, user, childId) {
  if (!user || user.role !== ROLES.DIRECTOR) {
    throw new Error("원장만 초대코드를 생성할 수 있습니다.");
  }

  const child = getChild(data, childId);
  if (!child) {
    throw new Error("초대코드를 생성할 아이를 찾을 수 없습니다.");
  }

  const normalizedData = normalizeParentInviteCodes(data);
  const existingInvite = normalizedData.inviteCodes.find((invite) => invite.childId === child.id);
  if (existingInvite) {
    return normalizedData;
  }

  const invite = {
    code: makeUniqueInviteCode(normalizedData, child),
    childId: child.id,
    label: `${child.name} 학부모 초대코드`,
    active: true,
    createdAt: toDateKey()
  };

  return {
    ...normalizedData,
    inviteCodes: [invite, ...(normalizedData.inviteCodes ?? [])]
  };
}

export function registerChild(data, user, childInput = {}) {
  if (!user || user.role !== ROLES.DIRECTOR) {
    throw new Error("원장만 아이를 등록할 수 있습니다.");
  }

  const name = String(childInput.name ?? "").trim();
  if (!name) {
    throw new Error("아이 이름을 입력해주세요.");
  }

  const classId = String(childInput.classId ?? "").trim();
  if (!data.classes.some((classroom) => classroom.id === classId)) {
    throw new Error("등록할 반을 선택해주세요.");
  }

  const balance = Number(childInput.balance ?? 0);
  if (!Number.isFinite(balance) || balance < 0) {
    throw new Error("초기 잔액은 0원 이상 숫자로 입력해주세요.");
  }

  const child = {
    id: makeChildId(data),
    name,
    classId,
    birthMonth: String(childInput.birthMonth ?? "").trim(),
    parentUserIds: [],
    balance,
    openingBalance: balance,
    forest: {
      treeName: `${name}의 행복나무`,
      level: 1,
      seeds: 0,
      nextLevelSeeds: 10
    }
  };
  const invite = {
    code: makeUniqueInviteCode(data, child),
    childId: child.id,
    label: `${name} 학부모 초대코드`,
    active: true,
    createdAt: toDateKey()
  };

  return normalizeDailyMissions(
    normalizeStandardMissionTemplates({
      ...data,
      children: [...data.children, child],
      inviteCodes: [invite, ...(data.inviteCodes ?? [])]
    })
  );
}

export function signInParentWithInviteCode(data, inviteInput = {}) {
  const code = String(inviteInput.inviteCode ?? "")
    .trim()
    .toUpperCase();
  const inputName = String(inviteInput.parentName ?? "").trim();
  const invite = data.inviteCodes?.find((item) => item.active && item.code.toUpperCase() === code);

  if (!invite) {
    throw new Error("유효하지 않은 초대코드입니다.");
  }

  const child = getChild(data, invite.childId);
  if (!child) {
    throw new Error("초대코드에 연결된 아이를 찾을 수 없습니다.");
  }

  if (!inputName || inputName !== child.name) {
    throw new Error("학부모 이름과 초대코드가 일치하지 않습니다.");
  }

  const existingParent = data.users.find(
    (user) => user.role === ROLES.PARENT && Array.isArray(user.childIds) && user.childIds.includes(child.id)
  );

  if (existingParent) {
    return {
      data,
      user: existingParent,
      isNewUser: false
    };
  }

  const parentName = `${child.name} 학부모`;
  const user = {
    id: makeId("parent"),
    role: ROLES.PARENT,
    name: parentName,
    childIds: [child.id],
    inviteCode: invite.code,
    title: "학부모용",
    description: `${child.name} 어린이의 기록만 조회합니다.`
  };

  return {
    data: {
      ...data,
      users: [...data.users, user],
      children: data.children.map((item) =>
        item.id === child.id
          ? {
              ...item,
              parentUserIds: [...new Set([...(item.parentUserIds ?? []), user.id])]
            }
          : item
      ),
      inviteCodes: data.inviteCodes.map((item) =>
        item.code === invite.code
          ? {
              ...item,
              claimedBy: user.id
            }
          : item
      )
    },
    user,
    isNewUser: true
  };
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

export function canManageChild(user, child) {
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

export function createChecklistMission(data, user, missionInput, date = new Date()) {
  const childIds = Array.isArray(missionInput.childIds)
    ? missionInput.childIds
    : [missionInput.childId].filter(Boolean);
  const children = childIds.map((childId) => getChild(data, childId)).filter(Boolean);

  if (!children.length || children.some((child) => !canManageChild(user, child))) {
    throw new Error("자기 아이 또는 담당 반 아이에게만 미션을 추가할 수 있습니다.");
  }

  const title = String(missionInput.title ?? "").trim();
  if (!title) {
    throw new Error("미션명을 입력해주세요.");
  }

  const point = Number(missionInput.point);
  if (!Number.isFinite(point) || point <= 0) {
    throw new Error("금액은 1원 이상 숫자로 입력해주세요.");
  }

  const createdAt = toDateKey(date);
  const repeatDaily = missionInput.repeatDaily !== false && missionInput.repeatDaily !== "false";
  const groupId = makeId("mission-group");
  const templates = children.map((child) => ({
    id: makeId("mission-template"),
    groupId,
    title,
    point,
    targetType: "child",
    targetId: child.id,
    createdBy: user.id,
    creatorRole: user.role,
    createdAt,
    repeatDaily,
    active: true,
    checklist: true
  }));

  return normalizeDailyMissions(
    {
      ...data,
      missionTemplates: [...templates, ...data.missionTemplates]
    },
    date
  );
}

function getTemplateGroupId(template) {
  return template?.groupId ?? template?.id ?? null;
}

function getTemplateTargetChildIds(data, template) {
  if (!template) {
    return [];
  }

  return getMissionTemplateTargets(data, template);
}

function canManageTemplateTarget(data, user, template) {
  if (!user || !template) {
    return false;
  }

  if (user.role === ROLES.DIRECTOR) {
    return true;
  }

  const childIds = getTemplateTargetChildIds(data, template);
  return childIds.length > 0 && childIds.every((childId) => canManageChild(user, getChild(data, childId)));
}

export function getChecklistMissionGroup(data, missionOrTemplateId) {
  const mission = data.dailyMissions.find((item) => item.id === missionOrTemplateId);
  const templateId = mission?.templateId ?? missionOrTemplateId;
  const baseTemplate = data.missionTemplates.find((item) => item.id === templateId) ?? null;
  const groupId = getTemplateGroupId(baseTemplate);
  const templates = groupId
    ? data.missionTemplates.filter((template) => getTemplateGroupId(template) === groupId)
    : [];

  return {
    mission,
    baseTemplate,
    groupId,
    templates,
    activeTemplates: templates.filter((template) => template.active !== false),
    childIds: [
      ...new Set(
        templates
          .filter((template) => template.active !== false)
          .flatMap((template) => getTemplateTargetChildIds(data, template))
      )
    ]
  };
}

export function canManageChecklistMissionGroup(data, user, missionOrTemplateId) {
  const group = getChecklistMissionGroup(data, missionOrTemplateId);

  if (!group.baseTemplate || (!group.baseTemplate.standardKey && !group.baseTemplate.checklist)) {
    return false;
  }

  if (
    user?.role !== ROLES.DIRECTOR &&
    !group.baseTemplate.standardKey &&
    group.baseTemplate.createdBy !== user?.id
  ) {
    return false;
  }

  return group.activeTemplates.every((template) => canManageTemplateTarget(data, user, template));
}

export function updateChecklistMissionGroup(data, user, missionOrTemplateId, missionInput, date = new Date()) {
  const group = getChecklistMissionGroup(data, missionOrTemplateId);

  if (!canManageChecklistMissionGroup(data, user, missionOrTemplateId)) {
    throw new Error("이 미션을 수정할 권한이 없습니다.");
  }

  const title = String(missionInput.title ?? "").trim();
  if (!title) {
    throw new Error("미션명을 입력해주세요.");
  }

  const point = Number(missionInput.point);
  if (!Number.isFinite(point) || point <= 0) {
    throw new Error("금액은 1원 이상 숫자로 입력해주세요.");
  }

  const requestedChildIds = [...new Set(Array.isArray(missionInput.childIds) ? missionInput.childIds : [])];
  const requestedChildren = requestedChildIds.map((childId) => getChild(data, childId)).filter(Boolean);
  if (!requestedChildren.length || requestedChildren.some((child) => !canManageChild(user, child))) {
    throw new Error("자기 아이 또는 담당 반 아이에게만 미션을 배정할 수 있습니다.");
  }

  const repeatDaily = missionInput.repeatDaily !== false && missionInput.repeatDaily !== "false";
  const groupTemplateIds = new Set(group.templates.map((template) => template.id));
  const baseTargetChildIds = getTemplateTargetChildIds(data, group.baseTemplate);
  const keepsOriginalClassTarget =
    group.baseTemplate.targetType === "class" &&
    requestedChildIds.length === baseTargetChildIds.length &&
    requestedChildIds.every((childId) => baseTargetChildIds.includes(childId));

  if (keepsOriginalClassTarget) {
    const oldTitle = group.baseTemplate.title;
    const duplicateTitles = new Set([oldTitle, title]);

    return normalizeDailyMissions(
      {
        ...data,
        missionTemplates: data.missionTemplates.map((template) => {
          if (groupTemplateIds.has(template.id)) {
            return {
              ...template,
              title,
              point,
              repeatDaily,
              active: true
            };
          }

          const isStaleDuplicate =
            template.checklist &&
            template.targetType === "child" &&
            template.createdBy === group.baseTemplate.createdBy &&
            baseTargetChildIds.includes(template.targetId) &&
            duplicateTitles.has(template.title);

          return isStaleDuplicate
            ? {
                ...template,
                active: false
              }
            : template;
        })
      },
      date
    );
  }

  const existingByChildId = new Map(
    group.templates
      .filter((template) => template.targetType === "child")
      .map((template) => [template.targetId, template])
  );
  const requestedChildIdSet = new Set(requestedChildIds);
  const nextTemplates = data.missionTemplates.map((template) => {
    if (!groupTemplateIds.has(template.id)) {
      return template;
    }

    if (!requestedChildIdSet.has(template.targetId)) {
      return {
        ...template,
        active: false
      };
    }

    return {
      ...template,
      title,
      point,
      repeatDaily,
      active: true
    };
  });
  const createdAt = toDateKey(date);
  const newTemplates = requestedChildren
    .filter((child) => !existingByChildId.has(child.id))
    .map((child) => ({
      id: makeId("mission-template"),
      groupId: group.groupId,
      title,
      point,
      targetType: "child",
      targetId: child.id,
      createdBy: group.baseTemplate.createdBy,
      creatorRole: group.baseTemplate.creatorRole,
      createdAt,
      repeatDaily,
      active: true,
      checklist: true
    }));

  return normalizeDailyMissions(
    {
      ...data,
      missionTemplates: [...newTemplates, ...nextTemplates]
    },
    date
  );
}

export function deleteChecklistMissionGroup(data, user, missionOrTemplateId) {
  const group = getChecklistMissionGroup(data, missionOrTemplateId);

  if (!canManageChecklistMissionGroup(data, user, missionOrTemplateId)) {
    throw new Error("이 미션을 삭제할 권한이 없습니다.");
  }

  const groupTemplateIds = new Set(group.templates.map((template) => template.id));

  return {
    ...data,
    missionTemplates: data.missionTemplates.map((template) =>
      groupTemplateIds.has(template.id)
        ? {
            ...template,
            active: false
          }
        : template
    ),
    dailyMissions: data.dailyMissions.filter((mission) => !groupTemplateIds.has(mission.templateId))
  };
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
    .filter((mission) => standardKeys.has(mission.template.standardKey) || mission.template.checklist)
    .filter((mission) => childId === "all" || mission.childId === childId)
    .sort((a, b) => {
      const rawAIndex = STANDARD_MISSIONS.findIndex((mission) => mission.key === a.template.standardKey);
      const rawBIndex = STANDARD_MISSIONS.findIndex((mission) => mission.key === b.template.standardKey);
      const aIndex = rawAIndex === -1 ? Number.MAX_SAFE_INTEGER : rawAIndex;
      const bIndex = rawBIndex === -1 ? Number.MAX_SAFE_INTEGER : rawBIndex;
      if (a.child.name !== b.child.name) {
        return a.child.name.localeCompare(b.child.name, "ko");
      }
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return a.template.title.localeCompare(b.template.title, "ko");
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

  if (!child || !template || template.active === false || !classroom) {
    return null;
  }

  return {
    ...mission,
    child,
    template,
    classroom
  };
}

function getMissionCompletionSeed(point) {
  return Math.max(1, Math.round(point / 100));
}

function hasMissionTransaction(data, mission, template) {
  const point = template?.point ?? 0;

  return data.transactions.some(
    (transaction) =>
      transaction.missionId === mission.id ||
      (transaction.childId === mission.childId &&
        transaction.date === mission.date &&
        transaction.amount === point &&
        transaction.category === "미션" &&
        transaction.title === (template?.title ?? "미션 완료"))
  );
}

function createMissionTransaction(mission, template) {
  return {
    id: makeId("tx"),
    missionId: mission.id,
    templateId: mission.templateId,
    childId: mission.childId,
    date: mission.date,
    amount: template?.point ?? 0,
    title: template?.title ?? "미션 완료",
    category: "미션"
  };
}

function hasMissionGrowthRecord(data, mission, template) {
  return data.growthRecords.some(
    (record) =>
      record.missionId === mission.id ||
      (record.childId === mission.childId &&
        record.date === mission.date &&
        record.title === `미션 완료: ${template?.title ?? "미션"}`)
  );
}

function createMissionGrowthRecord(user, mission, template, child) {
  return {
    id: makeId("growth"),
    missionId: mission.id,
    templateId: mission.templateId,
    childId: mission.childId,
    date: mission.date,
    author: user?.name ?? "행복부자 통장",
    title: `미션 완료: ${template?.title ?? "미션"}`,
    note: `${child.name} 어린이가 '${template?.title ?? "미션"}' 미션을 완료했습니다.`,
    tags: ["미션", "자동기록"]
  };
}

function hasMissionForestMoment(data, mission, template) {
  return data.forestMoments.some(
    (moment) =>
      moment.missionId === mission.id ||
      (moment.childId === mission.childId &&
        moment.date === mission.date &&
        moment.title === "미션 씨앗" &&
        moment.note === `${template?.title ?? "미션"} 완료로 행복 씨앗을 모았습니다.`)
  );
}

function createMissionForestMoment(mission, template) {
  const point = template?.point ?? 0;

  return {
    id: makeId("forest"),
    missionId: mission.id,
    templateId: mission.templateId,
    childId: mission.childId,
    date: mission.date,
    seed: getMissionCompletionSeed(point),
    title: "미션 씨앗",
    note: `${template?.title ?? "미션"} 완료로 행복 씨앗을 모았습니다.`
  };
}

export function normalizeMissionCompletionArtifacts(data) {
  let transactions = data.transactions;
  let growthRecords = data.growthRecords;
  let forestMoments = data.forestMoments;
  let changed = false;

  for (const mission of data.dailyMissions) {
    if (!mission.completed) {
      continue;
    }

    const template = data.missionTemplates.find((item) => item.id === mission.templateId);
    const child = getChild(data, mission.childId);
    if (!template || !child) {
      continue;
    }

    const workingData = {
      ...data,
      transactions,
      growthRecords,
      forestMoments
    };

    if (!hasMissionTransaction(workingData, mission, template)) {
      transactions = [createMissionTransaction(mission, template), ...transactions];
      changed = true;
    }

    if (!hasMissionGrowthRecord(workingData, mission, template)) {
      growthRecords = [
        createMissionGrowthRecord(null, mission, template, child),
        ...growthRecords
      ];
      changed = true;
    }

    if (!hasMissionForestMoment(workingData, mission, template)) {
      forestMoments = [createMissionForestMoment(mission, template), ...forestMoments];
      changed = true;
    }
  }

  if (!changed) {
    return data;
  }

  return {
    ...data,
    transactions,
    growthRecords,
    forestMoments
  };
}

export function completeMission(data, user, missionId, date = new Date()) {
  const mission = data.dailyMissions.find((item) => item.id === missionId);
  const child = mission ? getChild(data, mission.childId) : null;

  if (!mission || !child) {
    throw new Error("미션을 찾을 수 없습니다.");
  }

  if (!canManageChild(user, child)) {
    throw new Error("자기 아이 또는 담당 반 아이의 미션만 완료 처리할 수 있습니다.");
  }

  const template = data.missionTemplates.find((item) => item.id === mission.templateId);
  const point = template?.point ?? 0;
  const dateKey = toDateKey(date);
  const completedMission = {
    ...mission,
    date: mission.date || dateKey,
    completed: true,
    completedAt: mission.completedAt ?? new Date().toISOString()
  };
  const transactionExists = hasMissionTransaction(data, completedMission, template);
  const growthRecordExists = hasMissionGrowthRecord(data, completedMission, template);
  const forestMomentExists = hasMissionForestMoment(data, completedMission, template);
  const shouldApplyMissionReward = !mission.completed;

  return {
    ...data,
    children: data.children.map((item) =>
      item.id === child.id
        ? {
            ...item,
            balance: shouldApplyMissionReward ? item.balance + point : item.balance,
            forest: {
              ...item.forest,
              seeds: shouldApplyMissionReward
                ? item.forest.seeds + getMissionCompletionSeed(point)
                : item.forest.seeds
            }
          }
        : item
    ),
    transactions: transactionExists
      ? data.transactions
      : [createMissionTransaction(completedMission, template), ...data.transactions],
    growthRecords: growthRecordExists
      ? data.growthRecords
      : [createMissionGrowthRecord(user, completedMission, template, child), ...data.growthRecords],
    forestMoments: forestMomentExists
      ? data.forestMoments
      : [createMissionForestMoment(completedMission, template), ...data.forestMoments],
    dailyMissions: data.dailyMissions.map((item) =>
      item.id === missionId
        ? completedMission
        : item
    )
  };
}

export function recordExpense(data, user, expenseInput, date = new Date()) {
  const child = getChild(data, expenseInput.childId);

  if (!canManageChild(user, child)) {
    throw new Error("자기 아이 또는 담당 반 아이의 지출만 입력할 수 있습니다.");
  }

  const title = String(expenseInput.title ?? "").trim();
  if (!title) {
    throw new Error("지출 내용을 입력해주세요.");
  }

  const amount = Number(expenseInput.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("지출 금액은 1원 이상 숫자로 입력해주세요.");
  }

  return {
    ...data,
    transactions: [
      {
        id: makeId("tx-expense"),
        childId: child.id,
        date: toDateKey(date),
        amount: -amount,
        title,
        category: "지출"
      },
      ...data.transactions
    ]
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
