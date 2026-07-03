import Link from "next/link";
import { QuickRoleEnter } from "@/components/QuickRoleEnter";

export default function TeacherLoginPage() {
  return (
    <>
      <QuickRoleEnter
        role="TEACHER"
        title="선생님"
        desc="버튼을 눌러 입장해요"
        emoji="👩‍🏫"
        primary
      />
      <p className="text-center">
        <Link href="/login/teacher/join" className="text-sm font-semibold text-[var(--sage-600)]">
          초대코드로 가입하기 →
        </Link>
      </p>
      <p className="pb-8 text-center">
        <Link href="/login" className="text-sm text-[var(--sage-600)]">
          ← 역할 다시 선택
        </Link>
      </p>
    </>
  );
}
