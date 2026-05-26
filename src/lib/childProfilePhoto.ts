import { pickChildAvatar } from "@/lib/childAvatars";

export function isProfilePhoto(value: string): boolean {
  return value.startsWith("data:image/");
}

/** 사진이 없을 때 표시할 기본 꽃·숲 아이콘 */
export function getDefaultProfileIcon(name?: string): string {
  const icon = pickChildAvatar(name);
  if (["🌻", "🌸", "🌼", "🍀", "🦋"].includes(icon)) return icon;
  return "🌸";
}

export function resolveProfileDisplay(avatar: string | undefined, name?: string) {
  if (avatar && isProfilePhoto(avatar)) {
    return { type: "photo" as const, src: avatar };
  }
  const emoji = avatar && !isProfilePhoto(avatar) ? avatar : getDefaultProfileIcon(name);
  return { type: "emoji" as const, emoji };
}

const MAX_EDGE = 320;
const JPEG_QUALITY = 0.82;
const MAX_BYTES = 280_000;

export async function fileToProfilePhotoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("사진 파일만 등록할 수 있어요.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const compressed = await compressImage(dataUrl, MAX_EDGE, JPEG_QUALITY);

  if (compressed.length > MAX_BYTES * 1.4) {
    throw new Error("사진 용량이 커요. 다른 사진을 선택해 주세요.");
  }

  return compressed;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("사진을 읽을 수 없어요."));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string, maxEdge: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("사진 처리에 실패했어요."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("사진을 불러올 수 없어요."));
    img.src = dataUrl;
  });
}
