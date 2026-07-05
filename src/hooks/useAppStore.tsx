"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DAYCARE_NAME } from "@/lib/branding";
import { clearAppClientStorage } from "@/lib/clientStorage";
import { getDemoAccount } from "@/lib/demoAccess";
import type {
  AppState,
  AttendanceStatus,
  Role,
  User,
} from "@/lib/types";

type AppContextValue = {
  state: AppState;
  loading: boolean;
  selectedChild: AppState["children"][0] | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string, expectedRole?: Role) => Promise<{ error?: string; user?: User }>;
  enterAsRole: (role: Role) => Promise<{ error?: string; user?: User }>;
  logout: () => Promise<void>;
  accumulate: (childId: string, message?: string) => Promise<void>;
  selectChild: (childId: string) => void;
  addAnnouncement: (title: string, content: string, author: string) => Promise<void>;
  setAttendance: (childId: string, status: AttendanceStatus) => Promise<void>;
  addPraise: (childId: string, message: string, emoji: string) => Promise<void>;
  addChild: (name: string, className: string) => Promise<{ error?: string }>;
  updateChild: (
    id: string,
    data: { name?: string; className?: string; avatar?: string },
  ) => Promise<{ error?: string }>;
  deleteChild: (id: string) => Promise<{ error?: string }>;
};

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY: AppState = {
  user: null,
  children: [],
  saveRecords: [],
  announcements: [],
  attendances: [],
  praiseRecords: [],
  selectedChildId: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meBody = (await meRes.json().catch(() => ({}))) as { user?: User | null };
      if (!meRes.ok && meBody.user === undefined) {
        setState(EMPTY);
        return;
      }
      const user = meBody.user ?? null;
      if (!user) {
        setState(EMPTY);
        return;
      }

      const dataRes = await fetch("/api/data");
      if (!dataRes.ok) {
        setState({ ...EMPTY, user });
        return;
      }

      const data = await dataRes.json();
      setState((prev) => ({
        user,
        children: data.children.map(normalizeChild),
        saveRecords: data.saveRecords.map(normalizeRecord),
        announcements: data.announcements.map(normalizeAnnouncement),
        attendances: data.attendances ?? [],
        praiseRecords: (data.praiseRecords ?? []).map(normalizePraise),
        selectedChildId: data.selectedChildId,
      }));
    } catch {
      setState(EMPTY);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const selectedChild = useMemo(
    () => state.children.find((c) => c.id === state.selectedChildId) ?? state.children[0] ?? null,
    [state.children, state.selectedChildId],
  );

  const login = useCallback(
    async (email: string, password: string, expectedRole?: Role) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, expectedRole }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "로그인에 실패했습니다." };
      await refresh();
      return { user: data.user as User };
    },
    [refresh],
  );

  const enterAsRole = useCallback(
    async (role: Role) => {
      const demo = getDemoAccount(role);
      return login(demo.email, demo.password, role);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearAppClientStorage();
    setState(EMPTY);
  }, []);

  const accumulate = useCallback(
    async (childId: string, message = "오늘도 잘했어요!") => {
      const res = await fetch(`/api/children/${childId}/accumulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) return;
      await refresh();
    },
    [refresh],
  );

  const selectChild = useCallback((childId: string) => {
    setState((prev) => ({ ...prev, selectedChildId: childId }));
  }, []);

  const addAnnouncement = useCallback(
    async (title: string, content: string, author: string) => {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, author }),
      });
      await refresh();
    },
    [refresh],
  );

  const setAttendance = useCallback(
    async (childId: string, status: AttendanceStatus) => {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, status }),
      });
      await refresh();
    },
    [refresh],
  );

  const addPraise = useCallback(
    async (childId: string, message: string, emoji: string) => {
      await fetch("/api/praise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, message, emoji }),
      });
      await refresh();
    },
    [refresh],
  );

  const addChild = useCallback(
    async (name: string, className: string) => {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, className }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "원아 추가에 실패했습니다." };
      await refresh();
      return {};
    },
    [refresh],
  );

  const updateChild = useCallback(
    async (id: string, data: { name?: string; className?: string; avatar?: string }) => {
      const res = await fetch(`/api/children/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) return { error: body.error ?? "수정에 실패했습니다." };
      await refresh();
      return {};
    },
    [refresh],
  );

  const deleteChild = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/children/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.error ?? "삭제에 실패했습니다." };
      await refresh();
      return {};
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      state,
      loading,
      selectedChild,
      refresh,
      login,
      enterAsRole,
      logout,
      accumulate,
      selectChild,
      addAnnouncement,
      setAttendance,
      addPraise,
      addChild,
      updateChild,
      deleteChild,
    }),
    [
      state,
      loading,
      selectedChild,
      refresh,
      login,
      enterAsRole,
      logout,
      accumulate,
      selectChild,
      addAnnouncement,
      setAttendance,
      addPraise,
      addChild,
      updateChild,
      deleteChild,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function normalizeChild(c: ChildRaw) {
  return {
    id: c.id,
    name: c.name,
    className: c.className,
    accountNumber: c.accountNumber,
    points: c.points,
    totalSaved: c.totalSaved,
    avatar: c.avatar,
  };
}

function normalizeRecord(r: RecordRaw) {
  return {
    id: r.id,
    childId: r.childId,
    amount: r.amount,
    message: r.message,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
  };
}

function normalizeAnnouncement(a: AnnouncementRaw) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    author: a.author,
    createdAt: typeof a.createdAt === "string" ? a.createdAt : new Date(a.createdAt).toISOString(),
  };
}

function normalizePraise(p: PraiseRaw) {
  return {
    id: p.id,
    childId: p.childId,
    message: p.message,
    emoji: p.emoji,
    author: p.author,
    date: p.date,
    createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
  };
}

type ChildRaw = {
  id: string;
  name: string;
  className: string;
  accountNumber: string;
  points: number;
  totalSaved: number;
  avatar: string;
};

type RecordRaw = {
  id: string;
  childId: string;
  amount: number;
  message: string;
  createdAt: string | Date;
};

type AnnouncementRaw = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string | Date;
};

type PraiseRaw = {
  id: string;
  childId: string;
  message: string;
  emoji: string;
  author: string;
  date: string;
  createdAt: string | Date;
};
