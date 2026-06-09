import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ROLES,
  completeMission,
  createInitialData,
  createMissionTemplate,
  getUser,
  getVisibleChildren,
  getVisibleDailyMissions,
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
});
