import {
  ROLE_LABELS,
  ROLES,
  SESSION_KEY,
  STORAGE_KEY,
  completeMission,
  createInitialData,
  createMissionTemplate,
  getChildAccountBalance,
  getClass,
  getDashboardStats,
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
  toDateKey
} from "./state.js";

const app = document.querySelector("#app");

const tabs = [
  { id: "home", label: "홈", icon: "🏠" },
  { id: "bank", label: "통장", icon: "💰" },
  { id: "forest", label: "행복숲", icon: "🌳" },
  { id: "growth", label: "성장", icon: "🌱" },
  { id: "missions", label: "미션", icon: "✅" }
];

let state = normalizeBankAccounts(normalizeDailyMissions(loadState(), new Date()));
let session = loadSession();
let toastMessage = "";

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
          selectedChildId: "all"
        };
  } catch (error) {
    console.warn("세션을 불러오지 못해 초기화합니다.", error);
    return { userId: null, tab: "home", selectedChildId: "all" };
  }
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
    { role: ROLES.TEACHER, title: "교사용 화면" },
    { role: ROLES.PARENT, title: "학부모용 화면" }
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

      <section class="permission-card ${user.role}">
        <div>
          <span class="role-badge">${ROLE_LABELS[user.role]}</span>
          <h2>${escapeHtml(getRoleHeadline(user))}</h2>
          <p>${escapeHtml(getRoleDescription(user, visibleChildren.length))}</p>
        </div>
      </section>

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
  const stats = getDashboardStats(state, user);
  const children = getVisibleChildren(state, user);
  const missions = getVisibleDailyMissions(state, user).slice(0, 4);

  return `
    <section class="stats-grid">
      <article class="stat-card">
        <span>조회 아이</span>
        <strong>${stats.childCount}명</strong>
      </article>
      <article class="stat-card">
        <span>행복 잔액</span>
        <strong>${formatMoney(stats.totalBalance)}</strong>
      </article>
      <article class="stat-card">
        <span>오늘 미션</span>
        <strong>${stats.completedMissionCount}/${stats.missionCount}</strong>
      </article>
      <article class="stat-card">
        <span>오늘 적립</span>
        <strong>${formatMoney(stats.todayDeposit)}</strong>
      </article>
    </section>

    ${renderRoleHomeMessage(user)}

    <section class="card-section">
      <div class="section-heading">
        <h2>아이별 행복 요약</h2>
        <button class="text-button" type="button" data-tab="bank">통장 보기</button>
      </div>
      <div class="child-list">
        ${children.map((child) => renderChildSummary(child)).join("")}
      </div>
    </section>

    <section class="card-section">
      <div class="section-heading">
        <h2>오늘 미션</h2>
        <button class="text-button" type="button" data-tab="missions">전체 보기</button>
      </div>
      ${missions.length ? missions.map((mission) => renderMissionCard(user, mission)).join("") : renderEmpty("오늘 생성된 미션이 없습니다.")}
    </section>
  `;
}

function renderRoleHomeMessage(user) {
  if (user.role === ROLES.DIRECTOR) {
    return `
      <section class="notice-card">
        <strong>원장용 화면</strong>
        <p>모든 반의 행복통장, 행복숲 성장, 미션 수행률을 통합 조회합니다.</p>
      </section>
    `;
  }

  if (user.role === ROLES.TEACHER) {
    return `
      <section class="notice-card">
        <strong>교사용 화면</strong>
        <p>담당 반 아이만 표시됩니다. 미션을 만들 때 매일 반복 여부를 선택할 수 있습니다.</p>
      </section>
      ${renderMissionComposer(user)}
    `;
  }

  return `
    <section class="notice-card secure">
      <strong>학부모용 화면</strong>
      <p>내 자녀의 행복통장, 성장기록, 미션 수행내역만 조회합니다.</p>
    </section>
  `;
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
  const todayMissions = getVisibleDailyMissions(state, user);
  const history = getVisibleMissionHistory(state, user).slice(0, 8);

  return `
    <section class="screen-heading stacked">
      <div>
        <p class="eyebrow">미션</p>
        <h2>${toDateKey()} 미션 수행내역</h2>
        <p>매일 0시에 반복 미션이 새로 생성되고, 완료 상태는 새 날짜 미션에서 자동 초기화됩니다.</p>
      </div>
    </section>

    ${user.role === ROLES.TEACHER ? renderMissionComposer(user) : ""}

    <section class="card-section">
      <div class="section-heading">
        <h2>오늘 미션</h2>
        <span class="mini-badge">${state.lastMissionDate} 생성됨</span>
      </div>
      ${todayMissions.length
        ? todayMissions.map((mission) => renderMissionCard(user, mission)).join("")
        : renderEmpty("오늘 생성된 미션이 없습니다.")}
    </section>

    <section class="card-section">
      <h2>최근 수행내역</h2>
      ${history.length
        ? history.map((mission) => renderMissionHistoryCard(mission)).join("")
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
            <input name="point" type="number" min="0" step="50" value="300" required />
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
    <article class="mission-card ${mission.completed ? "done" : ""}">
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

function renderMissionHistoryCard(mission) {
  return `
    <article class="timeline-card">
      <div>
        <strong>${escapeHtml(mission.template.title)}</strong>
        <p>${escapeHtml(mission.child.name)} · ${mission.date} · ${mission.template.repeatDaily ? "반복" : "단일"}</p>
      </div>
      <span class="status-pill ${mission.completed ? "success" : ""}">
        ${mission.completed ? "완료" : "미완료"}
      </span>
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
      selectedChildId: user.role === ROLES.PARENT ? getDefaultChildId(state, user) : "all"
    };
    saveSession();
    render();
    return;
  }

  const logoutButton = event.target.closest("[data-logout]");
  if (logoutButton) {
    session = { userId: null, tab: "home", selectedChildId: "all" };
    saveSession();
    render();
    return;
  }

  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    session.tab = tabButton.dataset.tab;
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
    saveSession();
    render();
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "mission-form") {
    return;
  }

  event.preventDefault();
  const formData = new FormData(event.target);
  const [targetType, targetId] = String(formData.get("target")).split(":");

  try {
    state = createMissionTemplate(state, getCurrentUser(), {
      title: formData.get("title"),
      point: formData.get("point"),
      targetType,
      targetId,
      repeatDaily: formData.has("repeatDaily")
    });
    saveState();
    setToast("오늘 미션이 생성되었습니다. 반복 미션은 매일 0시에 다시 생성됩니다.");
    session.tab = "missions";
    saveSession();
    render();
  } catch (error) {
    setToast(error.message);
    render();
  }
});

function runDailyRollover() {
  const before = state.lastMissionDate;
  state = normalizeDailyMissions(state, new Date());

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
