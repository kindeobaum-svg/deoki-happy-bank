const state = {
  userId: new URLSearchParams(window.location.search).get("user_id") || "1",
  today: new Date().toISOString().slice(0, 10),
  dashboard: null,
  user: null,
};

const routes = {
  mission: {
    kicker: "오늘 미션",
    title: "미션 상세",
    render: renderMissionDetail,
  },
  bank: {
    kicker: "행복부자 통장",
    title: "통장 상세",
    render: renderBankDetail,
  },
  growth: {
    kicker: "성장 기록",
    title: "성장 상세",
    render: renderGrowthDetail,
  },
  child: {
    kicker: "우리아이",
    title: "우리아이 상세",
    render: renderChildDetail,
  },
};

const elements = {
  dashboardView: document.querySelector("#dashboard-view"),
  detailView: document.querySelector("#detail-view"),
  userLabel: document.querySelector("#user-label"),
  missionSummary: document.querySelector("#mission-summary"),
  bankSummary: document.querySelector("#bank-summary"),
  growthSummary: document.querySelector("#growth-summary"),
  childSummary: document.querySelector("#child-summary"),
  detailKicker: document.querySelector("#detail-kicker"),
  detailTitle: document.querySelector("#detail-title"),
  detailContent: document.querySelector("#detail-content"),
  backButton: document.querySelector("#back-button"),
};

document.addEventListener("DOMContentLoaded", async () => {
  elements.backButton.addEventListener("click", () => {
    window.location.hash = "";
  });
  window.addEventListener("hashchange", renderRoute);

  await loadDashboard();
  renderRoute();
});

async function loadDashboard() {
  const [user, dashboard] = await Promise.all([
    requestJson(`/api/me?user_id=${state.userId}`),
    requestJson(`/api/dashboard?user_id=${state.userId}&date=${state.today}`),
  ]);

  state.user = user;
  state.dashboard = dashboard;
  renderDashboardCards();
}

function renderDashboardCards() {
  const { mission, bank, growth, child } = state.dashboard;
  elements.userLabel.textContent = `${state.user.name} · ${roleName(state.user.role)}`;
  elements.missionSummary.textContent = mission.label;
  elements.bankSummary.textContent = `잔액 ${formatWon(bank.current_balance)} · 적립 ${formatWon(bank.total_saved)} · 지출 ${formatWon(bank.total_spent)}`;
  elements.growthSummary.textContent = `${growth.current_stage} · 총 적립 ${formatWon(growth.total_saved)}`;
  elements.childSummary.textContent = `${child.name} · ${child.class_name} · ${child.recent_activity}`;
}

async function renderRoute() {
  const routeName = window.location.hash.replace("#", "");
  const route = routes[routeName];
  if (!route) {
    elements.detailView.classList.add("is-hidden");
    elements.dashboardView.classList.remove("is-hidden");
    return;
  }

  elements.dashboardView.classList.add("is-hidden");
  elements.detailView.classList.remove("is-hidden");
  elements.detailKicker.textContent = route.kicker;
  elements.detailTitle.textContent = route.title;
  elements.detailContent.innerHTML = `<div class="empty-state">불러오는 중...</div>`;
  await route.render();
}

async function renderMissionDetail() {
  const data = await requestJson(`/api/missions?user_id=${state.userId}&date=${state.today}`);
  const missions = data.missions;
  if (missions.length === 0) {
    elements.detailContent.innerHTML = `<div class="empty-state">오늘 등록된 미션이 없습니다.</div>`;
    return;
  }

  const completed = missions.filter((mission) => mission.status === "completed").length;
  elements.detailContent.innerHTML = `
    ${summaryStrip([
      ["전체", `${missions.length}개`],
      ["완료", `${completed}개`],
      ["남음", `${missions.length - completed}개`],
    ])}
    ${missions.map(renderMissionCard).join("")}
  `;

  elements.detailContent.querySelectorAll("[data-complete-mission]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      await requestJson(`/api/missions/${button.dataset.completeMission}/complete`, {
        method: "POST",
        body: JSON.stringify({ user_id: Number(state.userId) }),
      });
      await loadDashboard();
      await renderMissionDetail();
    });
  });
}

function renderMissionCard(mission) {
  const isCompleted = mission.status === "completed";
  return `
    <article class="list-card">
      <span class="status-badge ${isCompleted ? "completed" : ""}">
        ${isCompleted ? "완료" : "진행중"}
      </span>
      <h3 class="list-card-title">${escapeHtml(mission.title)}</h3>
      <p class="list-card-meta">${escapeHtml(mission.child_name)} · ${escapeHtml(mission.class_name)}</p>
      ${
        isCompleted
          ? ""
          : `<button class="complete-button" type="button" data-complete-mission="${mission.id}">미션 완료</button>`
      }
    </article>
  `;
}

async function renderBankDetail() {
  const bank = await requestJson(`/api/bank?user_id=${state.userId}`);
  elements.detailContent.innerHTML = `
    ${summaryStrip([
      ["현재 잔액", formatWon(bank.current_balance)],
      ["총 적립", formatWon(bank.total_saved)],
      ["총 지출", formatWon(bank.total_spent)],
    ])}
    <article class="list-card">
      <h3 class="list-card-title">적립 기준</h3>
      <p class="list-card-meta">미션을 완료할 때마다 ${formatWon(bank.reward_per_mission)}이 행복부자 통장에 적립됩니다.</p>
    </article>
  `;
}

async function renderGrowthDetail() {
  const growth = await requestJson(`/api/growth?user_id=${state.userId}`);
  const nextGoal = growth.next_goal;
  const percent = nextGoal
    ? Math.min(100, Math.round((growth.total_saved / nextGoal.required_saved) * 100))
    : 100;

  elements.detailContent.innerHTML = `
    ${summaryStrip([
      ["현재 단계", growth.current_stage],
      ["총 적립금", formatWon(growth.total_saved)],
      ["다음 목표", nextGoal ? nextGoal.stage : "최고 단계"],
    ])}
    <article class="list-card">
      <h3 class="list-card-title">성장 진행률</h3>
      <div class="progress" aria-label="성장 진행률 ${percent}%">
        <div class="progress-bar" style="width: ${percent}%"></div>
      </div>
      <p class="list-card-meta">
        ${
          nextGoal
            ? `${nextGoal.stage}까지 ${formatWon(nextGoal.remaining)} 남았어요.`
            : "행복 열매 단계에 도착했어요."
        }
      </p>
    </article>
  `;
}

async function renderChildDetail() {
  const [childSummary, childrenData] = await Promise.all([
    requestJson(`/api/child-summary?user_id=${state.userId}`),
    requestJson(`/api/children?user_id=${state.userId}`),
  ]);

  const children = childrenData.children;
  elements.detailContent.innerHTML = `
    ${summaryStrip([
      ["아이", childSummary.name],
      ["반", childSummary.class_name],
      ["최근 활동", childSummary.recent_activity],
    ])}
    ${
      children.length
        ? children
            .map(
              (child) => `
                <article class="list-card">
                  <h3 class="list-card-title">${escapeHtml(child.name)}</h3>
                  <p class="list-card-meta">${escapeHtml(child.class_name)} · 행복부자 통장 활동을 확인해보세요.</p>
                </article>
              `,
            )
            .join("")
        : `<div class="empty-state">등록된 아이가 없습니다.</div>`
    }
  `;
}

function summaryStrip(items) {
  return `
    <div class="summary-strip">
      ${items
        .map(
          ([label, value]) => `
            <div class="summary-item">
              <span class="summary-label">${escapeHtml(label)}</span>
              <span class="summary-value">${escapeHtml(value)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "요청 실패" }));
    throw new Error(error.error || "요청 실패");
  }
  return response.json();
}

function formatWon(value) {
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function roleName(role) {
  return {
    principal: "원장",
    teacher: "교사",
    parent: "학부모",
  }[role] || role;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
