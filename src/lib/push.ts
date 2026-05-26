import webpush from "web-push";
import { prisma } from "@/lib/db";

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@haengbok-daycare.local";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url?: string },
) {
  if (!configureWebPush()) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  const data = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }),
  );
}

export async function notifyParentsOfChild(
  childId: string,
  payload: { title: string; body: string; url?: string },
) {
  const parents = await prisma.user.findMany({
    where: { role: "PARENT", childId },
    select: { id: true },
  });
  await sendPushToUsers(
    parents.map((p) => p.id),
    payload,
  );
}

export async function notifyAllParents(payload: {
  title: string;
  body: string;
  url?: string;
}) {
  const parents = await prisma.user.findMany({
    where: { role: "PARENT" },
    select: { id: true },
  });
  await sendPushToUsers(
    parents.map((p) => p.id),
    payload,
  );
}
