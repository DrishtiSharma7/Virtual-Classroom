/**
 * Avatar utilities for meeting-style circular initials and deterministic color allocation.
 * Guarantees that a user ID receives the exact same color everywhere (classroom, meeting, navbar, chat).
 */

export const AVATAR_PALETTES = [
  { class: "bg-indigo-600 text-white", hex: "4f46e5" },
  { class: "bg-emerald-600 text-white", hex: "059669" },
  { class: "bg-rose-600 text-white", hex: "e11d48" },
  { class: "bg-amber-600 text-white", hex: "d97706" },
  { class: "bg-violet-600 text-white", hex: "7c3aed" },
  { class: "bg-sky-600 text-white", hex: "0284c7" },
  { class: "bg-teal-600 text-white", hex: "0d9488" },
  { class: "bg-orange-600 text-white", hex: "ea580c" },
  { class: "bg-pink-600 text-white", hex: "db2777" },
  { class: "bg-cyan-700 text-white", hex: "0e7490" },
  { class: "bg-purple-600 text-white", hex: "9333ea" },
  { class: "bg-lime-700 text-white", hex: "4d7c0f" },
  { class: "bg-blue-600 text-white", hex: "2563eb" },
  { class: "bg-fuchsia-600 text-white", hex: "c026d3" },
  { class: "bg-red-600 text-white", hex: "dc2626" },
  { class: "bg-emerald-800 text-white", hex: "065f46" },
  { class: "bg-indigo-800 text-white", hex: "3730a3" },
  { class: "bg-rose-700 text-white", hex: "be123c" },
  { class: "bg-amber-700 text-white", hex: "b45309" },
  { class: "bg-violet-800 text-white", hex: "5b21b6" },
  { class: "bg-teal-800 text-white", hex: "115e59" },
  { class: "bg-sky-800 text-white", hex: "075985" },
  { class: "bg-orange-700 text-white", hex: "c2410c" },
  { class: "bg-pink-700 text-white", hex: "be185d" },
];

/**
 * Extracts 1-2 uppercase initials from a name.
 */
export function getInitials(name = "") {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic palette index based on user ID or fallback string.
 */
export function getAvatarPaletteIndex(id = "", name = "") {
  const key = String(id || name || "");
  if (!key) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % AVATAR_PALETTES.length;
}

/**
 * Deterministic Tailwind class allocation based on user ID (or fallback name).
 * Produces the exact same color across classroom details, live meetings, and navbar.
 */
export function getAvatarPaletteById(id = "", name = "") {
  const idx = getAvatarPaletteIndex(id, name);
  return AVATAR_PALETTES[idx].class;
}

/**
 * Deterministic Hex color allocation for Canvas / SVG / external URLs.
 */
export function getAvatarHexById(id = "", name = "") {
  const idx = getAvatarPaletteIndex(id, name);
  return AVATAR_PALETTES[idx].hex;
}

/**
 * Builds a 1-to-1 Map of User ID -> Consistent Color.
 * Guarantees that users have the exact same color in ClassroomDetails and LiveClassroom.
 *
 * @param {Array<Object|string>} participants - List of user objects or ID strings
 * @returns {Map<string, string>}
 */
export function buildUserColorMap(participants = []) {
  const map = new Map();
  participants.forEach((p) => {
    if (!p) return;
    const idKey = String(
      typeof p === "object"
        ? p._id || p.id || p.email || p.name || ""
        : p
    );
    if (!idKey) return;
    if (!map.has(idKey)) {
      const name = typeof p === "object" ? p.name : "";
      map.set(idKey, getAvatarPaletteById(idKey, name));
    }
  });

  return map;
}
