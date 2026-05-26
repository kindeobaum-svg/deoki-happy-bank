export type Role = "PARENT" | "TEACHER" | "CHILD" | "DIRECTOR";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  childId: string | null;
};

export type SaveRecord = {
  id: string;
  childId: string;
  amount: number;
  message: string;
  createdAt: string;
};

export type Child = {
  id: string;
  name: string;
  className: string;
  accountNumber: string;
  points: number;
  totalSaved: number;
  avatar: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
};

export type DailyReport = {
  id: string;
  childId: string;
  date: string;
  mood: string;
  meal: string;
  nap: string;
  note: string;
};

export type Attendance = {
  id: string;
  childId: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
};

export type PraiseRecord = {
  id: string;
  childId: string;
  message: string;
  emoji: string;
  author: string;
  date: string;
  createdAt: string;
};

export type AppState = {
  user: User | null;
  children: Child[];
  saveRecords: SaveRecord[];
  announcements: Announcement[];
  dailyReports: DailyReport[];
  attendances: Attendance[];
  praiseRecords: PraiseRecord[];
  selectedChildId: string | null;
};
