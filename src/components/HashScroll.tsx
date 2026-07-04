"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** URL hash(#section)로 진입했을 때 해당 섹션으로 스크롤 */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const id = decodeURIComponent(hash.slice(1));
    const scrollToTarget = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    scrollToTarget();
    const timer = window.setTimeout(scrollToTarget, 120);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
