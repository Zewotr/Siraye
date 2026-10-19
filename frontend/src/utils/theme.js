/**
 * Dynamic Theme & Brand Color Engine for Siraye.
 * Generates and applies RGB CSS custom properties to document.documentElement
 * so that Tailwind's `brand-*` utility classes instantly react across all dashboards and pages.
 */

export const PRESET_COLORS = [
  {
    id: "#255A54",
    name: "Deep Pine",
    desc: "Balanced & focused, classic Siraye",
    palette: {
      50: "242 249 247",
      100: "217 239 234",
      200: "178 221 212",
      300: "133 199 187",
      400: "88 170 157",
      500: "61 141 129",
      600: "47 112 104",
      700: "37 90 84",
      800: "30 72 68",
      900: "24 58 55",
    },
  },
  {
    id: "#635BFF",
    name: "Electric Indigo",
    desc: "Modern, dynamic & high energy",
    palette: {
      50: "245 244 255",
      100: "235 233 254",
      200: "217 213 254",
      300: "188 181 253",
      400: "154 142 252",
      500: "123 103 250",
      600: "107 78 247",
      700: "99 91 255",
      800: "84 46 214",
      900: "70 39 175",
    },
  },
  {
    id: "#0EA5E9",
    name: "Ocean Sky",
    desc: "Calm, clear & expansive",
    palette: {
      50: "240 249 255",
      100: "224 242 254",
      200: "186 230 253",
      300: "125 211 252",
      400: "56 189 248",
      500: "14 165 233",
      600: "2 132 199",
      700: "3 105 161",
      800: "7 89 133",
      900: "12 74 110",
    },
  },
  {
    id: "#10B981",
    name: "Emerald Mint",
    desc: "Fresh, productive & clean",
    palette: {
      50: "236 253 245",
      100: "209 250 229",
      200: "167 243 208",
      300: "110 231 183",
      400: "52 211 153",
      500: "16 185 129",
      600: "5 150 105",
      700: "4 120 87",
      800: "6 95 70",
      900: "6 78 59",
    },
  },
  {
    id: "#F59E0B",
    name: "Warm Amber",
    desc: "Creative, warm & motivating",
    palette: {
      50: "255 251 235",
      100: "254 243 199",
      200: "253 230 138",
      300: "252 211 77",
      400: "251 191 36",
      500: "245 158 11",
      600: "217 119 6",
      700: "180 83 9",
      800: "146 64 14",
      900: "120 53 15",
    },
  },
  {
    id: "#F43F5E",
    name: "Rose Sunset",
    desc: "Bold, passionate & striking",
    palette: {
      50: "255 241 242",
      100: "255 228 230",
      200: "254 205 211",
      300: "253 164 175",
      400: "251 113 133",
      500: "244 63 94",
      600: "225 29 72",
      700: "190 18 60",
      800: "159 18 57",
      900: "136 19 55",
    },
  },
  {
    id: "#8B5CF6",
    name: "Royal Violet",
    desc: "Refined, focused & elegant",
    palette: {
      50: "245 243 255",
      100: "237 233 254",
      200: "221 214 254",
      300: "196 181 253",
      400: "167 139 250",
      500: "139 92 246",
      600: "124 58 237",
      700: "109 40 217",
      800: "91 33 182",
      900: "76 29 149",
    },
  },
];

function hexToRgb(hex) {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [37, 90, 84]; // default Deep Pine
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixRgb(rgb1, rgb2, weight) {
  return [
    Math.round(rgb1[0] * (1 - weight) + rgb2[0] * weight),
    Math.round(rgb1[1] * (1 - weight) + rgb2[1] * weight),
    Math.round(rgb1[2] * (1 - weight) + rgb2[2] * weight),
  ];
}

function generatePalette(baseHex) {
  const [r, g, b] = hexToRgb(baseHex);
  const base = [r, g, b];
  const white = [255, 255, 255];
  const black = [0, 0, 0];

  return {
    50: mixRgb(base, white, 0.92).join(" "),
    100: mixRgb(base, white, 0.82).join(" "),
    200: mixRgb(base, white, 0.65).join(" "),
    300: mixRgb(base, white, 0.48).join(" "),
    400: mixRgb(base, white, 0.28).join(" "),
    500: mixRgb(base, white, 0.12).join(" "),
    600: mixRgb(base, black, 0.1).join(" "),
    700: base.join(" "),
    800: mixRgb(base, black, 0.22).join(" "),
    900: mixRgb(base, black, 0.42).join(" "),
  };
}

/**
 * Apply the color preference to document.documentElement as CSS custom properties
 * and persist to localStorage.
 */
export function applyThemeColor(hexColor) {
  if (!hexColor || typeof hexColor !== "string") return;

  const normalized = hexColor.toUpperCase();
  const matched = PRESET_COLORS.find((c) => c.id.toUpperCase() === normalized);
  const palette = matched ? matched.palette : generatePalette(hexColor);

  const root = document.documentElement;
  Object.entries(palette).forEach(([shade, value]) => {
    root.style.setProperty(`--brand-${shade}`, value);
  });
  root.style.setProperty("--brand-hex", hexColor);

  try {
    localStorage.setItem("siraye:color", hexColor);
  } catch {
    // ignore
  }
}

/**
 * Initialize theme and color on application boot.
 */
export function initTheme() {
  if (typeof window === "undefined") return;

  // 1. Color setup
  const savedColor = localStorage.getItem("siraye:color") || "#255A54";
  applyThemeColor(savedColor);

  // 2. Theme setup (Dark/Light/System)
  const savedTheme = localStorage.getItem("siraye:theme") || "system";
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  }
}

/**
 * Get the current active brand hex color from the document or localStorage.
 */
export function getThemeColor() {
  if (typeof window === "undefined") return "#255A54";
  return (
    document.documentElement.style.getPropertyValue("--brand-hex") ||
    localStorage.getItem("siraye:color") ||
    "#255A54"
  );
}
