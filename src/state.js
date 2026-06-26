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
  { key: "brush-teeth", title: "양치하기", point: 500 },
  { key: "cleanup", title: "정리정돈 잘하기", point: 500 },
  { key: "dress", title: "동화책읽기", point: 500 },
  { key: "help-friend", title: "친구 돕기", point: 500 }
];

export const GROWTH_STAGES = [
  { id: "seed", name: "🌱 씨앗", threshold: 0, phase: 1, description: "행복부자 여정을 시작했어요." },
  { id: "sprout", name: "🌿 새싹", threshold: 5000, phase: 1, description: "좋은 습관이 새싹처럼 올라와요." },
  { id: "young-tree", name: "🌳 어린나무", threshold: 10000, phase: 1, description: "스스로 해내는 힘이 자라고 있어요." },
  { id: "big-tree", name: "🌲 큰나무", threshold: 15000, phase: 1, description: "따뜻한 마음이 단단한 나무가 되었어요." },
  { id: "happy-rich", name: "🏆 행복부자", threshold: 20000, phase: 1, description: "행복을 나누는 멋진 부자가 되었어요." },
  {
    id: "future-bronze",
    name: "🥉 미래부자 브론즈",
    threshold: 30000,
    phase: 2,
    description: "새로운 목표를 향해 꾸준히 도전해요."
  },
  {
    id: "future-silver",
    name: "🥈 미래부자 실버",
    threshold: 40000,
    phase: 2,
    description: "좋은 습관이 은빛처럼 반짝여요."
  },
  {
    id: "future-gold",
    name: "🥇 미래부자 골드",
    threshold: 50000,
    phase: 2,
    description: "스스로 해내는 힘이 더 단단해졌어요."
  },
  {
    id: "future-diamond",
    name: "💎 미래부자 다이아몬드",
    threshold: 65000,
    phase: 2,
    description: "빛나는 마음으로 친구와 함께 성장해요."
  },
  {
    id: "future-master",
    name: "👑 미래부자 마스터",
    threshold: 80000,
    phase: 2,
    description: "꾸준함을 이끄는 멋진 리더가 되었어요."
  },
  {
    id: "forest-guardian",
    name: "🌳 행복숲 수호자",
    threshold: 100000,
    phase: 3,
    description: "행복숲을 지키는 따뜻한 마음이 자랐어요."
  },
  {
    id: "forest-leader",
    name: "🌲 행복숲 리더",
    threshold: 120000,
    phase: 3,
    description: "친구와 교실의 행복을 함께 이끌어요."
  },
  {
    id: "forest-captain",
    name: "🏆 행복숲 대장",
    threshold: 145000,
    phase: 3,
    description: "도전하는 마음이 행복숲을 크게 키워요."
  },
  {
    id: "forest-hero",
    name: "💎 행복숲 영웅",
    threshold: 170000,
    phase: 3,
    description: "선한 영향력이 보석처럼 빛나요."
  },
  {
    id: "forest-legend",
    name: "👑 행복숲 전설",
    threshold: 200000,
    phase: 3,
    description: "멋진 성장 이야기가 다음 도전으로 이어져요."
  }
];

const GROWTH_CYCLE_SIZE = GROWTH_STAGES.at(-1).threshold;

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

function slugifyClassName(name) {
  const ascii = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return ascii || `class-${Math.random().toString(36).slice(2, 8)}`;
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
  const byCode = new Map();

  for (const invite of inviteCodes) {
    const child = data.children.find((item) => item.id === invite.childId);
    if (!child) {
      continue;
    }

    const codeKey = String(invite.code).toUpperCase();
    if (!byCode.has(codeKey)) {
      byCode.set(codeKey, invite);
    }
  }

  const byChildId = new Map();
  for (const invite of byCode.values()) {
    const child = data.children.find((item) => item.id === invite.childId);
    const invites = byChildId.get(invite.childId) ?? [];
    invites.push(invite);
    byChildId.set(invite.childId, invites);
  }

  const deduped = [];
  for (const [childId, invites] of byChildId.entries()) {
    const child = data.children.find((item) => item.id === childId);
    const preferredCode = makeInviteCodeForChild(child).toUpperCase();
    const activeInvites = invites.filter((invite) => invite.active !== false);
    const preferredActiveInvite = activeInvites.find((invite) => String(invite.code).toUpperCase() === preferredCode);
    const activeInvite = preferredActiveInvite ?? activeInvites[0] ?? null;

    for (const invite of invites) {
      if (activeInvite && invite.code === activeInvite.code) {
        deduped.push({
          ...invite,
          active: true
        });
        continue;
      }

      deduped.push({
        ...invite,
        active: false
      });
    }
  }

  return deduped;
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

export function createClassroom(data, user, classInput = {}) {
  if (!user || user.role !== ROLES.DIRECTOR) {
    throw new Error("원장만 반을 추가할 수 있습니다.");
  }

  const name = String(classInput.name ?? "").trim();
  if (!name) {
    throw new Error("반 이름을 입력해주세요.");
  }

  const existingNames = new Set(data.classes.map((classroom) => classroom.name));
  if (existingNames.has(name)) {
    throw new Error("이미 등록된 반 이름입니다.");
  }

  const existingIds = new Set(data.classes.map((classroom) => classroom.id));
  const baseId = slugifyClassName(name);
  let id = baseId;
  let suffix = 2;

  while (existingIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return normalizeDailyMissions(
    normalizeStandardMissionTemplates({
      ...data,
      classes: [
        ...data.classes,
        {
          id,
          name,
          teacherId: `teacher-${id}`,
          color: classInput.color ?? "#9ad95f"
        }
      ],
      users: [
        ...data.users,
        {
          id: `teacher-${id}`,
          role: ROLES.TEACHER,
          name: `${name} 선생님`,
          classId: id,
          title: "교사용",
          description: `${name} 아이만 조회하고 미션을 생성합니다.`
        }
      ]
    })
  );
}

export function updateClassroom(data, user, classId, classInput = {}) {
  if (!user || user.role !== ROLES.DIRECTOR) {
    throw new Error("원장만 반을 수정할 수 있습니다.");
  }

  const name = String(classInput.name ?? "").trim();
  if (!name) {
    throw new Error("반 이름을 입력해주세요.");
  }

  if (data.classes.some((classroom) => classroom.id !== classId && classroom.name === name)) {
    throw new Error("이미 등록된 반 이름입니다.");
  }

  return {
    ...data,
    classes: data.classes.map((classroom) =>
      classroom.id === classId
        ? {
            ...classroom,
            name
          }
        : classroom
    ),
    users: data.users.map((item) =>
      item.role === ROLES.TEACHER && item.classId === classId
        ? {
            ...item,
            name: `${name} 선생님`,
            description: `${name} 아이만 조회하고 미션을 생성합니다.`
          }
        : item
    )
  };
}

export function inviteTeacherToClass(data, user, teacherInput = {}) {
  if (!user || user.role !== ROLES.DIRECTOR) {
    throw new Error("원장만 교사를 초대할 수 있습니다.");
  }

  const name = String(teacherInput.name ?? "").trim();
  if (!name) {
    throw new Error("교사 이름을 입력해주세요.");
  }

  const classId = String(teacherInput.classId ?? "").trim();
  const classroom = getClass(data, classId);
  if (!classroom) {
    throw new Error("교사를 배정할 반을 선택해주세요.");
  }

  const existingTeacher = data.users.find((item) => item.role === ROLES.TEACHER && item.classId === classId);
  const existingUserIds = new Set(data.users.map((item) => item.id));
  let teacherId = existingTeacher?.id ?? `teacher-${classId}`;
  let suffix = 2;
  while (!existingTeacher && existingUserIds.has(teacherId)) {
    teacherId = `teacher-${classId}-${suffix}`;
    suffix += 1;
  }

  const teacher = {
    id: teacherId,
    role: ROLES.TEACHER,
    name,
    classId,
    title: "교사용",
    description: `${classroom.name} 아이만 조회하고 미션을 생성합니다.`,
    invitedAt: toDateKey(),
    invitedBy: user.id
  };

  return {
    ...data,
    classes: data.classes.map((item) =>
      item.id === classId
        ? {
            ...item,
            teacherId
          }
        : item
    ),
    users: existingTeacher
      ? data.users.map((item) => (item.id === existingTeacher.id ? { ...item, ...teacher } : item))
      : [...data.users, teacher]
  };
}

export function deleteClassroom(data, user, classId) {
  if (!user || user.role !== ROLES.DIRECTOR) {
    throw new Error("원장만 반을 삭제할 수 있습니다.");
  }

  if (data.children.some((child) => child.classId === classId)) {
    throw new Error("아이들이 등록된 반은 삭제할 수 없습니다.");
  }

  const teacherIds = new Set(
    data.users.filter((item) => item.role === ROLES.TEACHER && item.classId === classId).map((item) => item.id)
  );

  return {
    ...data,
    classes: data.classes.filter((classroom) => classroom.id !== classId),
    users: data.users.filter((item) => !teacherIds.has(item.id)),
    missionTemplates: data.missionTemplates.map((template) =>
      template.targetType === "class" && template.targetId === classId
        ? {
            ...template,
            active: false
          }
        : template
    )
  };
}

export function getChild(data, childId) {
  return data.children.find((child) => child.id === childId) ?? null;
}

export function normalizeParentInviteCodes(data) {
  const inviteCodes = Array.isArray(data.inviteCodes) ? data.inviteCodes : [];
  const existingCodes = new Set(inviteCodes.map((invite) => String(invite.code).toUpperCase()));
  const activeChildIds = new Set(inviteCodes.filter((invite) => invite.active !== false).map((invite) => invite.childId));
  const canonicalInvites = DEFAULT_PARENT_INVITE_CODES.filter(
    (invite) =>
      data.children.some((child) => child.id === invite.childId) &&
      !activeChildIds.has(invite.childId) &&
      !existingCodes.has(invite.code.toUpperCase())
  );
  const invitedChildIds = new Set([
    ...inviteCodes.filter((invite) => invite.active !== false),
    ...canonicalInvites
  ].map((invite) => invite.childId));
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
  const inviteCodesUnchanged =
    Array.isArray(data.inviteCodes) &&
    dedupedInvites.length === data.inviteCodes.length &&
    dedupedInvites.every(
      (invite, index) =>
        invite.code === data.inviteCodes[index]?.code &&
        invite.childId === data.inviteCodes[index]?.childId &&
        invite.active === data.inviteCodes[index]?.active
    );

  if (
    !canonicalInvites.length &&
    !generatedInvites.length &&
    inviteCodesUnchanged
  ) {
    return data;
  }

  return {
    ...data,
    inviteCodes: dedupedInvites
  };
}

export function createParentInviteCode(data, user, childId, options = {}) {
  if (!user || ![ROLES.DIRECTOR, ROLES.TEACHER].includes(user.role)) {
    throw new Error("원장 또는 교사만 초대코드를 생성할 수 있습니다.");
  }

  const child = getChild(data, childId);
  if (!child) {
    throw new Error("초대코드를 생성할 아이를 찾을 수 없습니다.");
  }

  if (!canManageChild(user, child)) {
    throw new Error("담당 반 아이의 초대코드만 관리할 수 있습니다.");
  }

  if (options.reissue && user.role !== ROLES.DIRECTOR) {
    throw new Error("초대코드 재발급은 원장만 할 수 있습니다.");
  }

  const normalizedData = normalizeParentInviteCodes(data);
  const existingInvite = normalizedData.inviteCodes.find((invite) => invite.childId === child.id && invite.active !== false);
  if (existingInvite && !options.reissue) {
    return normalizedData;
  }

  const nextData = options.reissue
    ? {
        ...normalizedData,
        inviteCodes: (normalizedData.inviteCodes ?? []).map((invite) =>
          invite.childId === child.id && invite.active !== false
            ? {
                ...invite,
                active: false,
                invalidatedAt: toDateKey(),
                invalidatedBy: user.id
              }
            : invite
        )
      }
    : normalizedData;

  const invite = {
    code: makeUniqueInviteCode(nextData, child),
    childId: child.id,
    label: `${child.name} 학부모 초대코드`,
    active: true,
    createdAt: toDateKey(),
    createdBy: user.id
  };

  return {
    ...nextData,
    inviteCodes: [invite, ...(nextData.inviteCodes ?? [])]
  };
}

export function registerChild(data, user, childInput = {}) {
  if (!user || ![ROLES.DIRECTOR, ROLES.TEACHER].includes(user.role)) {
    throw new Error("원장 또는 교사만 아이를 등록할 수 있습니다.");
  }

  const name = String(childInput.name ?? "").trim();
  if (!name) {
    throw new Error("아이 이름을 입력해주세요.");
  }

  const classId = user.role === ROLES.TEACHER ? String(user.classId ?? "").trim() : String(childInput.classId ?? "").trim();
  if (!data.classes.some((classroom) => classroom.id === classId)) {
    throw new Error(user.role === ROLES.TEACHER ? "담당 반을 찾을 수 없습니다." : "등록할 반을 선택해주세요.");
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

export function updateChild(data, user, childId, childInput = {}) {
  if (!user || ![ROLES.DIRECTOR, ROLES.TEACHER].includes(user.role)) {
    throw new Error("원장 또는 교사만 아이 이름을 수정할 수 있습니다.");
  }

  const child = getChild(data, childId);
  if (!child || !canManageChild(user, child)) {
    throw new Error("담당 반 아이만 수정할 수 있습니다.");
  }

  const name = String(childInput.name ?? "").trim();
  if (!name) {
    throw new Error("아이 이름을 입력해주세요.");
  }

  const previousDefaultTreeName = `${child.name}의 행복나무`;
  const nextDefaultTreeName = `${name}의 행복나무`;

  return {
    ...data,
    children: data.children.map((item) =>
      item.id === child.id
        ? {
            ...item,
            name,
            forest: {
              ...item.forest,
              treeName: item.forest?.treeName === previousDefaultTreeName ? nextDefaultTreeName : item.forest?.treeName
            }
          }
        : item
    ),
    inviteCodes: (data.inviteCodes ?? []).map((invite) =>
      invite.childId === child.id
        ? {
            ...invite,
            label: `${name} 학부모 초대코드`
          }
        : invite
    )
  };
}

export function deleteChild(data, user, childId) {
  if (!user || ![ROLES.DIRECTOR, ROLES.TEACHER].includes(user.role)) {
    throw new Error("원장 또는 교사만 아이를 삭제할 수 있습니다.");
  }

  const child = getChild(data, childId);
  if (!child || !canManageChild(user, child)) {
    throw new Error("담당 반 아이만 삭제할 수 있습니다.");
  }

  const linkedParentIds = new Set([
    ...(child.parentUserIds ?? []),
    ...data.users
      .filter((item) => item.role === ROLES.PARENT && Array.isArray(item.childIds) && item.childIds.includes(child.id))
      .map((item) => item.id)
  ]);

  return {
    ...data,
    children: data.children.filter((item) => item.id !== child.id),
    users: data.users
      .map((item) => {
        if (!linkedParentIds.has(item.id) || item.role !== ROLES.PARENT) {
          return item;
        }

        return {
          ...item,
          childIds: (item.childIds ?? []).filter((id) => id !== child.id)
        };
      })
      .filter((item) => item.role !== ROLES.PARENT || (item.childIds ?? []).length > 0),
    inviteCodes: (data.inviteCodes ?? []).filter((invite) => invite.childId !== child.id),
    transactions: data.transactions.filter((transaction) => transaction.childId !== child.id),
    growthRecords: data.growthRecords.filter((record) => record.childId !== child.id),
    forestMoments: data.forestMoments.filter((moment) => moment.childId !== child.id),
    dailyMissions: data.dailyMissions.filter((mission) => mission.childId !== child.id),
    missionTemplates: data.missionTemplates.map((template) =>
      template.targetType === "child" && template.targetId === child.id
        ? {
            ...template,
            active: false
          }
        : template
    )
  };
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

  if (inputName && inputName !== child.name) {
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

  return normalizeDailyMissionUniqueness({
    ...data,
    dailyMissions: [...data.dailyMissions, ...generated],
    lastMissionDate: dateKey
  });
}

export function normalizeStandardMissionTemplates(data, date = new Date()) {
  const dateKey = toDateKey(date);
  const standardByKey = new Map(STANDARD_MISSIONS.map((mission) => [mission.key, mission]));
  const usedIds = new Set(data.missionTemplates.map((template) => template.id));
  let templatesChanged = false;
  const normalizedTemplates = data.missionTemplates.map((template) => {
    if (!template.standardKey) {
      return template;
    }

    const standard = standardByKey.get(template.standardKey);
    if (!standard) {
      templatesChanged = true;
      return {
        ...template,
        standardKey: undefined,
        checklist: true
      };
    }

    const isCanonical = normalizeMissionTitle(template.title) === normalizeMissionTitle(standard.title);
    const shouldCoerceToCanonical = ["cleanup", "dress"].includes(template.standardKey);

    if (isCanonical || shouldCoerceToCanonical) {
      if (template.title !== standard.title || template.point !== standard.point || !template.checklist) {
        templatesChanged = true;
      }
      return {
        ...template,
        title: standard.title,
        point: standard.point,
        checklist: true,
        active: template.active !== false
      };
    }

    templatesChanged = true;
    return {
      ...template,
      standardKey: undefined,
      checklist: true
    };
  });
  const existingKeys = new Set(
    normalizedTemplates
      .filter((template) => template.standardKey)
      .map((template) => `${template.standardKey}:${template.targetId}`)
  );
  const generatedTemplates = [];

  for (const classroom of data.classes) {
    for (const mission of STANDARD_MISSIONS) {
      const key = `${mission.key}:${classroom.id}`;
      if (existingKeys.has(key)) {
        continue;
      }

      existingKeys.add(key);
      const preferredId = `standard-${classroom.id}-${mission.key}`;
      let templateId = preferredId;
      let suffix = 2;
      while (usedIds.has(templateId)) {
        templateId = `${preferredId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(templateId);
      generatedTemplates.push({
        id: templateId,
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

  if (!generatedTemplates.length && !templatesChanged) {
    return data;
  }

  return {
    ...data,
    missionTemplates: [...generatedTemplates, ...normalizedTemplates]
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
  const transaction = data.transactions.find((item) => item.missionId === mission.id) ?? null;

  if (!child || !template || (template.active === false && !mission.completed) || !classroom) {
    return null;
  }

  return {
    ...mission,
    child,
    template,
    displayTitle: transaction?.title ?? template.title,
    displayPoint: transaction?.amount ?? template.point,
    transaction,
    classroom
  };
}

function normalizeMissionTitle(title = "") {
  return String(title).replace(/\s+/g, "").trim();
}

function getMissionDisplayTitleForKey(data, mission) {
  const transaction = data.transactions.find((item) => item.missionId === mission.id);
  const template = data.missionTemplates.find((item) => item.id === mission.templateId);

  return transaction?.title ?? template?.title ?? mission.templateId;
}

function getMissionUniqueKey(data, mission) {
  return [
    mission.childId,
    mission.date,
    normalizeMissionTitle(getMissionDisplayTitleForKey(data, mission))
  ].join("::");
}

function scoreMissionForDedupe(data, mission) {
  const hasTransaction = data.transactions.some((item) => item.missionId === mission.id);
  const template = data.missionTemplates.find((item) => item.id === mission.templateId);
  const templateActive = template?.active !== false;

  return Number(Boolean(mission.completed)) * 100 + Number(hasTransaction) * 10 + Number(templateActive);
}

export function normalizeDailyMissionUniqueness(data) {
  const byKey = new Map();
  const removedMissionIds = new Set();

  for (const mission of data.dailyMissions) {
    const key = getMissionUniqueKey(data, mission);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, mission);
      continue;
    }

    const existingScore = scoreMissionForDedupe(data, existing);
    const missionScore = scoreMissionForDedupe(data, mission);
    const winner = missionScore > existingScore ? mission : existing;
    const loser = winner === mission ? existing : mission;
    const mergedWinner = {
      ...winner,
      completed: Boolean(existing.completed || mission.completed),
      completedAt: winner.completedAt ?? existing.completedAt ?? mission.completedAt ?? null
    };

    byKey.set(key, mergedWinner);
    removedMissionIds.add(loser.id);
  }

  if (!removedMissionIds.size) {
    return data;
  }

  return {
    ...data,
    dailyMissions: [...byKey.values()],
    transactions: data.transactions.filter((transaction) => !removedMissionIds.has(transaction.missionId)),
    growthRecords: data.growthRecords.filter((record) => !removedMissionIds.has(record.missionId)),
    forestMoments: data.forestMoments.filter((moment) => !removedMissionIds.has(moment.missionId))
  };
}

export function normalizeMissionTransactionUniqueness(data) {
  const seen = new Set();
  let changed = false;
  const transactions = data.transactions.filter((transaction) => {
    if (transaction.category !== "미션") {
      return true;
    }

    const key = [
      transaction.childId,
      transaction.date,
      normalizeMissionTitle(transaction.title)
    ].join("::");

    if (seen.has(key)) {
      changed = true;
      return false;
    }

    seen.add(key);
    return true;
  });

  return changed ? { ...data, transactions } : data;
}

function isChecklistTemplate(template) {
  return Boolean(template?.standardKey || template?.checklist);
}

function ensureLedgerTemplateForTransaction(missionTemplates, transaction, dateKey) {
  const existing = missionTemplates.find((template) => template.id === transaction.templateId);

  if (existing) {
    return {
      missionTemplates,
      templateId: existing.id
    };
  }

  const templateId = transaction.templateId || `ledger-template-${transaction.id || makeId("ledger")}`;
  const template = {
    id: templateId,
    title: transaction.title,
    point: Number(transaction.amount ?? 0),
    targetType: "child",
    targetId: transaction.childId,
    createdBy: "ledger",
    creatorRole: "ledger",
    createdAt: dateKey,
    repeatDaily: false,
    active: true,
    checklist: true
  };

  return {
    missionTemplates: [template, ...missionTemplates],
    templateId
  };
}

export function normalizeTodayMissionLedgerConsistency(data, date = new Date()) {
  const dateKey = toDateKey(date);
  let missionTemplates = data.missionTemplates;
  let transactions = data.transactions;
  let dailyMissions = data.dailyMissions;
  const keepMissionIds = new Set();
  const todayMissionDeposits = transactions.filter(
    (transaction) =>
      transaction.date === dateKey &&
      transaction.category === "미션" &&
      Number(transaction.amount) > 0
  );

  for (const transaction of todayMissionDeposits) {
    const normalizedTitle = normalizeMissionTitle(transaction.title);
    let mission =
      dailyMissions.find((item) => item.id === transaction.missionId) ??
      dailyMissions.find(
        (item) =>
          item.childId === transaction.childId &&
          item.date === dateKey &&
          normalizeMissionTitle(getMissionDisplayTitleForKey({ ...data, transactions, missionTemplates }, item)) ===
            normalizedTitle
      );

    if (!mission) {
      const ensured = ensureLedgerTemplateForTransaction(missionTemplates, transaction, dateKey);
      missionTemplates = ensured.missionTemplates;
      mission = {
        id: transaction.missionId || makeId("daily-mission"),
        templateId: ensured.templateId,
        childId: transaction.childId,
        date: dateKey,
        completed: true,
        completedAt: new Date().toISOString()
      };
      dailyMissions = [mission, ...dailyMissions];
    }

    keepMissionIds.add(mission.id);
    transactions = transactions.map((item) =>
      item.id === transaction.id
        ? {
            ...item,
            missionId: mission.id,
            templateId: mission.templateId
          }
        : item
    );
    dailyMissions = dailyMissions.map((item) =>
      item.id === mission.id
        ? {
            ...item,
            completed: true,
            completedAt: item.completedAt ?? new Date().toISOString()
          }
        : item
    );
  }

  const depositTitleByChild = new Map();
  for (const transaction of todayMissionDeposits) {
    const titles = depositTitleByChild.get(transaction.childId) ?? new Set();
    titles.add(normalizeMissionTitle(transaction.title));
    depositTitleByChild.set(transaction.childId, titles);
  }

  for (const mission of dailyMissions) {
    if (mission.date !== dateKey || keepMissionIds.has(mission.id)) {
      continue;
    }

    const template = missionTemplates.find((item) => item.id === mission.templateId);
    if (!isChecklistTemplate(template) || template.active === false) {
      continue;
    }

    const depositedTitles = depositTitleByChild.get(mission.childId) ?? new Set();
    const title = normalizeMissionTitle(template.title);
    const isUncompletedDefault = Boolean(template.standardKey) && !depositedTitles.has(title);
    const isTodayCustom = Boolean(template.checklist) && template.createdAt === dateKey && !depositedTitles.has(title);

    if (isUncompletedDefault || isTodayCustom) {
      keepMissionIds.add(mission.id);
    }
  }

  const cleanedDailyMissions = dailyMissions.filter((mission) => {
    if (mission.date !== dateKey) {
      return true;
    }

    const template = missionTemplates.find((item) => item.id === mission.templateId);
    if (!isChecklistTemplate(template)) {
      return true;
    }

    return keepMissionIds.has(mission.id);
  });

  if (
    cleanedDailyMissions.length === data.dailyMissions.length &&
    missionTemplates === data.missionTemplates &&
    transactions === data.transactions
  ) {
    return data;
  }

  return {
    ...data,
    missionTemplates,
    dailyMissions: cleanedDailyMissions,
    transactions
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

export function normalizeMissionIntegrity(data, date = new Date()) {
  return normalizeMissionTransactionUniqueness(
    normalizeTodayMissionLedgerConsistency(
      normalizeMissionCompletionArtifacts(normalizeDailyMissionUniqueness(data)),
      date
    )
  );
}

export function cleanupTodayMissionData(data, date = new Date()) {
  const dateKey = toDateKey(date);
  const standardByKey = new Map(STANDARD_MISSIONS.map((mission) => [mission.key, mission]));
  const standardTitleSet = new Set(STANDARD_MISSIONS.map((mission) => normalizeMissionTitle(mission.title)));
  const normalizedBase = normalizeDailyMissions(normalizeStandardMissionTemplates(data, date), date);
  const missionTemplates = normalizedBase.missionTemplates.map((template) => {
    const standard = standardByKey.get(template.standardKey);

    if (standard) {
      return {
        ...template,
        title: standard.title,
        point: standard.point,
        repeatDaily: true,
        active: true
      };
    }

    return {
      ...template,
      active: false
    };
  });
  const templateById = new Map(missionTemplates.map((template) => [template.id, template]));
  const removedMissionIds = new Set();
  const keptMissionByChildAndTitle = new Map();

  for (const mission of normalizedBase.dailyMissions.filter((item) => item.date === dateKey)) {
    const template = templateById.get(mission.templateId);
    const standard = standardByKey.get(template?.standardKey);

    if (!standard) {
      removedMissionIds.add(mission.id);
      continue;
    }

    const key = `${mission.childId}::${normalizeMissionTitle(standard.title)}`;
    const existing = keptMissionByChildAndTitle.get(key);
    const missionHasDeposit = normalizedBase.transactions.some((transaction) => transaction.missionId === mission.id);
    const existingHasDeposit = existing
      ? normalizedBase.transactions.some((transaction) => transaction.missionId === existing.id)
      : false;
    const shouldReplace =
      !existing ||
      Number(Boolean(mission.completed)) * 10 + Number(missionHasDeposit) >
        Number(Boolean(existing.completed)) * 10 + Number(existingHasDeposit);

    if (shouldReplace) {
      if (existing) {
        removedMissionIds.add(existing.id);
      }
      keptMissionByChildAndTitle.set(key, {
        ...mission,
        completed: Boolean(mission.completed || missionHasDeposit),
        completedAt: mission.completedAt ?? null
      });
    } else {
      removedMissionIds.add(mission.id);
    }
  }

  const generatedStandardMissions = [];
  for (const child of normalizedBase.children) {
    for (const standard of STANDARD_MISSIONS) {
      const key = `${child.id}::${normalizeMissionTitle(standard.title)}`;
      if (keptMissionByChildAndTitle.has(key)) {
        continue;
      }

      const template = missionTemplates.find(
        (item) => item.standardKey === standard.key && item.targetType === "class" && item.targetId === child.classId
      );

      if (!template) {
        continue;
      }

      generatedStandardMissions.push({
        id: makeId("daily-mission"),
        templateId: template.id,
        childId: child.id,
        date: dateKey,
        completed: false,
        completedAt: null
      });
    }
  }

  const keptTodayMissions = [...keptMissionByChildAndTitle.values(), ...generatedStandardMissions];
  const todayMissionByChildAndTitle = new Map(
    keptTodayMissions.map((mission) => {
      const template = templateById.get(mission.templateId);
      return [`${mission.childId}::${normalizeMissionTitle(template?.title)}`, mission];
    })
  );
  const seenDepositKeys = new Set();
  const transactions = normalizedBase.transactions
    .filter((transaction) => !removedMissionIds.has(transaction.missionId))
    .filter((transaction) => {
      if (transaction.date !== dateKey || transaction.category !== "미션") {
        return true;
      }

      const title = normalizeMissionTitle(transaction.title);
      if (!standardTitleSet.has(title)) {
        return false;
      }

      const key = `${transaction.childId}::${title}`;
      if (seenDepositKeys.has(key)) {
        return false;
      }

      seenDepositKeys.add(key);
      return true;
    })
    .map((transaction) => {
      if (transaction.date !== dateKey || transaction.category !== "미션") {
        return transaction;
      }

      const mission = todayMissionByChildAndTitle.get(`${transaction.childId}::${normalizeMissionTitle(transaction.title)}`);
      const template = mission ? templateById.get(mission.templateId) : null;

      return mission && template
        ? {
            ...transaction,
            missionId: mission.id,
            templateId: mission.templateId,
            title: template.title,
            amount: template.point
          }
        : transaction;
    });
  const depositKeys = new Set(
    transactions
      .filter((transaction) => transaction.date === dateKey && transaction.category === "미션")
      .map((transaction) => `${transaction.childId}::${normalizeMissionTitle(transaction.title)}`)
  );
  const dailyMissions = [
    ...normalizedBase.dailyMissions.filter((mission) => mission.date !== dateKey),
    ...keptTodayMissions.map((mission) => {
      const template = templateById.get(mission.templateId);
      const key = `${mission.childId}::${normalizeMissionTitle(template?.title)}`;
      const completed = depositKeys.has(key) || Boolean(mission.completed);

      return {
        ...mission,
        completed,
        completedAt: completed ? mission.completedAt ?? new Date().toISOString() : null
      };
    })
  ];
  const cleaned = {
    ...normalizedBase,
    missionTemplates,
    dailyMissions,
    transactions,
    growthRecords: normalizedBase.growthRecords.filter((record) => !removedMissionIds.has(record.missionId)),
    forestMoments: normalizedBase.forestMoments.filter((moment) => !removedMissionIds.has(moment.missionId))
  };

  return normalizeMissionIntegrity(cleaned, date);
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

  return normalizeMissionIntegrity({
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
  });
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
  const cycleIndex = Math.floor(balance / GROWTH_CYCLE_SIZE);
  const cycleOffset = cycleIndex * GROWTH_CYCLE_SIZE;
  const nextCycleOffset = (cycleIndex + 1) * GROWTH_CYCLE_SIZE;
  const stages = GROWTH_STAGES.map((stage) => ({
    ...stage,
    id: cycleIndex ? `${stage.id}-cycle-${cycleIndex + 1}` : stage.id,
    baseId: stage.id,
    phase: stage.phase + cycleIndex * 3,
    threshold: cycleOffset + stage.threshold,
    achieved: balance >= cycleOffset + stage.threshold,
    remaining: Math.max(0, cycleOffset + stage.threshold - balance)
  }));
  const achievedStages = stages.filter((stage) => stage.achieved);
  const currentStage = achievedStages.at(-1) ?? stages[0];
  const nextStage =
    stages.find((stage) => !stage.achieved) ?? {
      ...GROWTH_STAGES[1],
      id: `${GROWTH_STAGES[1].id}-cycle-${cycleIndex + 2}`,
      baseId: GROWTH_STAGES[1].id,
      phase: GROWTH_STAGES[1].phase + (cycleIndex + 1) * 3,
      threshold: nextCycleOffset + GROWTH_STAGES[1].threshold,
      achieved: false,
      remaining: nextCycleOffset + GROWTH_STAGES[1].threshold - balance
    };
  const previousThreshold = currentStage?.threshold ?? 0;
  const nextThreshold = nextStage.threshold;
  const requiredToNext = Math.max(0, nextStage.threshold - balance);
  const range = Math.max(1, nextThreshold - previousThreshold);
  const progressPercent = Math.min(100, Math.max(0, Math.round(((balance - previousThreshold) / range) * 100)));
  const completedStageCount = cycleIndex * GROWTH_STAGES.length + achievedStages.length;

  return {
    balance,
    cycle: cycleIndex + 1,
    stages,
    currentStage,
    nextStage,
    requiredToNext,
    progressPercent,
    completedStageCount,
    totalStageCount: "∞",
    celebrationMessage: `${currentStage.name}까지 성장했어요! 다음 목표도 계속 도전해요.`
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
