import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ROLES,
  completeMission,
  createInitialData,
  createMissionTemplate,
  getGrowthProgress,
  getUser,
  getVisibleAccountSummary,
  getVisibleChecklistMissions,
  getVisibleChildren,
  getVisibleDailyMissions,
  getVisibleGrowthProgress,
  getVisibleGrowthRecords,
  getVisibleMissionHistory,
  getVisibleTransactions,
  normalizeDailyMissions
} from "../src/state.js";

describe("role based access", () => {
  it("allows the director to see all classes and children", () => {
    const data = createInitialData("2026-06-09");
    const director = getUser(data, "director-1");

    assert.equal(director.role, ROLES.DIRECTOR);
    assert.deepEqual(
      getVisibleChildren(data, director).map((child) => child.id).sort(),
      ["child-doyun", "child-harin", "child-minjun", "child-seoa"]
    );
  });

  it("limits teachers to their own class", () => {
    const data = createInitialData("2026-06-09");
    const sunTeacher = getUser(data, "teacher-sun");

    assert.deepEqual(
      getVisibleChildren(data, sunTeacher).map((child) => child.id).sort(),
      ["child-harin", "child-minjun"]
    );

    assert.throws(
      () =>
        createMissionTemplate(data, sunTeacher, {
          title: "다른 반 미션",
          point: 100,
          targetType: "child",
          targetId: "child-seoa",
          repeatDaily: true
        }),
      /자기 반/
    );
  });

  it("limits parents to their own child records", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");

    assert.deepEqual(
      getVisibleChildren(data, parent).map((child) => child.id),
      ["child-minjun"]
    );
    assert.ok(getVisibleTransactions(data, parent).every((item) => item.childId === "child-minjun"));
    assert.ok(getVisibleGrowthRecords(data, parent).every((item) => item.childId === "child-minjun"));
    assert.ok(getVisibleDailyMissions(data, parent).every((item) => item.childId === "child-minjun"));
    assert.ok(getVisibleMissionHistory(data, parent).every((item) => item.childId === "child-minjun"));
  });
});

describe("daily missions", () => {
  it("regenerates recurring missions at the next date with completion reset", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const mission = getVisibleDailyMissions(data, teacher, "2026-06-09").find(
      (item) => item.childId === "child-minjun" && item.template.repeatDaily
    );

    const completed = completeMission(data, teacher, mission.id, "2026-06-09");
    const rolledOver = normalizeDailyMissions(completed, "2026-06-10");
    const previousMission = rolledOver.dailyMissions.find((item) => item.id === mission.id);
    const nextMission = getVisibleDailyMissions(rolledOver, teacher, "2026-06-10").find(
      (item) => item.childId === "child-minjun" && item.templateId === mission.templateId
    );

    assert.equal(previousMission.completed, true);
    assert.ok(nextMission);
    assert.equal(nextMission.completed, false);
    assert.notEqual(nextMission.id, mission.id);
  });

  it("does not carry one-time missions into the next day", () => {
    const data = createInitialData("2026-06-09");
    const rolledOver = normalizeDailyMissions(data, "2026-06-10");
    const nextDayMissions = getVisibleDailyMissions(
      rolledOver,
      getUser(rolledOver, "director-1"),
      "2026-06-10"
    );

    assert.equal(
      nextDayMissions.some((mission) => mission.templateId === "mission-template-cleanup"),
      false
    );
  });

  it("creates teacher missions for today and repeats them only when selected", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const withMission = createMissionTemplate(
      data,
      teacher,
      {
        title: "물병 스스로 정리하기",
        point: 250,
        targetType: "class",
        targetId: "sun",
        repeatDaily: false
      },
      "2026-06-09"
    );
    const template = withMission.missionTemplates[0];
    const today = getVisibleDailyMissions(withMission, teacher, "2026-06-09");
    const tomorrow = getVisibleDailyMissions(
      normalizeDailyMissions(withMission, "2026-06-10"),
      teacher,
      "2026-06-10"
    );

    assert.equal(today.filter((mission) => mission.templateId === template.id).length, 2);
    assert.equal(tomorrow.filter((mission) => mission.templateId === template.id).length, 0);
  });

  it("generates the standard checklist missions for each visible child", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const checklist = getVisibleChecklistMissions(data, teacher, "child-minjun", "2026-06-09");

    assert.deepEqual(
      checklist.map((mission) => mission.template.title),
      ["스스로 옷 입기", "인사하기", "정리정돈하기", "친구 도와주기", "양치하기"]
    );
    assert.ok(checklist.every((mission) => mission.template.point === 500));
  });
});

describe("growth stages", () => {
  it("shows the current stage and next required amount from balance", () => {
    const progress = getGrowthProgress({ balance: 12800 });

    assert.equal(progress.currentStage.id, "young-tree");
    assert.equal(progress.nextStage.id, "happy-tree");
    assert.equal(progress.requiredToNext, 2200);
    assert.equal(progress.stages.find((stage) => stage.id === "sprout").achieved, true);
    assert.equal(progress.stages.find((stage) => stage.id === "happy-tree").achieved, false);
  });

  it("automatically marks stages achieved when the balance meets the threshold", () => {
    const progress = getGrowthProgress({ balance: 20000 });

    assert.equal(progress.currentStage.id, "forest-keeper");
    assert.equal(progress.stages.find((stage) => stage.id === "forest-keeper").achieved, true);
    assert.equal(progress.stages.find((stage) => stage.id === "happy-rich").remaining, 10000);
  });

  it("updates achieved stages after a mission changes the balance", () => {
    const data = createInitialData("2026-06-09");
    const adjusted = {
      ...data,
      children: data.children.map((child) =>
        child.id === "child-minjun" ? { ...child, balance: 14900, openingBalance: 15100 } : child
      )
    };
    const teacher = getUser(adjusted, "teacher-sun");
    const mission = getVisibleDailyMissions(adjusted, teacher, "2026-06-09").find(
      (item) => item.childId === "child-minjun" && item.template.point === 300
    );
    const completed = completeMission(adjusted, teacher, mission.id, "2026-06-09");
    const growthItem = getVisibleGrowthProgress(
      completed,
      getUser(completed, "parent-minjun"),
      "child-minjun"
    )[0];

    assert.equal(growthItem.progress.balance, 15200);
    assert.equal(growthItem.progress.currentStage.id, "happy-tree");
    assert.equal(
      growthItem.progress.stages.find((stage) => stage.id === "happy-tree").achieved,
      true
    );
  });
});

describe("bank account summary", () => {
  it("shows deposits, expenses, and current balance from visible transactions", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const summary = getVisibleAccountSummary(data, parent, "child-minjun");

    assert.equal(summary.totalDeposit, 800);
    assert.equal(summary.totalExpense, 1000);
    assert.equal(summary.currentBalance, 12800);
    assert.equal(summary.transactionCount, 3);
  });

  it("automatically recalculates the current balance when an expense is added", () => {
    const data = createInitialData("2026-06-09");
    const withExpense = {
      ...data,
      transactions: [
        {
          id: "tx-extra-expense",
          childId: "child-minjun",
          date: "2026-06-09",
          amount: -500,
          title: "행복상점 간식 교환",
          category: "지출"
        },
        ...data.transactions
      ]
    };
    const summary = getVisibleAccountSummary(
      withExpense,
      getUser(withExpense, "parent-minjun"),
      "child-minjun"
    );

    assert.equal(summary.totalDeposit, 800);
    assert.equal(summary.totalExpense, 1500);
    assert.equal(summary.currentBalance, 12300);
  });
});
