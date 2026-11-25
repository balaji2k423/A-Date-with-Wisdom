import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------- SETTINGS ---------------- */
const SHOW = {
  name: "A DATE WITH WISDOM",
  author: "Sathya",
  tagline: "Unhurried conversations on life, love, work and the ideas worth sitting with.",
  about:
    "A Date With Wisdom is a podcast for curious minds. Each episode is a slow, honest conversation with a thinker, maker or storyteller — the kind you'd want to have over a long dinner.",
  socials: [
    { label: "Instagram", href: "#" },
    { label: "X", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],
};

/* Paste the "Publish to web" CSV link of your Google Sheet here */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaa5S-7OEN-vduS6kMlQGZEsazer7U_1pIJG1rqRvUN7SZ8YF2W7xJbN4TQdcNa1r48kREVFXatE9E/pub?gid=638783810&single=true&output=csv";

/* Forest photo used for the hero and as a fallback cover */
const HERO_IMAGE = "/hero.png";

const PLATFORMS = [
  { key: "spotify", label: "Spotify" },
  { key: "youtube", label: "YouTube" },
  { key: "apple", label: "Apple Podcasts" },
  { key: "amazon", label: "Amazon Music" },
];

/* ---------------- GOOGLE SHEET READER ---------------- */
// Tiny CSV parser (handles quotes, commas and line breaks inside cells)
function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

// Finds a column by part of its header name, so "Spotify link" and "spotify" both work
const pick = (obj, keys) => {
  for (const k of Object.keys(obj)) {
    const h = k.toLowerCase();
    if (keys.some((x) => h.includes(x))) return (obj[k] || "").trim();
  }
  return "";
};

function parseDate(s) {
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// Turns a Google Drive share link into a picture link that can be shown on the page
function coverUrl(raw) {
  if (!raw) return "";
  const first = raw.split(",")[0].trim();
  const m = first.match(/(?:id=|\/d\/)([-\w]{20,})/);
  if (m && /google\.com/.test(first)) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
  return /^https?:\/\//.test(first) ? first : "";
}

const cleanLink = (v) => (/^https?:\/\//.test(v) ? v : "");

function rowsToEpisodes(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  const list = rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i] || ""; });
    return o;
  });

  const eps = list
    .map((o) => {
      const date = parseDate(pick(o, ["date"]));
      const title = pick(o, ["title"]);
      if (!title || !date) return null;
      const links = {};
      PLATFORMS.forEach((p) => {
        const v = cleanLink(pick(o, [p.key]));
        if (v) links[p.key] = v;
      });
      return {
        title,
        date,
        duration: pick(o, ["duration"]),
        description: pick(o, ["description"]),
        tags: pick(o, ["tag", "filter", "categor"]).split(",").map((t) => t.trim()).filter(Boolean),
        cover: coverUrl(pick(o, ["cover", "image", "picture", "photo"])),
        links,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date); // oldest first, so numbering is 01, 02, 03...

  return eps.map((e, i) => ({ ...e, id: i + 1, angle: (i * 67 + 120) % 360 }));
}

/* ---------------- BRAND LOGOS (full colour) ---------------- */
function Logo({ k, className = "h-6 w-6" }) {
  switch (k) {
    case "spotify":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#1DB954" />
          <g fill="none" stroke="#0b0b0b" strokeLinecap="round">
            <path d="M5.6 9.1c4.4-1.3 9.7-.9 13.2 1.2" strokeWidth="2" />
            <path d="M6.3 12.6c3.7-1.1 7.8-.7 10.9 1.1" strokeWidth="1.7" />
            <path d="M7 15.8c3-.8 6.1-.5 8.5.9" strokeWidth="1.4" />
          </g>
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="0.5" y="4" width="23" height="16" rx="5" fill="#FF0000" />
          <path d="M9.8 8.7v6.6l5.7-3.3-5.7-3.3z" fill="#fff" />
        </svg>
      );
    case "apple":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="apg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F452FF" />
              <stop offset="1" stopColor="#832BC1" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="5.5" fill="url(#apg)" />
          <g fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="1.5">
            <path d="M9.1 12.1A3.6 3.6 0 1 1 14.9 12.1" />
            <path d="M7.2 13.2A5.8 5.8 0 1 1 16.8 13.2" />
          </g>
          <circle cx="12" cy="10" r="1.8" fill="#fff" />
          <path d="M12 12.4c-1.2 0-1.9.8-1.9 1.9 0 1.7.8 4.1 1.9 4.1s1.9-2.4 1.9-4.1c0-1.1-.7-1.9-1.9-1.9z" fill="#fff" />
        </svg>
      );
    case "amazon":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="amg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2FE0E8" />
              <stop offset="1" stopColor="#0E8FA0" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="5.5" fill="url(#amg)" />
          <g fill="none" stroke="#06202a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
            <path d="M5 16.2c4.3 2.6 9.4 2.4 13.6-.5" />
            <path d="M16.1 15.1l2.6.6-.9 2.5" />
          </g>
          <path d="M10.4 6.6v6.2" stroke="#06202a" strokeWidth="1.7" strokeLinecap="round" fill="none" />
          <path d="M10.4 6.6l4.3-.9v5.8" stroke="#06202a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="9" cy="13" r="1.7" fill="#06202a" />
          <circle cx="13.3" cy="12" r="1.7" fill="#06202a" />
        </svg>
      );
    default:
      return null;
  }
}

const Icon = {
  search: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
  ),
  playSm: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
  ),
};

/* ---------------- HELPERS ---------------- */
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ---------------- HERO BACKDROP (misty forest + fireflies) ---------------- */
function Fireflies({ count = 110 }) {
  const flies = useMemo(() => {
    let s = 11;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const range = (a, b) => a + rnd() * (b - a);
    return Array.from({ length: count }, (_, i) => {
      const layer = i % 10 < 5 ? "far" : i % 10 < 9 ? "mid" : "near";
      const size = layer === "far" ? range(1.5, 2.5) : layer === "mid" ? range(3, 5) : range(7, 12);
      return {
        layer,
        left: range(0, 100),
        top: range(6, 92),
        size,
        wander: range(9, 20),
        blink: range(2.2, 5.5),
        delay: -range(0, 14),
        dx: range(-70, 70),
        dy: range(-60, 40),
        dx2: range(-50, 50),
        dy2: range(-50, 30),
      };
    });
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {flies.map((f, i) => (
        <span
          key={i}
          className={`firefly firefly-${f.layer} absolute rounded-full`}
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            "--dx": `${f.dx}px`,
            "--dy": `${f.dy}px`,
            "--dx2": `${f.dx2}px`,
            "--dy2": `${f.dy2}px`,
            animationDuration: `${f.wander}s, ${f.blink}s`,
            animationDelay: `${f.delay}s, ${f.delay / 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function HeroBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#06120e]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 38% 46% at 52% 34%, rgba(255,226,160,.85) 0%, rgba(214,170,92,.45) 35%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 50% 62%, rgba(120,150,90,.45) 0%, transparent 70%),
            radial-gradient(ellipse 30% 70% at 8% 40%, rgba(10,32,18,.95) 0%, transparent 100%),
            radial-gradient(ellipse 30% 70% at 94% 40%, rgba(34,48,22,.9) 0%, transparent 100%),
            linear-gradient(180deg, #1b2a1a 0%, #263a24 45%, #0a1a12 100%)`,
        }}
      />
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <div
        className="absolute left-1/2 top-0 h-full w-[70%] -translate-x-1/2 opacity-40 mix-blend-screen"
        style={{
          background:
            "conic-gradient(from 180deg at 50% -10%, transparent 0deg, rgba(255,230,170,.35) 14deg, transparent 24deg, rgba(255,230,170,.25) 38deg, transparent 52deg, rgba(255,230,170,.3) 66deg, transparent 80deg)",
        }}
      />
      <Fireflies />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_36%_at_50%_44%,rgba(4,22,16,.78),transparent_72%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,.6)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[#07130d]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
    </div>
  );
}

function PageBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-[7px]"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <div className="absolute inset-0 bg-[#06120c]/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_88%_0%,rgba(255,200,100,.2),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_8%_100%,rgba(40,110,60,.35),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.55)_100%)]" />
      <div className="absolute inset-0 opacity-60"><Fireflies count={34} /></div>
    </div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */
function Ornament({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="gold-line h-px w-16 md:w-28" />
      <span className="h-2 w-2 rotate-45 bg-gold shadow-[0_0_12px_rgba(224,185,79,.9)]" />
      <span className="gold-line h-px w-16 md:w-28" />
    </div>
  );
}

function SectionTitle({ children, accent }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="font-display text-3xl font-bold md:text-4xl">
        {children} <span className="gold-text italic">{accent}</span>
      </h2>
      <span className="gold-line-l h-px flex-1" />
      <span className="hidden h-2 w-2 rotate-45 bg-gold sm:block" />
    </div>
  );
}

/* Uses the cover picture from the sheet; falls back to the forest if there is none */
function Cover({ ep, className = "" }) {
  const [broken, setBroken] = useState(false);
  const spots = ["18% 32%", "74% 60%", "50% 22%", "88% 30%", "30% 78%"];
  const pos = spots[(ep.id - 1) % spots.length];
  const hasCover = ep.cover && !broken;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-gold/45 ${className}`}
      style={{
        backgroundImage: `url(${HERO_IMAGE}), linear-gradient(${ep.angle}deg, #1d3a22, #07130d)`,
        backgroundSize: "280%, cover",
        backgroundPosition: `${pos}, center`,
        backgroundRepeat: "no-repeat",
      }}
    >
      {hasCover && (
        <img
          src={ep.cover}
          alt={ep.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#06120c]/90" />
      {!hasCover && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(255,210,120,.28),transparent_55%)]" />
      )}
      <div className="absolute inset-2 rounded-xl border border-gold/35" />
      <span className="gold-text absolute bottom-5 left-6 font-display text-6xl font-black leading-none drop-shadow-[0_4px_18px_rgba(0,0,0,.7)]">
        {String(ep.id).padStart(2, "0")}
      </span>
      <span className="absolute left-6 top-6 text-[9px] tracking-[0.3em] text-gold-lt/90">
        A DATE WITH WISDOM
      </span>
    </div>
  );
}

function PlatformButtons({ links, size = "sm" }) {
  const big = size === "lg";
  return (
    <div className="flex flex-wrap gap-2.5">
      {PLATFORMS.filter((p) => links[p.key]).map((p) => (
        <a
          key={p.key}
          href={links[p.key]}
          target="_blank"
          rel="noreferrer"
          title={`Listen on ${p.label}`}
          className={`inline-flex items-center gap-2.5 rounded-full border border-gold/35 bg-white/[0.04] text-white/90 transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10 hover:shadow-[0_8px_28px_-6px_rgba(224,185,79,.55)] ${
            big ? "py-2 pl-2.5 pr-5 text-sm font-medium" : "p-2"
          }`}
        >
          <Logo k={p.key} className={big ? "h-7 w-7" : "h-6 w-6"} />
          {big && p.label}
        </a>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-3xl border border-gold/15 bg-[#0b1d13]/50 p-4">
      <div className="aspect-square rounded-2xl bg-[#1a3524]/70" />
      <div className="h-4 w-3/4 rounded bg-[#1a3524]/70" />
      <div className="h-3 w-full rounded bg-[#1a3524]/70" />
    </div>
  );
}

function EpisodeCard({ ep, i }) {
  return (
    <article
      style={{ animationDelay: `${i * 70}ms` }}
      className="group relative animate-fade-up overflow-hidden rounded-3xl border border-gold/25 bg-[#0b1d13]/55 p-4 backdrop-blur-md transition duration-300 hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-[0_24px_70px_-18px_rgba(255,190,80,.4)]"
    >
      <span className="gold-line absolute inset-x-8 top-0 h-px opacity-70" />
      <div className="relative">
        <Cover ep={ep} className="aspect-square w-full" />
        <span className="gold-bg absolute bottom-3 right-3 grid h-12 w-12 translate-y-2 place-items-center rounded-full text-ink opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
          {Icon.play}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-[#c4cfb8]">
        <span>{fmt(ep.date)}</span>
        {ep.duration && (<><span className="text-gold">◆</span><span>{ep.duration}</span></>)}
      </div>
      <h3 className="mt-2 font-display text-xl font-bold leading-snug">{ep.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-[#c4cfb8]">{ep.description}</p>
      <div className="mt-4 border-t border-gold/20 pt-4">
        <PlatformButtons links={ep.links} />
      </div>
    </article>
  );
}

/* ---------------- PAGE ---------------- */
export default function Home() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    const url = `${SHEET_URL}${SHEET_URL.includes("?") ? "&" : "?"}t=${Date.now()}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("bad response");
        return r.text();
      })
      .then((csv) => setEpisodes(rowsToEpisodes(parseCSV(csv))))
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // newest first; the newest one is the "Latest Episode"
  const sorted = useMemo(() => [...episodes].sort((a, b) => b.date - a.date), [episodes]);
  const latest = sorted[0];
  // filter buttons are built from whatever tags exist in the sheet
  const tags = useMemo(() => ["All", ...new Set(episodes.flatMap((e) => e.tags))], [episodes]);

  const filtered = sorted.filter((e) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    const matchT = tag === "All" || e.tags.includes(tag);
    return matchQ && matchT;
  });

  const focusSearch = () => {
    document.getElementById("episodes")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => searchRef.current?.focus(), 500);
  };

  return (
    <div className="relative min-h-screen bg-[#07130d] text-white">
      <PageBackdrop />
      <style>{`
        @keyframes ff-wander {
          0%   { transform: translate(0, 0); }
          33%  { transform: translate(var(--dx), var(--dy)); }
          66%  { transform: translate(var(--dx2), var(--dy2)); }
          100% { transform: translate(calc(var(--dx) * -.6), calc(var(--dy) * -.5)); }
        }
        @keyframes ff-blink {
          0%, 100% { opacity: .08; }
          20%      { opacity: 1; }
          35%      { opacity: .4; }
          55%      { opacity: 1; }
          75%      { opacity: .15; }
        }
        .firefly {
          background: radial-gradient(circle, #fffbe0 0%, #ffe27a 40%, rgba(255,213,106,0) 72%);
          animation: ff-wander ease-in-out infinite alternate, ff-blink ease-in-out infinite;
          will-change: transform, opacity;
        }
        .firefly-far  { box-shadow: 0 0 6px 2px rgba(255,213,106,.5); opacity: .7; }
        .firefly-mid  { box-shadow: 0 0 14px 5px rgba(255,213,106,.7), 0 0 30px 10px rgba(255,190,70,.25); }
        .firefly-near {
          filter: blur(1.5px);
          box-shadow: 0 0 26px 12px rgba(255,213,106,.55), 0 0 60px 24px rgba(255,180,60,.22);
        }
        @media (prefers-reduced-motion: reduce) {
          .firefly { animation: none; opacity: .75; }
        }
      `}</style>

      {/* NAVBAR */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition ${
          scrolled ? "bg-[#07130d]/75 backdrop-blur-xl" : ""
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <a href="#top" className="font-display text-xs font-bold tracking-[0.25em] md:text-sm">
            A DATE WITH <span className="gold-text">WISDOM</span>
          </a>
          <div className="flex items-center gap-1 text-xs text-white/80">
            <a href="#latest" className="hidden rounded-full px-4 py-2 hover:text-gold-lt sm:block">Latest</a>
            <a href="#episodes" className="hidden rounded-full px-4 py-2 hover:text-gold-lt sm:block">Episodes</a>
            <a href="#about" className="hidden rounded-full px-4 py-2 hover:text-gold-lt sm:block">About</a>
            <button onClick={focusSearch} aria-label="Search" className="rounded-full p-2.5 text-white/90 hover:bg-gold/10 hover:text-gold-lt">
              {Icon.search}
            </button>
          </div>
        </nav>
        {scrolled && <span className="gold-line block h-px w-full opacity-60" />}
      </header>

      {/* HERO */}
      <section id="top" className="relative z-10 flex min-h-[100svh] flex-col overflow-hidden px-5 text-center">
        <HeroBackdrop />

        <div className="pointer-events-none absolute left-1/2 top-[22%] h-[460px] w-[460px] -translate-x-1/2 rounded-full border border-gold/15" />
        <div className="pointer-events-none absolute left-1/2 top-[30%] h-[320px] w-[320px] -translate-x-1/2 rounded-full border border-gold/10" />

        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center pb-10 pt-28">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.45em] text-gold-lt">
            <span className="mr-2 text-gold">✦</span>The Podcast<span className="ml-2 text-gold">✦</span>
          </p>

          <h1 className="font-display font-black leading-[1.02] drop-shadow-[0_6px_30px_rgba(0,0,0,.65)]">
            <span className="block text-5xl sm:text-7xl md:text-[5.5rem]">A Date With</span>
            <span className="gold-text block animate-shine text-6xl italic drop-shadow-[0_4px_30px_rgba(224,185,79,.35)] sm:text-8xl md:text-[6.5rem]">
              Wisdom
            </span>
          </h1>

          <div className="mt-6 flex items-center justify-center gap-4">
            <span className="gold-line h-px w-14 md:w-28" />
            <p className="font-display text-lg italic tracking-wide text-gold-lt drop-shadow-[0_2px_12px_rgba(0,0,0,.85)] md:text-2xl">
              by {SHOW.author}
            </p>
            <span className="gold-line h-px w-14 md:w-28" />
          </div>

          <p className="mx-auto mt-7 max-w-md text-base text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,.8)] md:max-w-lg md:text-lg">
            {SHOW.tagline}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#latest"
              className="gold-bg inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-ink shadow-[0_10px_36px_-8px_rgba(224,185,79,.85)] transition hover:scale-105"
            >
              {Icon.playSm} Listen Now
            </a>
            <a
              href="#episodes"
              className="rounded-full border border-white/10 bg-black/35 px-7 py-3 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-gold/60 hover:text-gold-lt"
            >
              Browse Episodes
            </a>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3 pb-8 text-[10px] uppercase tracking-[0.18em] text-white/70">
          <span className="text-white/55">Available on</span>
          {PLATFORMS.map((p) => (
            <span key={p.key} className="flex items-center gap-2 font-medium text-white/85">
              <Logo k={p.key} className="h-5 w-5" />{p.label}
            </span>
          ))}
        </div>
      </section>

      <main className="relative z-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#07130d] to-transparent" />

        {/* LATEST */}
        <section id="latest" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 pt-16 md:px-8">
          <div className="mb-8"><SectionTitle accent="Episode">Latest</SectionTitle></div>

          {loading ? (
            <div className="grid gap-8 md:grid-cols-[340px_1fr]"><Skeleton /><Skeleton /></div>
          ) : !latest ? (
            <div className="rounded-3xl border border-dashed border-gold/30 bg-[#0b1d13]/50 py-16 text-center backdrop-blur-md">
              <p className="font-display text-2xl">
                {error ? "Couldn't load episodes" : "No episodes yet"}
              </p>
              <p className="mt-2 text-[#c4cfb8]">
                {error ? "Please check your connection and refresh the page." : "New episodes will appear here soon."}
              </p>
            </div>
          ) : (
            <div className="relative grid animate-fade-up items-center gap-8 overflow-hidden rounded-[2rem] border border-gold/35 bg-[#0b1d13]/55 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-md md:grid-cols-[340px_1fr] md:gap-12 md:p-10">
              <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-gold/25 blur-[110px]" />
              <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-[#2f7a45]/30 blur-[110px]" />
              <div className="pointer-events-none absolute inset-2.5 rounded-[1.6rem] border border-gold/15" />
              <span className="gold-line absolute inset-x-12 top-0 h-px" />
              <Cover ep={latest} className="aspect-square w-full" />
              <div className="relative">
                <span className="gold-bg inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest text-ink">
                  New episode
                </span>
                <h3 className="mt-4 font-display text-3xl font-black leading-tight md:text-5xl">{latest.title}</h3>
                <p className="mt-3 text-sm text-[#c4cfb8]">
                  {fmt(latest.date)}
                  {latest.duration && (<> <span className="text-gold">◆</span> {latest.duration}</>)}
                </p>
                <p className="mt-5 max-w-xl text-[#c4cfb8]">{latest.description}</p>
                <div className="mt-8"><PlatformButtons links={latest.links} size="lg" /></div>
              </div>
            </div>
          )}
        </section>

        {/* EPISODES */}
        <section id="episodes" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8">
          <SectionTitle accent="Episodes">All</SectionTitle>

          <label className="mt-8 flex w-full items-center gap-3 rounded-full border border-gold/30 bg-[#0b1d13]/60 px-5 py-3 text-gold-lt backdrop-blur-md transition focus-within:border-gold focus-within:shadow-[0_0_0_4px_rgba(224,185,79,.15)] md:max-w-md">
            {Icon.search}
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search episodes…"
              className="w-full bg-transparent text-white outline-none placeholder:text-[#c4cfb8]/60"
            />
          </label>

          {tags.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`rounded-full border px-5 py-2 text-sm font-medium backdrop-blur-md transition ${
                    tag === t
                      ? "gold-bg border-transparent text-ink shadow-[0_6px_24px_-6px_rgba(224,185,79,.6)]"
                      : "border-gold/25 bg-[#0b1d13]/45 text-white/85 hover:border-gold hover:text-gold-lt"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)
              : filtered.map((ep, i) => <EpisodeCard key={ep.id} ep={ep} i={i} />)}
          </div>

          {!loading && episodes.length > 0 && filtered.length === 0 && (
            <div className="mt-16 rounded-3xl border border-dashed border-gold/30 bg-[#0b1d13]/50 py-20 text-center backdrop-blur-md">
              <p className="font-display text-2xl">No episodes found</p>
              <p className="mt-2 text-[#c4cfb8]">Try a different search or tag.</p>
              <button
                onClick={() => { setQuery(""); setTag("All"); }}
                className="gold-bg mt-6 rounded-full px-6 py-2.5 font-semibold text-ink"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* ABOUT */}
        <section id="about" className="relative scroll-mt-24 overflow-hidden px-5 pb-28 text-center md:px-8">
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-[640px] -translate-x-1/2 rounded-full bg-gold/15 blur-[120px]" />
          <Ornament className="relative mb-14" />
          <div className="relative mx-auto max-w-4xl">
            <p className="text-xs uppercase tracking-[0.5em] text-gold">About the show</p>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">
              Slow conversations, <span className="gold-text italic">lasting ideas.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#c4cfb8]">{SHOW.about}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {SHOW.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="rounded-full border border-gold/35 bg-[#0b1d13]/50 px-5 py-2.5 text-sm text-gold-lt backdrop-blur-md transition hover:bg-gold hover:text-ink hover:shadow-[0_8px_28px_-6px_rgba(224,185,79,.6)]"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#050e09]/80 backdrop-blur-md">
          <span className="gold-line block h-px w-full" />
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
            <div className="text-center md:text-left">
              <p className="font-display text-sm font-bold tracking-[0.25em]">
                A DATE WITH <span className="gold-text">WISDOM</span>
              </p>
              <p className="mt-1 font-display text-sm italic text-gold-lt">by {SHOW.author}</p>
              <p className="mt-2 text-xs text-[#c4cfb8]">© {new Date().getFullYear()} All rights reserved.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="mr-1 text-xs uppercase tracking-widest text-gold">Available on</span>
              {PLATFORMS.map((p) => (
                <span key={p.key} title={p.label} className="transition hover:-translate-y-0.5">
                  <Logo k={p.key} className="h-7 w-7" />
                </span>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}