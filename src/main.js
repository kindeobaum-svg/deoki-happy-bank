import {
  ROLE_LABELS,
  ROLES,
  SESSION_KEY,
  STORAGE_KEY,
  canManageChecklistMissionGroup,
  completeMission,
  createChecklistMission,
  createInitialData,
  createParentInviteCode,
  deleteChecklistMissionGroup,
  getChildAccountBalance,
  getChecklistMissionGroup,
  getClass,
  getVisibleChecklistMissions,
  getDefaultChildId,
  getUser,
  getVisibleChildren,
  getVisibleClasses,
  getVisibleDailyMissions,
  getVisibleForestMoments,
  getVisibleGrowthProgress,
  getVisibleGrowthRecords,
  getVisibleMissionHistory,
  getVisibleAccountSummary,
  getVisibleTransactions,
  normalizeBankAccounts,
  normalizeDailyMissions,
  normalizeMissionCompletionArtifacts,
  normalizeParentInviteCodes,
  normalizeStandardMissionTemplates,
  registerChild,
  recordExpense,
  signInParentWithInviteCode,
  toDateKey,
  updateChecklistMissionGroup
} from "./state.js";

const app = document.querySelector("#app");

const tabs = [
  { id: "home", label: "홈", icon: "🏠" },
  { id: "bank", label: "통장", icon: "💰" },
  { id: "forest", label: "행복숲", icon: "🌳" },
  { id: "growth", label: "성장", icon: "🌱" },
  { id: "missions", label: "미션", icon: "✅" }
];

let state = normalizeBankAccounts(
  normalizeMissionCompletionArtifacts(
    normalizeDailyMissions(
      normalizeStandardMissionTemplates(normalizeParentInviteCodes(loadState()), new Date()),
      new Date()
    )
  )
);
let session = loadSession();
let toastMessage = "";

applyPreviewLoginFromUrl();
saveState(state);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : createInitialData();
  } catch (error) {
    console.warn("저장된 데이터를 불러오지 못해 초기 데이터로 시작합니다.", error);
    return createInitialData();
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          userId: null,
          tab: "home",
          selectedChildId: "all",
          detailScreen: null,
          editMissionId: null
        };
  } catch (error) {
    console.warn("세션을 불러오지 못해 초기화합니다.", error);
    return { userId: null, tab: "home", selectedChildId: "all", detailScreen: null, editMissionId: null };
  }
}

function applyPreviewLoginFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const login = params.get("login");

  if (!login) {
    return;
  }

  const previewUserId =
    {
      director: "director-1",
      principal: "director-1",
      teacher: "teacher-sun"
    }[login] ?? login;
  const user = getUser(state, previewUserId);

  if (!user) {
    return;
  }

  session = {
    userId: user.id,
    tab: "home",
    selectedChildId: user.role === ROLES.PARENT ? getDefaultChildId(state, user) : "all",
    detailScreen: null,
    editMissionId: null
  };
  saveSession(session);
}

function saveState(nextState = state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function saveSession(nextSession = session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
}

function setToast(message) {
  toastMessage = message;
  window.clearTimeout(setToast.timer);
  setToast.timer = window.setTimeout(() => {
    toastMessage = "";
    render();
  }, 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return `${Number(value).toLocaleString("ko-KR")} 행복`;
}

function formatWon(value) {
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function getCurrentUser() {
  return getUser(state, session.userId);
}

function ensureAllowedSelection(user) {
  const visibleChildren = getVisibleChildren(state, user);
  const visibleIds = new Set(visibleChildren.map((child) => child.id));

  if (!user) {
    return;
  }

  if (user.role === ROLES.PARENT && !visibleIds.has(session.selectedChildId)) {
    session.selectedChildId = getDefaultChildId(state, user);
  }

  if (
    session.selectedChildId !== "all" &&
    session.selectedChildId &&
    !visibleIds.has(session.selectedChildId)
  ) {
    session.selectedChildId = user.role === ROLES.PARENT ? getDefaultChildId(state, user) : "all";
  }

  if (!tabs.some((tab) => tab.id === session.tab)) {
    session.tab = "home";
  }

  if (
    session.detailScreen?.childId &&
    session.detailScreen.childId !== "all" &&
    !visibleIds.has(session.detailScreen.childId)
  ) {
    session.detailScreen = null;
  }

  saveSession();
}

function render() {
  const user = getCurrentUser();
  ensureAllowedSelection(user);

  if (!user) {
    app.innerHTML = renderLogin();
    return;
  }

  app.innerHTML = renderShell(user);
}

function renderLogin() {
  const roleGroups = [
    { role: ROLES.DIRECTOR, title: "원장용 화면" },
    { role: ROLES.TEACHER, title: "교사용 화면" }
  ];

  return `
    <section class="login-screen">
      <div class="brand-card">
        <span class="brand-mark">덕</span>
        <div>
          <p class="eyebrow">덕이킨더바움</p>
          <h1>행복부자 통장</h1>
          <p>행복숲, 통장, 성장기록, 미션을 역할별 권한으로 확인합니다.</p>
        </div>
      </div>

      ${roleGroups
        .map(
          (group) => `
          <div class="login-group">
            <h2>${group.title}</h2>
            <div class="role-list">
              ${state.users
                .filter((candidate) => candidate.role === group.role)
                .map(
                  (candidate) => `
                    <button class="role-card" type="button" data-login-user="${candidate.id}">
                      <span class="role-badge">${ROLE_LABELS[candidate.role]}</span>
                      <strong>${escapeHtml(candidate.name)}</strong>
                      <small>${escapeHtml(candidate.description)}</small>
                    </button>
                  `
                )
                .join("")}
            </div>
          </div>
        `
        )
        .join("")}

      <div class="login-group invite-login-card">
        <h2>학부모용 초대코드 로그인</h2>
        <p>원에서 받은 초대코드로 가입하면 자기 자녀 기록만 볼 수 있습니다.</p>
        <form id="parent-invite-form">
          <label>
            학부모 이름
            <input name="parentName" type="text" placeholder="예: 김민준 학부모" maxlength="30" />
          </label>
          <label>
            초대코드
            <input name="inviteCode" type="text" placeholder="예: DK-MINJUN-2026" required />
          </label>
          <button class="primary-button" type="submit">학부모 로그인 / 가입</button>
        </form>
        <small>테스트 코드: DK-MINJUN-2026, DK-SEOA-2026, DK-HARIN-2026</small>
      </div>
    </section>
  `;
}

function renderShell(user) {
  const visibleChildren = getVisibleChildren(state, user);
  const visibleClasses = getVisibleClasses(state, user);
  const currentClassLabel =
    user.role === ROLES.DIRECTOR
      ? `${visibleClasses.length}개 반 전체`
      : visibleClasses.map((classroom) => classroom.name).join(", ");

  return `
    <div class="app-shell">
      <header class="top-bar">
        <div>
          <p class="eyebrow">${escapeHtml(user.title)} · ${escapeHtml(currentClassLabel)}</p>
          <h1>${escapeHtml(user.name)}</h1>
        </div>
        <button class="ghost-button" type="button" data-logout>전환</button>
      </header>

      ${
        session.tab === "home"
          ? ""
          : `<section class="permission-card ${user.role}">
              <div>
                <span class="role-badge">${ROLE_LABELS[user.role]}</span>
                <h2>${escapeHtml(getRoleHeadline(user))}</h2>
                <p>${escapeHtml(getRoleDescription(user, visibleChildren.length))}</p>
              </div>
            </section>`
      }

      ${toastMessage ? `<div class="toast" role="status">${escapeHtml(toastMessage)}</div>` : ""}

      <main class="screen-content">
        ${renderActiveTab(user)}
      </main>

      <nav class="bottom-nav" aria-label="주요 메뉴">
        ${tabs
          .map(
            (tab) => `
            <button
              class="${session.tab === tab.id ? "active" : ""}"
              type="button"
              data-tab="${tab.id}"
              aria-current="${session.tab === tab.id ? "page" : "false"}"
            >
              <span>${tab.icon}</span>
              ${tab.label}
            </button>
          `
          )
          .join("")}
      </nav>
    </div>
  `;
}

function getRoleHeadline(user) {
  if (user.role === ROLES.DIRECTOR) {
    return "모든 반과 모든 아이를 한눈에 봅니다";
  }

  if (user.role === ROLES.TEACHER) {
    const classroom = getClass(state, user.classId);
    return `${classroom?.name ?? "담당 반"} 아이만 관리합니다`;
  }

  return "내 자녀 기록만 안전하게 확인합니다";
}

function getRoleDescription(user, visibleChildCount) {
  if (user.role === ROLES.DIRECTOR) {
    return `전체 ${visibleChildCount}명의 행복통장, 성장기록, 미션 현황을 조회할 수 있습니다.`;
  }

  if (user.role === ROLES.TEACHER) {
    return `담당 반 ${visibleChildCount}명에 대해서만 조회, 미션 생성, 완료 처리가 가능합니다.`;
  }

  return "다른 아이의 이름, 통장, 성장기록, 미션 수행내역은 화면에 노출되지 않습니다.";
}

function renderActiveTab(user) {
  if (session.tab === "home" && session.detailScreen) {
    return renderHomeDetail(user, session.detailScreen);
  }

  if (session.tab === "bank") {
    return renderBank(user);
  }
  if (session.tab === "forest") {
    return renderForest(user);
  }
  if (session.tab === "growth") {
    return renderGrowth(user);
  }
  if (session.tab === "missions") {
    return renderMissions(user);
  }
  return renderHome(user);
}

function renderHome(user) {
  const accountSummary = getVisibleAccountSummary(state, user, session.selectedChildId);
  const growthItems = getVisibleGrowthProgress(state, user, session.selectedChildId);
  const visibleMissions = getVisibleChecklistMissions(state, user).filter(
    (mission) => session.selectedChildId === "all" || mission.childId === session.selectedChildId
  );
  const completedMissions = visibleMissions.filter((mission) => mission.completed).length;

  return `
    <section class="home-dashboard">
      <div class="home-title-row">
        <div>
          <p class="eyebrow">오늘 한눈 요약</p>
          <h2>행복부자 통장</h2>
        </div>
        <div class="home-title-actions">
          ${user.role === ROLES.DIRECTOR ? `<button class="text-button" type="button" data-open-detail="invites">초대코드</button>` : ""}
          ${renderHomeChildFilter(user)}
        </div>
      </div>

      <button class="home-balance-card" type="button" data-open-detail="bank">
        <span>현재 잔액</span>
        <strong>${formatWon(accountSummary.currentBalance)}</strong>
      </button>

      ${renderHomeGrowthSummary(growthItems)}

      <button class="home-mission-card" type="button" data-open-detail="missions">
        <div class="home-card-heading">
          <div>
            <span>오늘의 미션 개수</span>
            <strong>${visibleMissions.length}개</strong>
            <small>${completedMissions}개 완료</small>
          </div>
          <span class="home-chevron">보기</span>
        </div>
      </button>
    </section>
  `;
}

function renderHomeChildFilter(user) {
  const children = getVisibleChildren(state, user);

  if (children.length <= 1) {
    return "";
  }

  return renderChildFilter(user, "조회 대상");
}

function renderHomeGrowthSummary(growthItems) {
  return `
    <button class="home-growth-card" type="button" data-open-detail="growth">
      <div class="home-card-heading">
        <div>
          <span>현재 성장단계</span>
          <strong>${growthItems.length === 1 ? escapeHtml(growthItems[0].progress.currentStage.name) : `${growthItems.length}명 성장 현황`}</strong>
          <small>${growthItems.length === 1 ? renderGrowthRemainingText(growthItems[0].progress) : "아이별 단계 보기"}</small>
        </div>
        <span class="home-chevron">보기</span>
      </div>
    </button>
  `;
}

function renderGrowthRemainingText(progress) {
  return progress.nextStage ? `다음 단계까지 ${formatWon(progress.requiredToNext)}` : "모든 단계 달성";
}

function renderHomeGrowthRow(child, progress) {
  const nextText = progress.nextStage
    ? `다음 단계까지 ${formatWon(progress.requiredToNext)}`
    : "모든 단계 달성";

  return `
    <button class="home-growth-row" type="button" data-open-child="${child.id}">
      <div>
        <strong>${escapeHtml(child.name)}</strong>
        <span>${escapeHtml(progress.currentStage.name)}</span>
      </div>
      <p>${nextText}</p>
    </button>
  `;
}

function renderHomeMissionRow(user, mission) {
  return `
    <div class="home-mission-row ${mission.completed ? "done" : ""}">
      <div>
        <strong>${escapeHtml(mission.template.title)}</strong>
        <span>${escapeHtml(mission.child.name)} · +${formatWon(mission.template.point)}</span>
      </div>
      <span class="status-pill ${mission.completed ? "success" : ""}">${mission.completed ? "완료" : "진행중"}</span>
    </div>
  `;
}

function renderHomeDetail(user, detailScreen) {
  if (detailScreen.type === "missions") {
    return renderMissionChecklist(user, detailScreen.childId ?? session.selectedChildId);
  }

  if (detailScreen.type === "child") {
    return renderChildDetail(user, detailScreen.childId);
  }

  if (detailScreen.type === "growth") {
    return renderDetailPanel("성장 상세", renderGrowth(user));
  }

  if (detailScreen.type === "invites") {
    return renderDirectorInviteManager(user);
  }

  return renderDetailPanel("통장 상세", renderBank(user));
}

function renderDirectorInviteManager(user) {
  if (user.role !== ROLES.DIRECTOR) {
    return renderDetailPanel("초대코드 관리", renderEmpty("원장만 초대코드를 관리할 수 있습니다."));
  }

  const invites = state.inviteCodes ?? [];

  return `
    <section class="detail-screen">
      <div class="detail-header">
        <button class="ghost-button" type="button" data-back-home>← 홈</button>
        <h2>학부모 초대코드</h2>
      </div>
      <section class="director-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">아이 등록</p>
            <h2>등록 시 초대코드 자동 생성</h2>
          </div>
        </div>
        <form id="child-register-form">
          <div class="form-row">
            <label>
              아이 이름
              <input name="name" type="text" placeholder="예: 홍길동" required maxlength="20" />
            </label>
            <label>
              반
              <select name="classId" required>
                ${state.classes
                  .map((classroom) => `<option value="${classroom.id}">${escapeHtml(classroom.name)}</option>`)
                  .join("")}
              </select>
            </label>
          </div>
          <div class="form-row">
            <label>
              생년월
              <input name="birthMonth" type="text" placeholder="예: 2020.03" maxlength="10" />
            </label>
            <label>
              초기 잔액
              <input name="balance" type="number" min="0" step="100" value="0" />
            </label>
          </div>
          <button class="primary-button" type="submit">아이 등록 + 초대코드 생성</button>
        </form>
      </section>
      <section class="director-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">초대코드 생성</p>
            <h2>기존 아이 초대코드 추가 발급</h2>
          </div>
        </div>
        <form id="invite-code-form">
          <label>
            아이 선택
            <select name="childId">
              ${state.children
                .map((child) => `<option value="${child.id}">${escapeHtml(child.name)}</option>`)
                .join("")}
            </select>
          </label>
          <button class="primary-button" type="submit">초대코드 생성</button>
        </form>
      </section>
      <section class="card-section compact">
        <div class="section-heading">
          <h2>초대코드 목록</h2>
          <span class="mini-badge">${invites.length}개</span>
        </div>
        ${invites.length
          ? invites.map((invite) => renderInviteCodeRow(invite)).join("")
          : renderEmpty("생성된 초대코드가 없습니다.")}
      </section>
    </section>
  `;
}

function renderInviteCodeRow(invite) {
  const child = getVisibleChildren(state, getCurrentUser()).find((item) => item.id === invite.childId);
  const claimedUser = invite.claimedBy ? getUser(state, invite.claimedBy) : null;

  return `
    <article class="invite-code-row">
      <div>
        <strong>${escapeHtml(invite.code)}</strong>
        <p>${escapeHtml(child?.name ?? "알 수 없는 아이")} · ${invite.active ? "사용 가능" : "비활성"}</p>
      </div>
      <span class="status-pill ${claimedUser ? "success" : ""}">
        ${claimedUser ? "가입됨" : "대기"}
      </span>
    </article>
  `;
}

function renderDetailPanel(title, content) {
  return `
    <section class="detail-screen">
      <div class="detail-header">
        <button class="ghost-button" type="button" data-back-home>← 홈</button>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${content}
    </section>
  `;
}

function renderChildDetail(user, childId) {
  const child = getVisibleChildren(state, user).find((item) => item.id === childId);

  if (!child) {
    return renderDetailPanel("아이 상세", renderEmpty("조회할 수 없는 아이입니다."));
  }

  const classroom = getClass(state, child.classId);
  const accountSummary = getVisibleAccountSummary(state, user, child.id);
  const growthItem = getVisibleGrowthProgress(state, user, child.id)[0];
  const checklist = getVisibleChecklistMissions(state, user, child.id);
  const transactions = getVisibleTransactions(state, user, child.id).slice(0, 3);
  const records = getVisibleGrowthRecords(state, user, child.id).slice(0, 2);

  return `
    <section class="detail-screen">
      <div class="detail-header">
        <button class="ghost-button" type="button" data-back-home>← 홈</button>
        <h2>아이 상세</h2>
      </div>
      <article class="child-detail-hero">
        <div class="avatar big" aria-hidden="true">${escapeHtml(child.name.slice(0, 1))}</div>
        <div>
          <p class="eyebrow">${escapeHtml(classroom?.name ?? "")}</p>
          <h3>${escapeHtml(child.name)}</h3>
          <p>현재 잔액 ${formatWon(accountSummary.currentBalance)}</p>
        </div>
      </article>
      <div class="detail-summary-grid">
        <article><span>총 적립</span><strong>+${formatWon(accountSummary.totalDeposit)}</strong></article>
        <article><span>총 지출</span><strong>-${formatWon(accountSummary.totalExpense)}</strong></article>
        <article><span>성장단계</span><strong>${escapeHtml(growthItem.progress.currentStage.name)}</strong></article>
      </div>
      <article class="home-growth-card flat">
        <div class="home-card-heading">
          <div>
            <span>다음 단계</span>
            <strong>${growthItem.progress.nextStage ? escapeHtml(growthItem.progress.nextStage.name) : "모든 단계 달성"}</strong>
          </div>
          <span class="home-chevron">${growthItem.progress.nextStage ? formatWon(growthItem.progress.requiredToNext) : "완료"}</span>
        </div>
      </article>
      <article class="home-mission-card flat">
        <div class="home-card-heading">
          <div>
            <span>오늘의 미션</span>
            <strong>${checklist.filter((mission) => mission.completed).length}/${checklist.length} 완료</strong>
          </div>
          <button class="text-button" type="button" data-open-detail="missions" data-detail-child="${child.id}">체크하기</button>
        </div>
      </article>
      <section class="card-section compact">
        <h2>최근 거래</h2>
        ${transactions.length
          ? transactions
              .map(
                (transaction) => `
                <article class="timeline-card transaction-card ${transaction.direction}">
                  <div>
                    <strong>${escapeHtml(transaction.title)}</strong>
                    <p>${transaction.date}</p>
                  </div>
                  <span class="amount ${transaction.direction}">
                    ${transaction.direction === "deposit" ? "+" : "-"}${formatWon(transaction.absoluteAmount)}
                  </span>
                </article>
              `
              )
              .join("")
          : renderEmpty("거래내역이 없습니다.")}
      </section>
      <section class="card-section compact">
        <h2>성장기록</h2>
        ${records.length
          ? records
              .map(
                (record) => `
                <article class="growth-card">
                  <div class="growth-meta"><span>${record.date}</span><span>${escapeHtml(record.author)}</span></div>
                  <h3>${escapeHtml(record.title)}</h3>
                  <p>${escapeHtml(record.note)}</p>
                </article>
              `
              )
              .join("")
          : renderEmpty("성장기록이 없습니다.")}
      </section>
    </section>
  `;
}

function renderMissionChecklist(user, childId = "all") {
  const normalizedChildId = childId ?? session.selectedChildId;
  const checklist = getVisibleChecklistMissions(state, user, normalizedChildId);
  const moneySummary = getChecklistMoneySummary(user, normalizedChildId);
  const visibleChildren = getVisibleChildren(state, user).filter(
    (child) => normalizedChildId === "all" || child.id === normalizedChildId
  );
  const grouped = visibleChildren.map((child) => ({
    child,
    missions: checklist.filter((mission) => mission.childId === child.id)
  }));
  const completedCount = checklist.filter((mission) => mission.completed).length;

  return `
    <section class="detail-screen checklist-screen">
      <div class="detail-header">
        <button class="ghost-button" type="button" data-back-home>← 홈</button>
        <h2>미션 체크리스트</h2>
      </div>
      <section class="checklist-money-summary">
        <article>
          <span>현재 잔액</span>
          <strong>${formatWon(moneySummary.currentBalance)}</strong>
        </article>
        <article>
          <span>오늘 적립금</span>
          <strong>+${formatWon(moneySummary.todayDeposit)}</strong>
        </article>
        <article>
          <span>이번 달 적립금</span>
          <strong>+${formatWon(moneySummary.monthDeposit)}</strong>
        </article>
      </section>
      <article class="checklist-hero">
        <div>
          <p class="eyebrow">오늘의 미션</p>
          <h3>${completedCount}/${checklist.length} 완료</h3>
          <p>스스로 할 수 있는 생활 미션을 체크해요.</p>
        </div>
        ${renderChecklistChildFilter(user, normalizedChildId)}
      </article>
      ${renderMissionEditor(user)}
      ${renderCustomMissionForm(user, normalizedChildId)}
      <div class="checklist-groups">
        ${grouped.length
          ? grouped.map(({ child, missions }) => renderChecklistGroup(user, child, missions)).join("")
          : renderEmpty("조회 가능한 미션이 없습니다.")}
      </div>
    </section>
  `;
}

function renderMissionEditor(user) {
  if (!session.editMissionId || !canManageChecklistMissionGroup(state, user, session.editMissionId)) {
    return "";
  }

  const group = getChecklistMissionGroup(state, session.editMissionId);
  const template = group.baseTemplate;
  const children = getVisibleChildren(state, user);
  const targetChildIds = new Set(group.childIds);

  return `
    <section class="mission-editor-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">미션 수정</p>
          <h2>${escapeHtml(template.title)}</h2>
        </div>
        <button class="text-button" type="button" data-close-mission-editor>닫기</button>
      </div>
      <form id="mission-edit-form">
        <input type="hidden" name="missionId" value="${session.editMissionId}" />
        <label>
          미션명
          <input name="title" type="text" value="${escapeHtml(template.title)}" required maxlength="40" />
        </label>
        <label>
          적립 금액
          <input name="point" type="number" min="100" step="100" value="${template.point}" required />
        </label>
        <fieldset class="mission-target-box">
          <legend>대상 수정</legend>
          <label class="check-label target-check">
            <input name="allClassChildren" type="checkbox" ${targetChildIds.size === children.length ? "checked" : ""} />
            반 전체
          </label>
          <div class="target-child-grid">
            ${children
              .map(
                (child) => `
                <input type="hidden" name="availableChildIds" value="${child.id}" />
                <label class="check-label target-check">
                  <input name="childIds" type="checkbox" value="${child.id}" ${targetChildIds.has(child.id) ? "checked" : ""} />
                  ${escapeHtml(child.name)}
                </label>
              `
              )
              .join("")}
          </div>
        </fieldset>
        <fieldset class="mission-repeat-box">
          <legend>반복 여부</legend>
          <label class="check-label target-check">
            <input name="repeatType" type="radio" value="once" ${template.repeatDaily ? "" : "checked"} />
            하루만 하기
          </label>
          <label class="check-label target-check">
            <input name="repeatType" type="radio" value="daily" ${template.repeatDaily ? "checked" : ""} />
            매일 반복
          </label>
        </fieldset>
        <div class="mission-editor-actions">
          <button class="primary-button" type="submit">수정 저장</button>
          <button class="danger-button" type="button" data-delete-mission="${session.editMissionId}">삭제</button>
        </div>
      </form>
    </section>
  `;
}

function getChecklistMoneySummary(user, childId) {
  const transactions = getVisibleTransactions(state, user, childId);
  const todayKey = toDateKey();
  const monthKey = todayKey.slice(0, 7);
  const deposits = transactions.filter((transaction) => transaction.amount > 0);

  return {
    currentBalance: getVisibleAccountSummary(state, user, childId).currentBalance,
    todayDeposit: deposits
      .filter((transaction) => transaction.date === todayKey)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
    monthDeposit: deposits
      .filter((transaction) => transaction.date.slice(0, 7) === monthKey)
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  };
}

function renderCustomMissionForm(user, selectedChildId) {
  const children = getVisibleChildren(state, user).filter(
    (child) => selectedChildId === "all" || child.id === selectedChildId
  );

  if (![ROLES.TEACHER, ROLES.PARENT].includes(user.role) || !children.length) {
    return "";
  }

  if (user.role === ROLES.PARENT) {
    return `
      <details class="custom-mission-card mission-add-details">
        <summary>+ 미션 추가</summary>
        <form id="custom-mission-form">
          ${renderParentMissionTarget(children)}
          <label>
            미션명
            <input name="title" type="text" placeholder="예: 책읽기" required maxlength="40" />
          </label>
          <label>
            적립 금액
            <input name="point" type="number" min="100" step="100" value="500" required />
          </label>
          ${renderMissionRepeatOptions()}
          <button class="primary-button" type="submit">저장</button>
        </form>
        <p class="helper-text">예: 동생도와주기 +500원, 책읽기 +500원, 물 아껴쓰기 +500원</p>
      </details>
    `;
  }

  return `
    <section class="custom-mission-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">교사 미션 배정</p>
          <h2>+ 미션 추가</h2>
        </div>
      </div>
      <form id="custom-mission-form">
        ${renderTeacherMissionTargets(children)}
        <label>
          미션명
          <input name="title" type="text" placeholder="예: 견학시 질서 지키기" required maxlength="40" />
        </label>
        <label>
          적립 금액
          <input name="point" type="number" min="100" step="100" value="500" required />
        </label>
        ${renderMissionRepeatOptions()}
        <button class="primary-button" type="submit">+ 미션 추가</button>
      </form>
      <p class="helper-text">
        예: 견학시 질서 지키기 +500원, 숲체험시 협력하기 +500원, 발표하기 +500원
      </p>
    </section>
  `;
}

function renderMissionRepeatOptions() {
  return `
    <fieldset class="mission-repeat-box">
      <legend>반복 여부</legend>
      <label class="check-label target-check">
        <input name="repeatType" type="radio" value="once" />
        하루만 하기
      </label>
      <label class="check-label target-check">
        <input name="repeatType" type="radio" value="daily" checked />
        매일 반복
      </label>
    </fieldset>
  `;
}

function renderTeacherMissionTargets(children) {
  return `
    <fieldset class="mission-target-box">
      <legend>배정 대상</legend>
      <label class="check-label target-check">
        <input name="allClassChildren" type="checkbox" ${children.length ? "checked" : ""} />
        반 전체
      </label>
      <div class="target-child-grid">
        ${children
          .map(
            (child) => `
            <input type="hidden" name="availableChildIds" value="${child.id}" />
            <label class="check-label target-check">
              <input name="childIds" type="checkbox" value="${child.id}" />
              ${escapeHtml(child.name)}
            </label>
          `
          )
          .join("")}
      </div>
    </fieldset>
  `;
}

function renderParentMissionTarget(children) {
  return `
    <label>
      아이
      <select name="childId">
        ${children.map((child) => `<option value="${child.id}">${escapeHtml(child.name)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderChecklistChildFilter(user, selectedChildId) {
  const children = getVisibleChildren(state, user);
  const allowAll = user.role !== ROLES.PARENT && children.length > 1;

  if (children.length <= 1) {
    return "";
  }

  return `
    <label class="filter-label light">
      아이 선택
      <select id="checklist-child-filter">
        ${allowAll ? `<option value="all" ${selectedChildId === "all" ? "selected" : ""}>전체</option>` : ""}
        ${children
          .map(
            (child) => `
            <option value="${child.id}" ${selectedChildId === child.id ? "selected" : ""}>
              ${escapeHtml(child.name)}
            </option>
          `
          )
          .join("")}
      </select>
    </label>
  `;
}

function renderChecklistGroup(user, child, missions) {
  const completedCount = missions.filter((mission) => mission.completed).length;

  return `
    <article class="checklist-card">
      <div class="checklist-child-heading">
        <div class="avatar" aria-hidden="true">${escapeHtml(child.name.slice(0, 1))}</div>
        <div>
          <strong>${escapeHtml(child.name)}</strong>
          <span>${completedCount}/${missions.length} 완료</span>
        </div>
      </div>
      <div class="checklist-items">
        ${missions.length
          ? missions.map((mission) => renderChecklistItem(user, mission)).join("")
          : renderEmpty("오늘 체크할 기본 미션이 없습니다.")}
      </div>
    </article>
  `;
}

function renderChecklistItem(user, mission) {
  const canCheck = [ROLES.DIRECTOR, ROLES.TEACHER, ROLES.PARENT].includes(user.role) && !mission.completed;
  const canEdit = canManageChecklistMissionGroup(state, user, mission.id);
  const source = getMissionSourceLabel(mission);

  return `
    <article class="checklist-item ${mission.completed ? "done" : ""} ${canEdit ? "editable" : ""}" ${canEdit ? `data-edit-mission="${mission.id}"` : ""}>
      <input
        class="checklist-checkbox"
        type="checkbox"
        data-checklist-mission="${mission.id}"
        ${mission.completed ? "checked" : ""}
        ${canCheck ? "" : "disabled"}
      />
      <span class="checklist-copy">
        <strong>
          ${escapeHtml(mission.template.title)} +${formatWon(mission.template.point)}
        </strong>
        <small>
          <em class="mission-source ${source.className}">${source.label}</em>
          ${canEdit ? "클릭하여 수정" : mission.completed ? "완료" : "체크"}
        </small>
      </span>
      ${
        canEdit
          ? `<span class="mission-row-actions">
              <button class="icon-button edit" type="button" data-edit-mission-button="${mission.id}" aria-label="미션 수정">수정</button>
              <button class="icon-button delete" type="button" data-delete-mission="${mission.id}" aria-label="미션 삭제">삭제</button>
            </span>`
          : ""
      }
    </article>
  `;
}

function getMissionSourceLabel(mission) {
  if (mission.template.standardKey) {
    return { label: "기본", className: "standard" };
  }

  if (mission.template.creatorRole === ROLES.PARENT) {
    return { label: "학부모", className: "parent" };
  }

  if (mission.template.creatorRole === ROLES.TEACHER) {
    return { label: "교사", className: "teacher" };
  }

  return { label: "미션", className: "standard" };
}

function renderChildSummary(child) {
  const classroom = getClass(state, child.classId);
  const percent = Math.min(100, Math.round((child.forest.seeds / child.forest.nextLevelSeeds) * 100));
  const balance = getChildAccountBalance(state, child);

  return `
    <article class="child-card">
      <div class="avatar" aria-hidden="true">${escapeHtml(child.name.slice(0, 1))}</div>
      <div class="child-main">
        <div class="child-title">
          <strong>${escapeHtml(child.name)}</strong>
          <span>${escapeHtml(classroom?.name ?? "")}</span>
        </div>
        <p>${escapeHtml(child.forest.treeName)} Lv.${child.forest.level} · ${formatMoney(balance)}</p>
        <div class="progress-bar" aria-label="행복숲 성장률 ${percent}%">
          <span style="width: ${percent}%"></span>
        </div>
      </div>
    </article>
  `;
}

function renderChildFilter(user, label = "아이 선택") {
  const children = getVisibleChildren(state, user);
  const allowAll = user.role !== ROLES.PARENT || children.length > 1;

  return `
    <label class="filter-label">
      ${label}
      <select id="child-filter">
        ${allowAll ? `<option value="all" ${session.selectedChildId === "all" ? "selected" : ""}>전체</option>` : ""}
        ${children
          .map(
            (child) => `
            <option value="${child.id}" ${session.selectedChildId === child.id ? "selected" : ""}>
              ${escapeHtml(child.name)}
            </option>
          `
          )
          .join("")}
      </select>
    </label>
  `;
}

function renderBank(user) {
  const transactions = getVisibleTransactions(state, user, session.selectedChildId);
  const accountSummary = getVisibleAccountSummary(state, user, session.selectedChildId);

  return `
    <section class="bank-hero">
      <div class="bank-hero-top">
        <div>
          <p class="eyebrow">행복부자 통장</p>
          <span>현재 잔액</span>
          <strong>${formatWon(accountSummary.currentBalance)}</strong>
        </div>
        ${renderChildFilter(user)}
      </div>

      <div class="bank-summary-grid">
        <article>
          <span>총 적립금액</span>
          <strong class="deposit">+${formatWon(accountSummary.totalDeposit)}</strong>
        </article>
        <article>
          <span>총 지출금액</span>
          <strong class="expense">-${formatWon(accountSummary.totalExpense)}</strong>
        </article>
        <article>
          <span>현재 잔액</span>
          <strong>${formatWon(accountSummary.currentBalance)}</strong>
        </article>
      </div>
    </section>

    ${renderExpenseForm(user)}

    <section class="card-section">
      <div class="section-heading">
        <h2>거래내역</h2>
        <span class="mini-badge">${accountSummary.transactionCount}건</span>
      </div>
      ${transactions.length
        ? transactions
            .map(
              (transaction) => `
              <article class="timeline-card transaction-card ${transaction.direction}">
                <div>
                  <strong>${escapeHtml(transaction.title)}</strong>
                  <p>${escapeHtml(transaction.child.name)} · ${escapeHtml(transaction.category)} · ${transaction.date}</p>
                </div>
                <span class="amount ${transaction.direction}">
                  ${transaction.direction === "deposit" ? "입금(+" : "지출(-"}${formatWon(transaction.absoluteAmount)})
                </span>
              </article>
            `
            )
            .join("")
        : renderEmpty("조회 가능한 행복통장 내역이 없습니다.")}
    </section>
  `;
}

function renderExpenseForm(user) {
  const children = getVisibleChildren(state, user).filter(
    (child) => session.selectedChildId === "all" || child.id === session.selectedChildId
  );

  if (![ROLES.TEACHER, ROLES.PARENT].includes(user.role) || !children.length) {
    return "";
  }

  return `
    <section class="expense-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">지출 입력</p>
          <h2>통장에서 차감하기</h2>
        </div>
      </div>
      <form id="expense-form">
        <div class="form-row">
          <label>
            아이
            <select name="childId">
              ${children
                .map((child) => `<option value="${child.id}">${escapeHtml(child.name)}</option>`)
                .join("")}
            </select>
          </label>
          <label>
            지출 금액
            <input name="amount" type="number" min="1" step="1" value="500" inputmode="numeric" required />
          </label>
        </div>
        <label>
          지출 내용
          <input name="title" type="text" placeholder="예: 행복상점 간식 교환" required maxlength="40" />
        </label>
        <button class="primary-button expense-button" type="submit">지출 입력</button>
      </form>
    </section>
  `;
}

function renderForest(user) {
  const children = getVisibleChildren(state, user).filter(
    (child) => session.selectedChildId === "all" || child.id === session.selectedChildId
  );
  const moments = getVisibleForestMoments(state, user, session.selectedChildId);

  return `
    <section class="screen-heading">
      <div>
        <p class="eyebrow">행복숲</p>
        <h2>씨앗이 자라는 마음 기록</h2>
      </div>
      ${renderChildFilter(user)}
    </section>

    <section class="forest-grid">
      ${children.map((child) => renderForestCard(child)).join("")}
    </section>

    <section class="card-section">
      <h2>행복숲 기록</h2>
      ${moments.length
        ? moments
            .map(
              (moment) => `
              <article class="timeline-card">
                <div>
                  <strong>${escapeHtml(moment.title)}</strong>
                  <p>${escapeHtml(moment.child.name)} · ${moment.date}</p>
                  <small>${escapeHtml(moment.note)}</small>
                </div>
                <span class="seed">+${moment.seed} 씨앗</span>
              </article>
            `
            )
            .join("")
        : renderEmpty("조회 가능한 행복숲 기록이 없습니다.")}
    </section>
  `;
}

function renderForestCard(child) {
  const percent = Math.min(100, Math.round((child.forest.seeds / child.forest.nextLevelSeeds) * 100));

  return `
    <article class="forest-card">
      <div class="tree-icon" aria-hidden="true">🌳</div>
      <strong>${escapeHtml(child.name)}의 ${escapeHtml(child.forest.treeName)}</strong>
      <p>Lv.${child.forest.level} · 씨앗 ${child.forest.seeds}/${child.forest.nextLevelSeeds}</p>
      <div class="progress-bar large">
        <span style="width: ${percent}%"></span>
      </div>
    </article>
  `;
}

function renderGrowth(user) {
  const growthItems = getVisibleGrowthProgress(state, user, session.selectedChildId);
  const records = getVisibleGrowthRecords(state, user, session.selectedChildId);

  return `
    <section class="screen-heading">
      <div>
        <p class="eyebrow">성장기록</p>
        <h2>아이의 오늘을 남겨요</h2>
      </div>
      ${renderChildFilter(user)}
    </section>

    <section class="growth-stage-list">
      ${growthItems.length
        ? growthItems.map(({ child, progress }) => renderGrowthProgressCard(child, progress)).join("")
        : renderEmpty("조회 가능한 성장 단계가 없습니다.")}
    </section>

    <section class="card-section">
      <div class="section-heading">
        <h2>성장기록</h2>
      </div>
      ${records.length
        ? records
            .map(
              (record) => `
              <article class="growth-card">
                <div class="growth-meta">
                  <span>${escapeHtml(record.child.name)}</span>
                  <span>${record.date}</span>
                </div>
                <h3>${escapeHtml(record.title)}</h3>
                <p>${escapeHtml(record.note)}</p>
                <div class="tag-row">
                  ${record.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
                </div>
                <small>${escapeHtml(record.author)}</small>
              </article>
            `
            )
            .join("")
        : renderEmpty("조회 가능한 성장기록이 없습니다.")}
    </section>
  `;
}

function renderGrowthProgressCard(child, progress) {
  const nextText = progress.nextStage
    ? `${escapeHtml(progress.nextStage.name)}까지 ${formatMoney(progress.requiredToNext)} 필요`
    : "모든 성장 단계를 달성했어요";

  return `
    <article class="growth-stage-card">
      <div class="growth-stage-top">
        <div>
          <p class="eyebrow">${escapeHtml(child.name)} 성장 단계</p>
          <h3>${escapeHtml(progress.currentStage.name)}</h3>
          <p>현재 잔액 ${formatMoney(progress.balance)} · ${nextText}</p>
        </div>
        <span class="stage-count">${progress.completedStageCount}/${progress.totalStageCount}</span>
      </div>
      <div class="progress-bar large" aria-label="다음 성장 단계 진행률 ${progress.progressPercent}%">
        <span style="width: ${progress.progressPercent}%"></span>
      </div>
      <div class="stage-list">
        ${progress.stages.map((stage) => renderGrowthStageRow(child, stage)).join("")}
      </div>
    </article>
  `;
}

function renderGrowthStageRow(child, stage) {
  return `
    <div class="stage-row ${stage.achieved ? "achieved" : ""}">
      <div class="stage-marker" aria-hidden="true">${stage.achieved ? "✓" : ""}</div>
      <div class="stage-copy">
        <strong>${escapeHtml(stage.name)}</strong>
        <p>${formatMoney(stage.threshold)} 이상 · ${escapeHtml(stage.description)}</p>
      </div>
      <button
        class="stage-button"
        type="button"
        data-growth-stage="${stage.id}"
        data-growth-child="${child.id}"
      >
        ${stage.achieved ? "달성 확인" : `${formatMoney(stage.remaining)} 필요`}
      </button>
    </div>
  `;
}

function renderMissions(user) {
  const todayMissions = getVisibleChecklistMissions(state, user);
  const history = getVisibleMissionHistory(state, user).slice(0, 8);
  const completedCount = todayMissions.filter((mission) => mission.completed).length;

  return `
    <section class="screen-heading stacked">
      <div>
        <p class="eyebrow">미션</p>
        <h2>${toDateKey()} 미션 수행내역</h2>
        <p>매일 0시에 반복 미션이 새로 생성되고, 완료 상태는 새 날짜 미션에서 자동 초기화됩니다.</p>
      </div>
    </section>

    ${user.role === ROLES.TEACHER ? renderMissionComposer(user) : ""}

    <button class="mission-checklist-entry" type="button" data-open-detail="missions">
      <div>
        <span>키즈노트 체크리스트</span>
        <strong>오늘 미션 ${completedCount}/${todayMissions.length} 완료</strong>
        <p>스스로 옷 입기, 인사하기, 정리정돈하기, 친구 도와주기, 양치하기</p>
      </div>
      <span class="home-chevron">열기</span>
    </button>

    <section class="card-section">
      <h2>최근 수행내역</h2>
      ${history.length
        ? history.map((mission) => renderMissionHistoryCard(user, mission)).join("")
        : renderEmpty("조회 가능한 미션 수행내역이 없습니다.")}
    </section>
  `;
}

function renderMissionComposer(user) {
  const classroom = getClass(state, user.classId);
  const children = getVisibleChildren(state, user);

  return `
    <section class="mission-composer">
      <div class="section-heading">
        <div>
          <p class="eyebrow">교사용 미션 생성</p>
          <h2>${escapeHtml(classroom?.name ?? "담당 반")} 미션 만들기</h2>
        </div>
      </div>
      <form id="mission-form">
        <label>
          미션 제목
          <input name="title" type="text" placeholder="예: 친구에게 따뜻한 말 하기" required maxlength="40" />
        </label>
        <div class="form-row">
          <label>
            대상
            <select name="target">
              <option value="class:${user.classId}">${escapeHtml(classroom?.name ?? "담당 반")} 전체</option>
              ${children
                .map((child) => `<option value="child:${child.id}">${escapeHtml(child.name)}</option>`)
                .join("")}
            </select>
          </label>
          <label>
            적립
            <input name="point" type="number" min="100" step="100" value="500" required />
          </label>
        </div>
        <label class="check-label">
          <input name="repeatDaily" type="checkbox" checked />
          매일 반복 미션으로 생성
        </label>
        <button class="primary-button" type="submit">미션 생성</button>
      </form>
    </section>
  `;
}

function renderMissionCard(user, mission) {
  const completeButton =
    user.role === ROLES.TEACHER && !mission.completed
      ? `<button class="small-button" type="button" data-complete-mission="${mission.id}">완료 처리</button>`
      : "";

  return `
    <article class="mission-card ${mission.completed ? "done" : ""}" data-open-detail="missions" data-detail-child="${mission.childId}" role="button" tabindex="0">
      <div>
        <div class="mission-title">
          <strong>${escapeHtml(mission.template.title)}</strong>
          <span>${mission.template.repeatDaily ? "매일 반복" : "오늘만"}</span>
        </div>
        <p>${escapeHtml(mission.child.name)} · ${escapeHtml(mission.classroom.name)} · +${formatMoney(mission.template.point)}</p>
      </div>
      <div class="mission-actions">
        <span class="status-pill">${mission.completed ? "완료" : "진행중"}</span>
        ${completeButton}
      </div>
    </article>
  `;
}

function renderMissionHistoryCard(user, mission) {
  const canEdit = canManageChecklistMissionGroup(state, user, mission.id);

  return `
    <article class="timeline-card">
      <div>
        <strong>${escapeHtml(mission.template.title)}</strong>
        <p>${escapeHtml(mission.child.name)} · ${mission.date} · ${mission.template.repeatDaily ? "반복" : "단일"}</p>
      </div>
      <div class="mission-actions">
        <span class="status-pill ${mission.completed ? "success" : ""}">
          ${mission.completed ? "완료" : "미완료"}
        </span>
        ${
          canEdit
            ? `<span class="mission-row-actions">
                <button class="icon-button edit" type="button" data-edit-mission-button="${mission.id}" aria-label="미션 수정">수정</button>
                <button class="icon-button delete" type="button" data-delete-mission="${mission.id}" aria-label="미션 삭제">삭제</button>
              </span>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderEmpty(message) {
  return `<div class="empty-card">${escapeHtml(message)}</div>`;
}

app.addEventListener("click", (event) => {
  const loginButton = event.target.closest("[data-login-user]");
  if (loginButton) {
    const user = getUser(state, loginButton.dataset.loginUser);
    session = {
      userId: user.id,
      tab: "home",
      selectedChildId: user.role === ROLES.PARENT ? getDefaultChildId(state, user) : "all",
      detailScreen: null
      ,
      editMissionId: null
    };
    saveSession();
    render();
    return;
  }

  const logoutButton = event.target.closest("[data-logout]");
  if (logoutButton) {
    session = { userId: null, tab: "home", selectedChildId: "all", detailScreen: null, editMissionId: null };
    saveSession();
    render();
    return;
  }

  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    session.tab = tabButton.dataset.tab;
    session.detailScreen = null;
    session.editMissionId = null;
    saveSession();
    render();
    return;
  }

  const completeButton = event.target.closest("[data-complete-mission]");
  if (completeButton) {
    try {
      state = completeMission(state, getCurrentUser(), completeButton.dataset.completeMission);
      saveState();
      setToast("미션 완료가 행복통장과 행복숲에 반영되었습니다.");
      render();
    } catch (error) {
      setToast(error.message);
      render();
    }
    return;
  }

  const editMissionButton = event.target.closest("[data-edit-mission-button]");
  if (editMissionButton) {
    const mission = state.dailyMissions.find((item) => item.id === editMissionButton.dataset.editMissionButton);
    session.editMissionId = editMissionButton.dataset.editMissionButton;
    session.tab = "home";
    session.detailScreen = {
      type: "missions",
      childId: mission?.childId ?? session.selectedChildId ?? "all"
    };
    saveSession();
    render();
    return;
  }

  const deleteMissionButton = event.target.closest("[data-delete-mission]");
  if (deleteMissionButton) {
    if (!window.confirm("이 미션을 삭제할까요? 학부모 화면에서도 제거됩니다.")) {
      return;
    }

    try {
      state = deleteChecklistMissionGroup(state, getCurrentUser(), deleteMissionButton.dataset.deleteMission);
      session.editMissionId = null;
      saveState();
      saveSession();
      setToast("미션이 삭제되었습니다.");
      render();
    } catch (error) {
      setToast(error.message);
      render();
    }
    return;
  }

  const checklistItem = event.target.closest(".checklist-item");
  if (checklistItem) {
    const checklistInput = checklistItem.querySelector("[data-checklist-mission]");
    const mission = checklistInput
      ? state.dailyMissions.find((item) => item.id === checklistInput.dataset.checklistMission)
      : null;
    const clickedCheckbox = event.target.closest("[data-checklist-mission]");
    const editMissionId = checklistItem.dataset.editMission;

    if (editMissionId && !clickedCheckbox) {
      session.editMissionId = editMissionId;
      saveSession();
      render();
      return;
    }

    if (!checklistInput || checklistInput.disabled || mission?.completed) {
      render();
      return;
    }

    try {
      state = completeMission(state, getCurrentUser(), checklistInput.dataset.checklistMission);
      saveState();
      setToast("미션 완료가 통장과 성장 단계에 반영되었습니다.");
      render();
    } catch (error) {
      setToast(error.message);
      render();
    }
    return;
  }

  const closeEditorButton = event.target.closest("[data-close-mission-editor]");
  if (closeEditorButton) {
    session.editMissionId = null;
    saveSession();
    render();
    return;
  }

  const childDetailButton = event.target.closest("[data-open-child]");
  if (childDetailButton) {
    session.tab = "home";
    session.detailScreen = {
      type: "child",
      childId: childDetailButton.dataset.openChild
    };
    saveSession();
    render();
    return;
  }

  const detailButton = event.target.closest("[data-open-detail]");
  if (detailButton) {
    session.tab = "home";
    session.detailScreen = {
      type: detailButton.dataset.openDetail,
      childId: detailButton.dataset.detailChild ?? null
    };
    saveSession();
    render();
    return;
  }

  const backButton = event.target.closest("[data-back-home]");
  if (backButton) {
    session.tab = "home";
    session.detailScreen = null;
    session.editMissionId = null;
    saveSession();
    render();
    return;
  }

  const growthStageButton = event.target.closest("[data-growth-stage]");
  if (growthStageButton) {
    const growthItem = getVisibleGrowthProgress(
      state,
      getCurrentUser(),
      growthStageButton.dataset.growthChild
    )[0];
    const stage = growthItem?.progress.stages.find(
      (item) => item.id === growthStageButton.dataset.growthStage
    );

    if (!growthItem || !stage) {
      setToast("조회 권한이 없는 성장 단계입니다.");
      render();
      return;
    }

    setToast(
      stage.achieved
        ? `${growthItem.child.name} 어린이는 ${stage.name}를 자동 달성했습니다.`
        : `${growthItem.child.name} 어린이는 ${stage.name}까지 ${formatMoney(stage.remaining)} 더 필요합니다.`
    );
    render();
  }
});

app.addEventListener("change", (event) => {
  if (event.target.id === "child-filter") {
    session.selectedChildId = event.target.value;
    session.detailScreen = null;
    saveSession();
    render();
  }

  if (event.target.id === "checklist-child-filter") {
    session.detailScreen = {
      type: "missions",
      childId: event.target.value
    };
    saveSession();
    render();
  }
});

app.addEventListener("submit", (event) => {
  if (
    ![
      "parent-invite-form",
      "mission-form",
      "mission-edit-form",
      "custom-mission-form",
      "expense-form",
      "child-register-form",
      "invite-code-form"
    ].includes(
      event.target.id
    )
  ) {
    return;
  }

  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    if (event.target.id === "parent-invite-form") {
      const result = signInParentWithInviteCode(state, {
        parentName: formData.get("parentName"),
        inviteCode: formData.get("inviteCode")
      });
      state = result.data;
      session = {
        userId: result.user.id,
        tab: "home",
        selectedChildId: getDefaultChildId(state, result.user),
        detailScreen: null
      };
      saveState();
      saveSession();
      setToast(result.isNewUser ? "초대코드 가입이 완료되었습니다." : "학부모로 로그인했습니다.");
      render();
      return;
    }

    if (event.target.id === "mission-form") {
      const [targetType, targetId] = String(formData.get("target")).split(":");
      const currentUser = getCurrentUser();
      const targetChildIds =
        targetType === "class"
          ? getVisibleChildren(state, currentUser)
              .filter((child) => child.classId === targetId)
              .map((child) => child.id)
          : [targetId];

      state = createChecklistMission(state, currentUser, {
        title: formData.get("title"),
        point: formData.get("point"),
        childIds: targetChildIds,
        repeatDaily: formData.has("repeatDaily")
      });
      setToast("교사 미션이 체크리스트에 추가되었습니다.");
      session.tab = "home";
      session.selectedChildId = targetChildIds.length === 1 ? targetChildIds[0] : "all";
      session.detailScreen = {
        type: "missions",
        childId: targetChildIds.length === 1 ? targetChildIds[0] : "all"
      };
    }

    if (event.target.id === "mission-edit-form") {
      const currentUser = getCurrentUser();
      const selectedChildIds = formData.has("allClassChildren")
        ? formData.getAll("availableChildIds")
        : formData.getAll("childIds");

      state = updateChecklistMissionGroup(state, currentUser, formData.get("missionId"), {
        title: formData.get("title"),
        point: formData.get("point"),
        childIds: selectedChildIds,
        repeatDaily: formData.get("repeatType") !== "once"
      });
      setToast("미션 수정이 저장되었습니다.");
      session.editMissionId = null;
      session.selectedChildId = selectedChildIds.length === 1 ? selectedChildIds[0] : "all";
      session.detailScreen = {
        type: "missions",
        childId: selectedChildIds.length === 1 ? selectedChildIds[0] : "all"
      };
    }

    if (event.target.id === "child-register-form") {
      state = registerChild(state, getCurrentUser(), {
        name: formData.get("name"),
        classId: formData.get("classId"),
        birthMonth: formData.get("birthMonth"),
        balance: formData.get("balance")
      });
      setToast("아이 등록과 학부모 초대코드 생성이 완료되었습니다.");
      session.detailScreen = {
        type: "invites",
        childId: null
      };
    }

    if (event.target.id === "invite-code-form") {
      state = createParentInviteCode(state, getCurrentUser(), formData.get("childId"));
      setToast("학부모 초대코드가 생성되었습니다.");
      session.detailScreen = {
        type: "invites",
        childId: null
      };
    }

    if (event.target.id === "custom-mission-form") {
      const currentUser = getCurrentUser();
      const selectedChildIds =
        currentUser.role === ROLES.TEACHER
          ? formData.has("allClassChildren")
            ? formData.getAll("availableChildIds")
            : formData.getAll("childIds")
          : [formData.get("childId")];

      state = createChecklistMission(state, getCurrentUser(), {
        childIds: selectedChildIds,
        title: formData.get("title"),
        point: formData.get("point"),
        repeatDaily: formData.get("repeatType") !== "once"
      });
      setToast("맞춤 미션이 오늘 체크리스트에 추가되었습니다.");
      session.selectedChildId = selectedChildIds.length === 1 ? selectedChildIds[0] : "all";
      session.detailScreen = {
        type: "missions",
        childId: selectedChildIds.length === 1 ? selectedChildIds[0] : "all"
      };
    }

    if (event.target.id === "expense-form") {
      state = recordExpense(state, getCurrentUser(), {
        childId: formData.get("childId"),
        title: formData.get("title"),
        amount: formData.get("amount")
      });
      setToast("지출이 현재 잔액에서 차감되었습니다.");
      session.selectedChildId = formData.get("childId");
      session.detailScreen = {
        type: "bank",
        childId: formData.get("childId")
      };
    }

    saveState();
    saveSession();
    render();
  } catch (error) {
    setToast(error.message);
    render();
  }
});

function runDailyRollover() {
  const before = state.lastMissionDate;
  state = normalizeMissionCompletionArtifacts(
    normalizeDailyMissions(normalizeStandardMissionTemplates(state, new Date()), new Date())
  );

  if (state.lastMissionDate !== before) {
    saveState();
    setToast("새 날짜 미션이 자동 생성되고 완료 상태가 초기화되었습니다.");
    render();
  } else {
    saveState();
  }
}

function scheduleMidnightRollover() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 1, 0);
  const delay = Math.max(1000, nextMidnight.getTime() - now.getTime());

  window.setTimeout(() => {
    runDailyRollover();
    scheduleMidnightRollover();
  }, delay);
}

scheduleMidnightRollover();
window.setInterval(runDailyRollover, 60 * 1000);
render();
