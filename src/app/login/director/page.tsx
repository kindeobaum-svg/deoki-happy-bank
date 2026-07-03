import Link from "next/link";
import { QuickRoleEnter } from "@/components/QuickRoleEnter";

export default function DirectorLoginPage() {
  return (
    <>
      <QuickRoleEnter
        role="DIRECTOR"
        title="원장님"
        desc="버튼을 눌러 입장해요"
        emoji="🏫"
        primary
      />
      <p className="pb-8 text-center">
        <Link href="/login" className="text-sm text-[var(--sage-600)]">
          ← 역할 다시 선택
        </Link>
      </p>
    </>
  );
}
