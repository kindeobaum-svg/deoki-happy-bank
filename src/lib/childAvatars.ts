export const CHILD_AVATAR_PRESETS = ["🌻", "🐻", "🦋", "🌸", "🐰", "🦊", "🐣", "⭐", "🌼", "🍀"];

export function pickChildAvatar(seed?: string): string {
  if (!seed) {
    return CHILD_AVATAR_PRESETS[Math.floor(Math.random() * CHILD_AVATAR_PRESETS.length)];
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % CHILD_AVATAR_PRESETS.length;
  }
  return CHILD_AVATAR_PRESETS[hash];
}
