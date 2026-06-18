import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ROLES,
  completeMission,
  createChecklistMission,
  createInitialData,
  createMissionTemplate,
  createParentInviteCode,
  deleteChecklistMissionGroup,
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
  normalizeDailyMissions,
  normalizeMissionCompletionArtifacts,
  normalizeParentInviteCodes,
  registerChild,
  recordExpense,
  signInParentWithInviteCode,
  updateChecklistMissionGroup
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

describe("invite code login", () => {
  it("signs an existing parent in with an invite code", () => {
    const data = createInitialData("2026-06-09");
    const result = signInParentWithInviteCode(data, {
      inviteCode: "dk-minjun-2026",
      parentName: "테스트 학부모"
    });

    assert.equal(result.user.id, "parent-minjun");
    assert.equal(result.isNewUser, false);
    assert.deepEqual(
      getVisibleChildren(result.data, result.user).map((child) => child.id),
      ["child-minjun"]
    );
  });

  it("creates a parent account for an unclaimed invite code", () => {
    const data = createInitialData("2026-06-09");
    const result = signInParentWithInviteCode(data, {
      inviteCode: "DK-HARIN-2026",
      parentName: "이하린 보호자"
    });

    assert.equal(result.isNewUser, true);
    assert.equal(result.user.role, ROLES.PARENT);
    assert.deepEqual(result.user.childIds, ["child-harin"]);
    assert.deepEqual(
      getVisibleChildren(result.data, result.user).map((child) => child.id),
      ["child-harin"]
    );
  });

  it("rejects an invalid parent invite code", () => {
    const data = createInitialData("2026-06-09");

    assert.throws(
      () =>
        signInParentWithInviteCode(data, {
          inviteCode: "WRONG-CODE"
        }),
      /유효하지 않은/
    );
  });

  it("lets the director create a parent invite code for any child", () => {
    const data = createInitialData("2026-06-09");
    const director = getUser(data, "director-1");
    const updated = createParentInviteCode(data, director, "child-doyun");
    const invite = updated.inviteCodes[0];

    assert.equal(invite.childId, "child-doyun");
    assert.match(invite.code, /^DK-/);
  });

  it("registers a child and automatically creates an invite code", () => {
    const data = createInitialData("2026-06-09");
    const director = getUser(data, "director-1");
    const updated = registerChild(data, director, {
      name: "한지우",
      classId: "sun",
      birthMonth: "2020.10",
      balance: 1000
    });
    const child = updated.children.find((item) => item.name === "한지우");
    const invite = updated.inviteCodes.find((item) => item.childId === child.id);

    assert.ok(child);
    assert.ok(invite);
    assert.match(invite.code, /^DK-/);
  });

  it("normalizes missing invite codes for existing children", () => {
    const data = {
      ...createInitialData("2026-06-09"),
      inviteCodes: []
    };
    const updated = normalizeParentInviteCodes(data);

    assert.equal(updated.inviteCodes.length, data.children.length);
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
      ["인사하기", "정리정돈", "양치하기", "친구 돕기"]
    );
    assert.ok(checklist.every((mission) => mission.template.point === 500));
  });

  it("lets a parent add and complete a custom mission for their own child", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const withCustomMission = createChecklistMission(
      data,
      parent,
      {
        childId: "child-minjun",
        title: "책읽기",
        point: 500
      },
      "2026-06-09"
    );
    const mission = getVisibleChecklistMissions(
      withCustomMission,
      parent,
      "child-minjun",
      "2026-06-09"
    ).find((item) => item.template.title === "책읽기");
    const completed = completeMission(withCustomMission, parent, mission.id, "2026-06-09");
    const summary = getVisibleAccountSummary(completed, parent, "child-minjun");

    assert.ok(mission);
    assert.equal(mission.template.point, 500);
    assert.equal(summary.currentBalance, 13300);
  });

  it("creates today's transaction, growth record, and balance change when a mission is checked", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const mission = getVisibleChecklistMissions(data, parent, "child-minjun", "2026-06-09")[0];
    const completed = completeMission(data, parent, mission.id, "2026-06-09");
    const transaction = getVisibleTransactions(completed, parent, "child-minjun").find(
      (item) => item.missionId === mission.id
    );
    const growthRecord = getVisibleGrowthRecords(completed, parent, "child-minjun").find(
      (item) => item.missionId === mission.id
    );
    const historyMission = getVisibleMissionHistory(completed, parent).find((item) => item.id === mission.id);
    const summary = getVisibleAccountSummary(completed, parent, "child-minjun");

    assert.equal(transaction.title, mission.template.title);
    assert.equal(transaction.child.name, "김민준");
    assert.equal(transaction.date, "2026-06-09");
    assert.equal(transaction.amount, 500);
    assert.equal(transaction.direction, "deposit");
    assert.equal(growthRecord.title, `미션 완료: ${mission.template.title}`);
    assert.equal(historyMission.completed, true);
    assert.equal(summary.currentBalance, 13300);
  });

  it("does not create duplicate mission deposits when a checked mission is clicked again", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const mission = getVisibleChecklistMissions(data, parent, "child-minjun", "2026-06-09")[0];
    const completed = completeMission(data, parent, mission.id, "2026-06-09");
    const completedAgain = completeMission(completed, parent, mission.id, "2026-06-09");
    const missionTransactions = getVisibleTransactions(completedAgain, parent, "child-minjun").filter(
      (item) => item.missionId === mission.id
    );

    assert.equal(missionTransactions.length, 1);
    assert.equal(getVisibleAccountSummary(completedAgain, parent, "child-minjun").currentBalance, 13300);
  });

  it("repairs completed missions missing transaction and growth artifacts from saved localStorage", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const mission = getVisibleChecklistMissions(data, parent, "child-minjun", "2026-06-09")[0];
    const brokenSavedState = {
      ...data,
      dailyMissions: data.dailyMissions.map((item) =>
        item.id === mission.id
          ? {
              ...item,
              completed: true,
              completedAt: "2026-06-09T09:00:00.000Z"
            }
          : item
      )
    };
    const repaired = normalizeMissionCompletionArtifacts(brokenSavedState);

    assert.ok(
      getVisibleTransactions(repaired, parent, "child-minjun").some((item) => item.missionId === mission.id)
    );
    assert.ok(
      getVisibleGrowthRecords(repaired, parent, "child-minjun").some((item) => item.missionId === mission.id)
    );
    assert.equal(getVisibleAccountSummary(repaired, parent, "child-minjun").currentBalance, 13300);
  });

  it("lets the director complete any child checklist mission", () => {
    const data = createInitialData("2026-06-09");
    const director = getUser(data, "director-1");
    const mission = getVisibleChecklistMissions(data, director, "child-minjun", "2026-06-09")[0];
    const completed = completeMission(data, director, mission.id, "2026-06-09");
    const summary = getVisibleAccountSummary(completed, director, "child-minjun");

    assert.equal(
      completed.dailyMissions.find((item) => item.id === mission.id).completed,
      true
    );
    assert.equal(summary.currentBalance, 13300);
  });

  it("does not regenerate one-day checklist missions after completion", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const withOneDayMission = createChecklistMission(
      data,
      parent,
      {
        childId: "child-minjun",
        title: "동생도와주기",
        point: 500,
        repeatDaily: false
      },
      "2026-06-09"
    );
    const mission = getVisibleChecklistMissions(
      withOneDayMission,
      parent,
      "child-minjun",
      "2026-06-09"
    ).find((item) => item.template.title === "동생도와주기");
    const completed = completeMission(withOneDayMission, parent, mission.id, "2026-06-09");
    const tomorrow = normalizeDailyMissions(completed, "2026-06-10");

    assert.equal(
      getVisibleChecklistMissions(tomorrow, parent, "child-minjun", "2026-06-10").some(
        (item) => item.template.title === "동생도와주기"
      ),
      false
    );
  });

  it("regenerates daily checklist missions on the next day", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const withDailyMission = createChecklistMission(
      data,
      parent,
      {
        childId: "child-minjun",
        title: "책읽기",
        point: 500,
        repeatDaily: true
      },
      "2026-06-09"
    );
    const tomorrow = normalizeDailyMissions(withDailyMission, "2026-06-10");

    assert.equal(
      getVisibleChecklistMissions(tomorrow, parent, "child-minjun", "2026-06-10").some(
        (item) => item.template.title === "책읽기" && item.completed === false
      ),
      true
    );
  });

  it("prevents a parent from adding a mission for another child", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");

    assert.throws(
      () =>
        createChecklistMission(data, parent, {
          childId: "child-seoa",
          title: "다른 아이 미션",
          point: 500
        }),
      /자기 아이/
    );
  });

  it("lets a teacher assign a custom mission to selected children in their class", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const withTeacherMission = createChecklistMission(
      data,
      teacher,
      {
        childIds: ["child-minjun", "child-harin"],
        title: "견학시 질서 지키기",
        point: 500
      },
      "2026-06-09"
    );
    const missions = getVisibleChecklistMissions(withTeacherMission, teacher, "all", "2026-06-09").filter(
      (mission) => mission.template.title === "견학시 질서 지키기"
    );

    assert.deepEqual(
      missions.map((mission) => mission.childId).sort(),
      ["child-harin", "child-minjun"]
    );
    assert.ok(missions.every((mission) => mission.template.creatorRole === ROLES.TEACHER));
  });

  it("lets a teacher update title, amount, and targets for their checklist mission", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const withTeacherMission = createChecklistMission(
      data,
      teacher,
      {
        childIds: ["child-minjun", "child-harin"],
        title: "견학시 질서 지키기",
        point: 500
      },
      "2026-06-09"
    );
    const mission = getVisibleChecklistMissions(withTeacherMission, teacher, "all", "2026-06-09").find(
      (item) => item.template.title === "견학시 질서 지키기"
    );
    const updated = updateChecklistMissionGroup(
      withTeacherMission,
      teacher,
      mission.id,
      {
        childIds: ["child-minjun"],
        title: "숲체험에서 협력하기",
        point: 700,
        repeatDaily: false
      },
      "2026-06-09"
    );
    const minjunMissions = getVisibleChecklistMissions(updated, teacher, "child-minjun", "2026-06-09");
    const harinMissions = getVisibleChecklistMissions(updated, teacher, "child-harin", "2026-06-09");

    assert.ok(
      minjunMissions.some(
        (item) => item.template.title === "숲체험에서 협력하기" && item.template.point === 700
      )
    );
    assert.equal(
      harinMissions.some((item) => item.template.title === "숲체험에서 협력하기"),
      false
    );
  });

  it("lets a teacher update and delete a default class checklist mission", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const defaultMission = getVisibleChecklistMissions(data, teacher, "child-minjun", "2026-06-09").find(
      (mission) => mission.template.title === "인사하기"
    );
    const updated = updateChecklistMissionGroup(
      data,
      teacher,
      defaultMission.id,
      {
        childIds: ["child-minjun"],
        title: "밝게 인사하기",
        point: 700,
        repeatDaily: true
      },
      "2026-06-09"
    );
    const parent = getUser(updated, "parent-minjun");

    assert.ok(
      getVisibleChecklistMissions(updated, parent, "child-minjun", "2026-06-09").some(
        (mission) => mission.template.title === "밝게 인사하기" && mission.template.point === 700
      )
    );

    const editedMission = getVisibleChecklistMissions(updated, teacher, "child-minjun", "2026-06-09").find(
      (mission) => mission.template.title === "밝게 인사하기"
    );
    const deleted = deleteChecklistMissionGroup(updated, teacher, editedMission.id);

    assert.equal(
      getVisibleChecklistMissions(deleted, parent, "child-minjun", "2026-06-09").some(
        (mission) => mission.template.title === "밝게 인사하기"
      ),
      false
    );
  });

  it("updates a default class checklist mission in place when the whole class remains selected", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const defaultMission = getVisibleChecklistMissions(data, teacher, "child-minjun", "2026-06-09").find(
      (mission) => mission.template.title === "정리정돈"
    );
    const beforeTemplateCount = data.missionTemplates.length;
    const updated = updateChecklistMissionGroup(
      data,
      teacher,
      defaultMission.id,
      {
        childIds: ["child-minjun", "child-harin"],
        title: "정리정돈 잘하기",
        point: 500,
        repeatDaily: true
      },
      "2026-06-09"
    );
    const minjunMissions = getVisibleChecklistMissions(updated, teacher, "child-minjun", "2026-06-09");
    const harinMissions = getVisibleChecklistMissions(updated, teacher, "child-harin", "2026-06-09");

    assert.equal(updated.missionTemplates.length, beforeTemplateCount);
    assert.equal(
      minjunMissions.some((mission) => mission.template.title === "정리정돈"),
      false
    );
    assert.equal(
      harinMissions.some((mission) => mission.template.title === "정리정돈"),
      false
    );
    assert.ok(
      minjunMissions.some((mission) => mission.template.title === "정리정돈 잘하기")
    );
    assert.ok(
      harinMissions.some((mission) => mission.template.title === "정리정돈 잘하기")
    );
  });

  it("cleans stale duplicate child missions created by a previous class edit bug", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const corrupted = createChecklistMission(
      data,
      teacher,
      {
        childIds: ["child-minjun", "child-harin"],
        title: "정리정돈 잘하기",
        point: 500,
        repeatDaily: true
      },
      "2026-06-09"
    );
    const defaultMission = getVisibleChecklistMissions(corrupted, teacher, "child-minjun", "2026-06-09").find(
      (mission) => mission.template.title === "정리정돈"
    );
    const updated = updateChecklistMissionGroup(
      corrupted,
      teacher,
      defaultMission.id,
      {
        childIds: ["child-minjun", "child-harin"],
        title: "정리정돈 잘하기",
        point: 500,
        repeatDaily: true
      },
      "2026-06-09"
    );
    const minjunMissions = getVisibleChecklistMissions(updated, teacher, "child-minjun", "2026-06-09");
    const harinMissions = getVisibleChecklistMissions(updated, teacher, "child-harin", "2026-06-09");

    assert.equal(
      minjunMissions.filter((mission) => mission.template.title === "정리정돈 잘하기").length,
      1
    );
    assert.equal(
      harinMissions.filter((mission) => mission.template.title === "정리정돈 잘하기").length,
      1
    );
    assert.equal(
      minjunMissions.some((mission) => mission.template.title === "정리정돈"),
      false
    );
  });

  it("removes a deleted teacher mission from parent-visible checklist", () => {
    const data = createInitialData("2026-06-09");
    const teacher = getUser(data, "teacher-sun");
    const withTeacherMission = createChecklistMission(
      data,
      teacher,
      {
        childIds: ["child-minjun"],
        title: "발표하기",
        point: 500
      },
      "2026-06-09"
    );
    const mission = getVisibleChecklistMissions(withTeacherMission, teacher, "child-minjun", "2026-06-09").find(
      (item) => item.template.title === "발표하기"
    );
    const deleted = deleteChecklistMissionGroup(withTeacherMission, teacher, mission.id);
    const parent = getUser(deleted, "parent-minjun");

    assert.equal(
      getVisibleChecklistMissions(deleted, parent, "child-minjun", "2026-06-09").some(
        (item) => item.template.title === "발표하기"
      ),
      false
    );
  });

  it("distinguishes parent-created missions from teacher-created missions", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const teacher = getUser(data, "teacher-sun");
    const withParentMission = createChecklistMission(
      data,
      parent,
      {
        childId: "child-minjun",
        title: "책읽기",
        point: 500
      },
      "2026-06-09"
    );
    const withTeacherMission = createChecklistMission(
      withParentMission,
      teacher,
      {
        childIds: ["child-minjun"],
        title: "발표하기",
        point: 500
      },
      "2026-06-09"
    );
    const missions = getVisibleChecklistMissions(
      withTeacherMission,
      getUser(withTeacherMission, "parent-minjun"),
      "child-minjun",
      "2026-06-09"
    );

    assert.equal(
      missions.find((mission) => mission.template.title === "책읽기").template.creatorRole,
      ROLES.PARENT
    );
    assert.equal(
      missions.find((mission) => mission.template.title === "발표하기").template.creatorRole,
      ROLES.TEACHER
    );
  });

  it("lets teachers and directors view parent-created missions within their visibility", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const withParentMission = createChecklistMission(
      data,
      parent,
      {
        childId: "child-minjun",
        title: "물 아껴쓰기",
        point: 500
      },
      "2026-06-09"
    );
    const teacher = getUser(withParentMission, "teacher-sun");
    const director = getUser(withParentMission, "director-1");

    assert.ok(
      getVisibleChecklistMissions(withParentMission, teacher, "child-minjun", "2026-06-09").some(
        (mission) => mission.template.title === "물 아껴쓰기"
      )
    );
    assert.ok(
      getVisibleChecklistMissions(withParentMission, director, "child-minjun", "2026-06-09").some(
        (mission) => mission.template.title === "물 아껴쓰기"
      )
    );
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

  it("records an expense and subtracts it from the current balance", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const withExpense = recordExpense(
      data,
      parent,
      {
        childId: "child-minjun",
        title: "행복상점 간식 교환",
        amount: 700
      },
      "2026-06-09"
    );
    const summary = getVisibleAccountSummary(withExpense, parent, "child-minjun");
    const transaction = getVisibleTransactions(withExpense, parent, "child-minjun")[0];

    assert.equal(summary.totalExpense, 1700);
    assert.equal(summary.currentBalance, 12100);
    assert.equal(transaction.amount, -700);
  });

  it("records the exact expense amount entered and subtracts the same amount", () => {
    const data = createInitialData("2026-06-09");
    const parent = getUser(data, "parent-minjun");
    const withExpense = recordExpense(
      data,
      parent,
      {
        childId: "child-minjun",
        title: "정확한 금액 지출",
        amount: 1234
      },
      "2026-06-09"
    );
    const summary = getVisibleAccountSummary(withExpense, parent, "child-minjun");
    const transaction = getVisibleTransactions(withExpense, parent, "child-minjun")[0];

    assert.equal(transaction.title, "정확한 금액 지출");
    assert.equal(transaction.amount, -1234);
    assert.equal(transaction.absoluteAmount, 1234);
    assert.equal(summary.totalExpense, 2234);
    assert.equal(summary.currentBalance, 11566);
  });
});
