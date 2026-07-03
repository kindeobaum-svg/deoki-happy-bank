"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // 개발 중에는 SW가 이전 HTML/JS를 캐시해 최신 UI가 안 보일 수 있음
    if (process.env.NODE_ENV === "development") {
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      );
      if ("caches" in window) {
        void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore registration errors */
    });
  }, []);

  return null;
}
