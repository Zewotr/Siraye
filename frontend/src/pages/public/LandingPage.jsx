import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Icon from "../../components/Icon";
import { applyThemeColor, PRESET_COLORS } from "../../utils/theme";

const SHOWCASE_TABS = [
  { id: "schedule", label: "Weekly Schedule", icon: "calendarCheck", tag: "Strict 1-at-a-time" },
  { id: "timer", label: "Pomotroid Timer", icon: "clock", tag: "25m Flow & Chimes" },
  { id: "tracker", label: "Punctuality Tracker", icon: "trendingUp", tag: "Delivery Evaluation" },
  { id: "sidebar", label: "Next 3-5 Tasks", icon: "sidebar", tag: "Instant Queue" },
];

export default function LandingPage() {
  // ==========================================
  // Section 2: Auto-Changing Showcase State
  // ==========================================
  const [activeShowcase, setActiveShowcase] = useState("schedule");
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-advance tabs every 5 seconds
  useEffect(() => {
    if (isPaused) return;

    const intervalMs = 60;
    const totalDuration = 5000;
    const step = (intervalMs / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          setActiveShowcase((current) => {
            const idx = SHOWCASE_TABS.findIndex((t) => t.id === current);
            return SHOWCASE_TABS[(idx + 1) % SHOWCASE_TABS.length].id;
          });
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused]);

  function handleSelectTab(tabId) {
    setActiveShowcase(tabId);
    setProgress(0);
  }

  function handleNextTab() {
    const idx = SHOWCASE_TABS.findIndex((t) => t.id === activeShowcase);
    handleSelectTab(SHOWCASE_TABS[(idx + 1) % SHOWCASE_TABS.length].id);
  }

  function handlePrevTab() {
    const idx = SHOWCASE_TABS.findIndex((t) => t.id === activeShowcase);
    handleSelectTab(SHOWCASE_TABS[(idx - 1 + SHOWCASE_TABS.length) % SHOWCASE_TABS.length].id);
  }

  // Interactive Weekly Schedule Tab State
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [urgentOverrideActive, setUrgentOverrideActive] = useState(false);

  // Interactive Pomotroid Timer Tab State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1499); // 24:59
  const [timerMode, setTimerMode] = useState("focus"); // 'focus' | 'short' | 'long'
  const timerMinutes = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;
  const formattedTimer = `${String(timerMinutes).padStart(2, "0")}:${String(timerSecs).padStart(2, "0")}`;

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  function switchTimerMode(mode) {
    setTimerMode(mode);
    setTimerRunning(false);
    if (mode === "focus") setTimerSeconds(25 * 60);
    else if (mode === "short") setTimerSeconds(5 * 60);
    else setTimerSeconds(15 * 60);
  }

  // Interactive Punctuality Tracker Filter State
  const [trackerFilter, setTrackerFilter] = useState("all");

  // Interactive Next Tasks Sidebar State
  const [nextTasks, setNextTasks] = useState([
    { id: 1, title: "Review Pull Request #41 (Session Auth)", due: "Due in 2h", prio: "urgent", done: false },
    { id: 2, title: "Deploy Frontend Container to Production", due: "Today 17:00", prio: "high", done: false },
    { id: 3, title: "Run Database Vacuum & Auto-Backup", due: "Tomorrow", prio: "medium", done: false },
    { id: 4, title: "Verify Multi-Tenant 100 Concurrency", due: "Friday", prio: "high", done: false },
  ]);

  function toggleTaskDone(id) {
    setNextTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  // ==========================================
  // Section 3: Advanced Daily Tasks + Calendar Integration State
  // ==========================================
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(22);
  const [agendaFilter, setAgendaFilter] = useState("all"); // 'all' | 'pending' | 'completed'
  const [dailyAgendaTasks, setDailyAgendaTasks] = useState([
    {
      id: "t1",
      date: 22,
      time: "09:00 - 10:30",
      title: "Sprint Architecture & API Specs",
      project: "Platform V2",
      priority: "high",
      done: true,
      blockDuration: "90 min",
    },
    {
      id: "t2",
      date: 22,
      time: "11:00 - 12:30",
      title: "Database Migration & Index Profiling",
      project: "Database Core",
      priority: "medium",
      done: true,
      blockDuration: "90 min",
    },
    {
      id: "t3",
      date: 22,
      time: "14:00 - 15:30",
      title: "Client Dashboard UI Review & Polish",
      project: "Frontend Design",
      priority: "urgent",
      done: false,
      blockDuration: "90 min",
    },
    {
      id: "t4",
      date: 22,
      time: "16:30 - 17:30",
      title: "Weekly Schedule Lock & QA Smoke Test",
      project: "Engineering QA",
      priority: "high",
      done: false,
      blockDuration: "60 min",
    },
    {
      id: "t5",
      date: 23,
      time: "09:30 - 11:00",
      title: "Deploy Redis Distributed Locks",
      project: "Platform V2",
      priority: "urgent",
      done: false,
      blockDuration: "90 min",
    },
    {
      id: "t6",
      date: 23,
      time: "13:00 - 14:30",
      title: "Punctuality Engine Margin Benchmark",
      project: "Analytics",
      priority: "high",
      done: false,
      blockDuration: "90 min",
    },
    {
      id: "t7",
      date: 24,
      time: "10:00 - 12:00",
      title: "Full Production Disaster Recovery Drill",
      project: "Infrastructure",
      priority: "medium",
      done: false,
      blockDuration: "120 min",
    },
  ]);

  const filteredDailyTasks = useMemo(() => {
    const forDate = dailyAgendaTasks.filter((t) => t.date === calendarSelectedDate);
    if (agendaFilter === "pending") return forDate.filter((t) => !t.done);
    if (agendaFilter === "completed") return forDate.filter((t) => t.done);
    return forDate;
  }, [dailyAgendaTasks, calendarSelectedDate, agendaFilter]);

  function toggleDailyTaskDone(id) {
    setDailyAgendaTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function addQuickBlock() {
    const nextId = `t-${Date.now()}`;
    const newTask = {
      id: nextId,
      date: calendarSelectedDate,
      time: "18:00 - 19:00",
      title: `Dedicated Deep Work on Day #${calendarSelectedDate}`,
      project: "General Workflow",
      priority: "medium",
      done: false,
      blockDuration: "60 min",
    };
    setDailyAgendaTasks((prev) => [...prev, newTask]);
  }

  // ==========================================
  // Modern Footer State
  // ==========================================
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [isNewsletterLoading, setIsNewsletterLoading] = useState(false);
  const [activeAccentHex, setActiveAccentHex] = useState(
    () => localStorage.getItem("siraye:color") || "#255A54"
  );
  const [footerDarkMode, setFooterDarkMode] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  function handleNewsletterSubmit(e) {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) return;
    setIsNewsletterLoading(true);
    setTimeout(() => {
      setIsNewsletterLoading(false);
      setNewsletterSubmitted(true);
    }, 600);
  }

  function handlePaletteChange(hexColor) {
    setActiveAccentHex(hexColor);
    applyThemeColor(hexColor);
  }

  function toggleFooterTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    setFooterDarkMode(isDark);
    localStorage.setItem("siraye:theme", isDark ? "dark" : "light");
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="w-full space-y-28 pb-12 pt-4">
      {/* ========================================================== */}
      {/* 1. HERO SECTION                                            */}
      {/* ========================================================== */}
      <section className="relative mx-auto max-w-6xl px-4 pt-6 text-center sm:px-6 lg:pt-12">
        {/* Glow ambient background effects */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-12 h-96 w-full max-w-3xl rounded-full bg-gradient-to-b from-brand-300/20 via-brand-500/10 to-transparent blur-3xl dark:from-brand-500/15" />

        {/* Top Product Announcement Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/80 px-4 py-1.5 text-xs font-bold text-brand-800 shadow-xs backdrop-blur-md dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
          <span className="flex h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400 animate-ping" />
          <span>Introducing Siraye 2.0 · Weekly Coordination, Pomotroid & Punctuality Analytics</span>
        </div>

        {/* Main Headline */}
        <h1 className="mt-8 font-heading text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl sm:leading-[1.12] lg:text-7xl">
          Master your schedule. <br />
          <span className="bg-gradient-to-r from-brand-700 via-brand-500 to-teal-600 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-teal-300">
            One task at a time.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
          Siraye is the all-in-one productivity operating system engineered for flow state. Coordinate strict 1-task-at-a-time weekly schedules, lock Monday-to-Sunday execution, focus with the Pomotroid timer, and track objective punctuality metrics.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-brand-700 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-brand-700/25 transition hover:bg-brand-800 active:scale-95"
            to="/signup"
          >
            Get started free
            <Icon name="arrowUpRight" size={17} />
          </Link>
          <Link
            className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-800 dark:border-slate-800 dark:bg-[#171822] dark:text-slate-200 dark:hover:bg-slate-800"
            to="/login"
          >
            Explore live demo
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Icon name="check" size={15} className="text-emerald-500" /> No chaotic multitasking
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="check" size={15} className="text-emerald-500" /> Weekly commitment locking
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="check" size={15} className="text-emerald-500" /> Punctuality scoring
          </span>
        </div>

        {/* ========================================================== */}
        {/* 2. SECOND SECTION: DYNAMIC AUTO-CHANGING SHOWCASE          */}
        {/* ========================================================== */}
        <div
          className="relative mt-14 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-2 shadow-2xl shadow-brand-900/10 dark:border-slate-800 dark:bg-[#171822] sm:p-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Showcase Tabs & Auto-Play Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-bold text-slate-400">siraye.app</span>

              {/* Auto-Play Status Indicator */}
              <div className="ml-3 hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
                <span>{isPaused ? "Paused" : "Auto-cycling"}</span>
              </div>
            </div>

            {/* Showcase Tab Nav Buttons with Dynamic Progress Bars */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
              {SHOWCASE_TABS.map((tab) => {
                const isActive = activeShowcase === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    className={`relative overflow-hidden inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? "bg-white text-brand-700 shadow-xs dark:bg-slate-800 dark:text-brand-300"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Icon name={tab.icon} size={14} />
                    <span>{tab.label}</span>

                    {/* Progress Bar under active tab */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 h-0.5 bg-brand-600 dark:bg-brand-400 transition-all duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </button>
                );
              })}

              {/* Prev / Play-Pause / Next Controls */}
              <div className="flex items-center gap-0.5 pl-1 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevTab}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                  title="Previous tab"
                >
                  <Icon name="chevronLeft" size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                  title={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
                >
                  <Icon name={isPaused ? "play" : "pause"} size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleNextTab}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                  title="Next tab"
                >
                  <Icon name="chevronRight" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="relative min-h-[420px] rounded-2xl bg-[#f8f9fc] p-6 text-left dark:bg-[#10111a]">
            {/* TAB 1: WEEKLY SCHEDULE */}
            {activeShowcase === "schedule" && (
              <div className="space-y-4 animate-enter">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
                        <Icon name="lock" size={12} /> Week in progress (Locked Monday–Sunday)
                      </span>
                      {urgentOverrideActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300">
                          <Icon name="zap" size={11} /> Override Active
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 font-heading text-lg font-bold text-slate-900 dark:text-white">
                      Strict 1-Task-at-a-Time Weekly Coordination
                    </h3>
                    <p className="text-xs text-slate-400">
                      Commit to the upcoming week in advance. Once Monday begins, slots lock to eliminate distraction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUrgentOverrideActive((prev) => !prev)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                      urgentOverrideActive
                        ? "bg-rose-700 text-white"
                        : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300"
                    }`}
                  >
                    {urgentOverrideActive ? "Exit Urgent Mode" : "⚡ Test Urgent Override"}
                  </button>
                </div>

                {/* 7-Day Interactive Columns */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {[
                    { day: "Monday", color: "border-indigo-300 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20", badge: "bg-indigo-600", task: "Backend API Auth & Session Store", slot: "08:30 - 11:30" },
                    { day: "Tuesday", color: "border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20", badge: "bg-amber-600", task: "Database Migrations & Redis Health", slot: "10:15 - 13:00" },
                    { day: "Wednesday", color: "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20", badge: "bg-emerald-600", task: "Vite Bundle Tuning & Theme Sync", slot: "12:00 - 15:00" },
                    { day: "Thursday", color: "border-sky-300 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/20", badge: "bg-sky-600", task: "Calendar Integration & Dual Stream", slot: "14:00 - 16:30" },
                    { day: "Friday", color: "border-violet-300 bg-violet-50/50 dark:border-violet-900/60 dark:bg-violet-950/20", badge: "bg-violet-600", task: "Punctuality Analytics Engine", slot: "15:45 - 18:00" },
                    { day: "Saturday", color: "border-rose-300 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20", badge: "bg-rose-600", task: "QA Smoke Testing & High Concurrency", slot: "10:00 - 12:00" },
                    { day: "Sunday", color: "border-teal-300 bg-teal-50/50 dark:border-teal-900/60 dark:bg-teal-950/20", badge: "bg-teal-600", task: "Weekly Plan Review & Lock Next Week", slot: "17:30 - 19:00" },
                  ].map((item) => {
                    const isSelected = selectedDay === item.day;
                    return (
                      <button
                        key={item.day}
                        type="button"
                        onClick={() => setSelectedDay(item.day)}
                        className={`text-left rounded-2xl border p-3 text-xs transition cursor-pointer ${item.color} ${
                          isSelected ? "ring-2 ring-slate-900 dark:ring-white scale-102 shadow-md" : "hover:scale-101"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${item.badge}`}>
                            {item.day}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">1 Slot</span>
                        </div>
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                          <span className="text-[10px] font-bold text-slate-400">{item.slot}</span>
                          <p className="mt-0.5 truncate font-bold text-slate-800 dark:text-slate-100">{item.task}</p>
                          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 dark:border-slate-800">
                            <span className="text-[9px] font-bold uppercase text-emerald-600">Locked</span>
                            <span className="text-[10px] text-brand-700 dark:text-brand-300 font-semibold">View</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: POMOTROID TIMER */}
            {activeShowcase === "timer" && (
              <div className="flex flex-col items-center justify-center py-4 text-center animate-enter">
                <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => switchTimerMode("focus")}
                    className={`rounded-xl px-3.5 py-1.5 transition ${
                      timerMode === "focus"
                        ? "bg-white text-brand-700 shadow-xs dark:bg-slate-800 dark:text-brand-300"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    Focus (25m)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTimerMode("short")}
                    className={`rounded-xl px-3.5 py-1.5 transition ${
                      timerMode === "short"
                        ? "bg-white text-sky-700 shadow-xs dark:bg-slate-800 dark:text-sky-300"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    Short Break (5m)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTimerMode("long")}
                    className={`rounded-xl px-3.5 py-1.5 transition ${
                      timerMode === "long"
                        ? "bg-white text-violet-700 shadow-xs dark:bg-slate-800 dark:text-violet-300"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    Long Break (15m)
                  </button>
                </div>

                {/* Circular Pomotroid Dial with live SVG Ring */}
                <div className="relative my-6 flex h-48 w-48 items-center justify-center rounded-full border-8 border-brand-500/20 bg-white shadow-soft dark:bg-slate-900">
                  <div className="text-center">
                    <p className="font-heading text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                      {formattedTimer}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Round 1 of 4 · {timerRunning ? "In Flow" : "Ready"}
                    </p>
                  </div>
                </div>

                {/* Interactive Controls */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => switchTimerMode(timerMode)}
                    className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    title="Reset round"
                  >
                    <Icon name="rotateCcw" size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimerRunning((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-700/20 hover:bg-brand-800 active:scale-95 transition"
                  >
                    <Icon name={timerRunning ? "pause" : "play"} size={14} />
                    <span>{timerRunning ? "Pause Timer" : "Start Focus Flow"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchTimerMode("short");
                      setTimerRunning(true);
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    title="Skip to break"
                  >
                    <Icon name="skipForward" size={17} />
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Harmonic sound chimes & auto-break progression built natively into the app.
                </p>
              </div>
            )}

            {/* TAB 3: PUNCTUALITY TRACKER */}
            {activeShowcase === "tracker" && (
              <div className="space-y-4 animate-enter">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                      Objective Consistency & Punctuality Engine
                    </h3>
                    <p className="text-xs text-slate-400">
                      Calculates delivery punctuality against committed weekly deadlines with zero guesswork.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                    {[
                      { id: "all", label: "All Audits" },
                      { id: "ontime", label: "On Time" },
                      { id: "streaks", label: "Streaks" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTrackerFilter(f.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          trackerFilter === f.id
                            ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI Metrics Matrix */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Punctuality Score</span>
                    <p className="mt-1 font-heading text-3xl font-bold text-emerald-600">94%</p>
                    <p className="text-[11px] text-slate-400">32 of 34 delivered on time</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consistency Index</span>
                    <p className="mt-1 font-heading text-3xl font-bold text-brand-700 dark:text-brand-300">89%</p>
                    <p className="text-[11px] text-slate-400">Execution adherence rate</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Streak</span>
                    <p className="mt-1 font-heading text-3xl font-bold text-amber-600">14 Days</p>
                    <p className="text-[11px] text-slate-400">Consecutive scheduled finishes</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Items</span>
                    <p className="mt-1 font-heading text-3xl font-bold text-slate-900 dark:text-white">0</p>
                    <p className="text-[11px] font-bold text-emerald-600">All commitments clear</p>
                  </div>
                </div>

                {/* Audit Stream */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Delivery Timestamp Audit</p>
                  <div className="mt-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Refactor WebSocket Connection Layer</p>
                        <span className="text-[10px] text-slate-400">Scheduled: Wed 15:00 · Finished: Wed 12:00</span>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        On Time (3h early)
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Implement Emergency Lock Override Dialog</p>
                        <span className="text-[10px] text-slate-400">Scheduled: Thu 18:00 · Finished: Thu 16:30</span>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        On Time (1.5h early)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NEXT TASKS QUEUE SIDEBAR */}
            {activeShowcase === "sidebar" && (
              <div className="flex justify-end animate-enter">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#171822]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                        <Icon name="sidebar" size={15} />
                      </span>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-white">Next Up Queue</h4>
                        <p className="text-[10px] text-slate-400">Click checkmarks to complete</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-300">
                      {nextTasks.filter((t) => !t.done).length} Remaining
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    {nextTasks.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 text-xs transition ${
                          item.done
                            ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20 opacity-75"
                            : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleTaskDone(item.id)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                              item.done
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-slate-300 bg-white hover:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
                            }`}
                          >
                            {item.done && <Icon name="check" size={12} strokeWidth={3} />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-400">#{idx + 1}</span>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                  item.prio === "urgent"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                    : item.prio === "high"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                }`}
                              >
                                {item.prio}
                              </span>
                            </div>
                            <p
                              className={`mt-1 font-semibold text-slate-800 dark:text-slate-100 ${
                                item.done ? "line-through text-slate-400 dark:text-slate-500" : ""
                              }`}
                            >
                              {item.title}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/50 pt-2 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400">{item.due}</span>
                          <button
                            type="button"
                            onClick={() => handleSelectTab("timer")}
                            className="text-[10px] font-bold text-brand-700 hover:underline dark:text-brand-300"
                          >
                            Focus Timer →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 3. NEW SECTION: INTEGRATED DAILY TASKS & CALENDAR MATRIX  */}
      {/* ========================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-bold text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-300">
            <Icon name="calendar" size={14} />
            Dual-Engine Synchronization
          </div>
          <h2 className="mt-3 font-heading text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Integrated Daily Tasks & Date-Click Calendar
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Macro monthly commitments and micro daily flow unified in a single interactive command center. Click any date on the calendar grid to immediately allocate focus time-blocks with zero overlapping chaos.
          </p>
        </div>

        {/* Dual Unified Interactive Dashboard Shell */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-[#171822] sm:p-7">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left 5 Cols: Interactive Date-Click Calendar */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    <Icon name="calendar" size={15} />
                  </span>
                  <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                    October 2026
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                  <span className="rounded-lg bg-white p-1 shadow-xs dark:bg-slate-800 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                    <Icon name="chevronLeft" size={13} />
                  </span>
                  <span className="rounded-lg bg-white p-1 shadow-xs dark:bg-slate-800 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                    <Icon name="chevronRight" size={13} />
                  </span>
                </div>
              </div>

              {/* Calendar Grid Header */}
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
                <span>Su</span>
              </div>

              {/* Calendar Days Matrix */}
              <div className="mt-2 grid grid-cols-7 gap-1 text-xs">
                {/* Simulated October Days */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const isSelected = calendarSelectedDate === day;
                  const hasTasks = [22, 23, 24].includes(day);
                  const isPast = day < 22;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setCalendarSelectedDate(day)}
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2 transition ${
                        isSelected
                          ? "bg-brand-700 text-white font-extrabold shadow-md shadow-brand-700/25 ring-2 ring-brand-500/30"
                          : isPast
                          ? "text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                          : "text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800 font-semibold"
                      }`}
                    >
                      <span>{day}</span>
                      {hasTasks && (
                        <span
                          className={`mt-1 h-1.5 w-1.5 rounded-full ${
                            isSelected ? "bg-white" : day === 22 ? "bg-brand-600" : "bg-sky-500"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Date Selection Callout Card */}
              <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 dark:border-brand-500/20 dark:bg-brand-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900 dark:text-brand-200">
                    Selected: Thursday, Oct {calendarSelectedDate}
                  </span>
                  <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-bold text-white">
                    4 Blocks
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-brand-700/90 dark:text-brand-300 leading-relaxed">
                  Click any date cell above to inspect, time-block, and coordinate your single-task schedule.
                </p>
              </div>
            </div>

            {/* Right 7 Cols: Connected Daily Task Stream */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      Daily Execution Stream · Oct {calendarSelectedDate}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Time-blocked agenda automatically synced from calendar deadlines
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900 text-xs">
                  {[
                    { id: "all", label: "All" },
                    { id: "pending", label: "Pending" },
                    { id: "completed", label: "Done" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setAgendaFilter(filter.id)}
                      className={`rounded-lg px-2.5 py-1 font-bold transition ${
                        agendaFilter === filter.id
                          ? "bg-white text-brand-700 shadow-xs dark:bg-slate-800 dark:text-brand-300"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Items List */}
              <div className="space-y-3">
                {filteredDailyTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                    <Icon name="checkCircle" size={24} className="mx-auto text-emerald-500" />
                    <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                      No matching blocks on this date
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Select another day on the calendar or add a new focus block below.
                    </p>
                  </div>
                ) : (
                  filteredDailyTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 text-xs transition ${
                        task.done
                          ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                          : "border-slate-200 bg-white shadow-xs hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDailyTaskDone(task.id)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                            task.done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white hover:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
                          }`}
                        >
                          {task.done && <Icon name="check" size={12} strokeWidth={3} />}
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {task.time}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              • {task.project}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                task.priority === "urgent"
                                  ? "bg-rose-100 text-rose-700"
                                  : task.priority === "high"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-sky-100 text-sky-700"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p
                            className={`mt-1 font-bold text-slate-900 dark:text-white ${
                              task.done ? "line-through text-slate-400 dark:text-slate-500" : ""
                            }`}
                          >
                            {task.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {task.blockDuration}
                        </span>
                        <Link
                          to="/timer"
                          className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 hover:bg-brand-700 hover:text-white dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-700 dark:hover:text-white transition"
                        >
                          Focus
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Add Block CTA */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={addQuickBlock}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 transition"
                >
                  <Icon name="plus" size={14} />
                  <span>Schedule Focus Block for Oct {calendarSelectedDate}</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  Strict 1-task-at-a-time enforced
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Value Proposition Bullets */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#171822]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Icon name="calendarCheck" size={18} />
            </span>
            <h4 className="mt-3 font-heading text-sm font-bold text-slate-900 dark:text-white">
              1-Click Date Scheduling
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Click any calendar day to immediately allocate protected focus slots without leaving your workflow.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#171822]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Icon name="refreshCw" size={18} />
            </span>
            <h4 className="mt-3 font-heading text-sm font-bold text-slate-900 dark:text-white">
              Bi-Directional Status Sync
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Completing daily blocks immediately updates your macro monthly calendar dots and progress bars.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#171822]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Icon name="trendingUp" size={18} />
            </span>
            <h4 className="mt-3 font-heading text-sm font-bold text-slate-900 dark:text-white">
              Punctuality Audit Feeds
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Actual execution timestamps are logged against calendar due dates for objective punctuality scores.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 4. FEATURE DEEP DIVE GRID                                  */}
      {/* ========================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6" id="features">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
            Engineered for Flow State
          </p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Everything you need to orchestrate ambitious work.
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            No bloated menus. No endless nested lists. Siraye connects your tasks to a concrete weekly timeline with integrated focus and objective tracking.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <article className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft transition hover:border-brand-300 dark:border-slate-800 dark:bg-[#171822]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Icon name="calendarCheck" size={24} />
            </span>
            <h3 className="mt-5 font-heading text-xl font-bold text-slate-900 dark:text-white">
              Single-Task Weekly Planner
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Only 1 task at a time is permitted per slot. Say goodbye to overlapping chaos. Allocate work into structured focus blocks across all 7 days with non-repeating palette cues.
            </p>
          </article>

          {/* Feature 2 */}
          <article className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft transition hover:border-brand-300 dark:border-slate-800 dark:bg-[#171822]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Icon name="lock" size={24} />
            </span>
            <h3 className="mt-5 font-heading text-xl font-bold text-slate-900 dark:text-white">
              Commitment Lock & Urgent Override
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Plan the week ahead. When Monday starts, the schedule locks down so you focus on executing your commitments. Emergency cases are safely handled with the Urgent Schedule button.
            </p>
          </article>

          {/* Feature 3 */}
          <article className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft transition hover:border-brand-300 dark:border-slate-800 dark:bg-[#171822]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Icon name="clock" size={24} />
            </span>
            <h3 className="mt-5 font-heading text-xl font-bold text-slate-900 dark:text-white">
              Pomotroid Focus Board
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              A minimalist, aesthetic circular timer board. Set focus and break durations, track 4-round cycles, listen to pleasant chime alerts, and check off checklist items on the fly.
            </p>
          </article>

          {/* Feature 4 */}
          <article className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft transition hover:border-brand-300 dark:border-slate-800 dark:bg-[#171822]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              <Icon name="trendingUp" size={24} />
            </span>
            <h3 className="mt-5 font-heading text-xl font-bold text-slate-900 dark:text-white">
              Punctuality & Consistency Engine
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Know with certainty how reliably you deliver. Measure on-time vs late ratios, lead time margins, consecutive day streaks, and timeline trends with rich visual charts.
            </p>
          </article>

          {/* Feature 5 */}
          <article className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft transition hover:border-brand-300 dark:border-slate-800 dark:bg-[#171822]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              <Icon name="sidebar" size={24} />
            </span>
            <h3 className="mt-5 font-heading text-xl font-bold text-slate-900 dark:text-white">
              Right Sidebar Queue (Next 3–5)
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              One click opens your immediate queue from anywhere in the app. Always see what comes next, check off finished work, and stay oriented in fast-paced sprints.
            </p>
          </article>

          {/* Feature 6 */}
          <article className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft transition hover:border-brand-300 dark:border-slate-800 dark:bg-[#171822]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <Icon name="calendar" size={24} />
            </span>
            <h3 className="mt-5 font-heading text-xl font-bold text-slate-900 dark:text-white">
              Interactive Date-Click Calendar
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Click any date on the calendar grid to choose between quick inline scheduling or opening the full task creator. View scheduled chips with status indicators.
            </p>
          </article>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 5. COMPARISON MATRIX                                       */}
      {/* ========================================================== */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
            The Siraye Difference
          </p>
          <h2 className="mt-2 font-heading text-3xl font-extrabold text-slate-900 dark:text-white">
            Built for execution, not just task hoarding.
          </h2>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Capability</th>
                  <th className="px-6 py-4 text-brand-700 dark:text-brand-300 font-extrabold">Siraye</th>
                  <th className="px-6 py-4 text-slate-400">Traditional Todo Apps</th>
                  <th className="px-6 py-4 text-slate-400">Complex Issue Trackers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">Strict 1-Task-at-a-Time Slot Rule</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">✓ Native Enforced</td>
                  <td className="px-6 py-4 text-slate-400">✕ Endless Lists</td>
                  <td className="px-6 py-4 text-slate-400">✕ Unconstrained</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">Weekly Commitment Lock (Mon–Sun)</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">✓ Native Lock Mode</td>
                  <td className="px-6 py-4 text-slate-400">✕ None</td>
                  <td className="px-6 py-4 text-slate-400">✕ Heavy Admin Setup</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">Built-in Pomotroid Focus Timer</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">✓ Integrated with Tasks</td>
                  <td className="px-6 py-4 text-slate-400">✕ Separate App</td>
                  <td className="px-6 py-4 text-slate-400">✕ Paid Add-on</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">Punctuality Score & Margin Tracking</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">✓ Automated Analytics</td>
                  <td className="px-6 py-4 text-slate-400">✕ None</td>
                  <td className="px-6 py-4 text-slate-400">✕ Complicated Reports</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">Next 3–5 Tasks Drawer Sidebar</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">✓ Instant 1-Click Access</td>
                  <td className="px-6 py-4 text-slate-400">✕ None</td>
                  <td className="px-6 py-4 text-slate-400">✕ None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 6. SOCIAL PROOF / USER QUOTES                              */}
      {/* ========================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              "The single-task slot rule completely changed my work week. I stopped juggling 10 tabs at once and started shipping code on schedule."
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">EL</span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Elena Rostova</p>
                <p className="text-[11px] text-slate-400">Lead Staff Engineer</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              "The Pomotroid timer coupled with the weekly lock gave our team our sanity back. Planning on Friday, executing locked Monday through Sunday is magic."
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 font-bold text-amber-800">MK</span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Marcus Kim</p>
                <p className="text-[11px] text-slate-400">Founder & CEO</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              "I used to miss deadlines and wonder where the time went. The Punctuality Tracker showed me exactly where delays happen. My score is now at 96%."
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">SA</span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Sarah Al-Mansoor</p>
                <p className="text-[11px] text-slate-400">Senior Product Designer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 7. PRE-FOOTER ACTION BANNER                                */}
      {/* ========================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-teal-900 p-8 text-white shadow-2xl sm:p-14">
          <div className="max-w-2xl">
            <span className="rounded-full bg-brand-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-200">
              Take Control of Your Time
            </span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold sm:text-5xl leading-tight">
              Ready to execute with unshakeable consistency?
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-brand-100">
              Create your workspace in seconds. Lock your first weekly schedule, jump into the Pomotroid focus board, and watch your punctuality score soar.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                className="rounded-2xl bg-white px-7 py-3 text-sm font-bold text-brand-900 shadow-lg transition hover:bg-brand-50 active:scale-95"
                to="/signup"
              >
                Start for free now
              </Link>
              <Link
                className="rounded-2xl border border-brand-300/40 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                to="/login"
              >
                Sign in to workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 8. MODERN & INTERACTIVE PRODUCT FOOTER                     */}
      {/* ========================================================== */}
      <footer className="relative border-t border-slate-200/80 bg-white/80 pt-16 pb-12 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0e0f17]">
        {/* Glow ambient accent at bottom */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-full max-w-4xl rounded-full bg-brand-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          {/* Top Row: Newsletter & Product Drops Interactive Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-brand-50/30 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/80 dark:to-brand-950/20 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <Icon name="sparkles" size={13} /> Siraye Weekly Release Notes
                </span>
                <h3 className="mt-3 font-heading text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  Stay ahead in disciplined execution science.
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                  Bi-weekly deep work insights, punctuality benchmarks, sprint coordination templates, and early feature drops. Zero spam.
                </p>
              </div>

              <div className="lg:col-span-5">
                {newsletterSubmitted ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Icon name="checkCircle" size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold">You're on the early-access list! 🎉</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Check your inbox shortly for our 1-Task Weekly Planner blueprint.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Icon
                        name="mail"
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="Enter your work email"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isNewsletterLoading}
                      className="rounded-2xl bg-brand-700 px-5 py-3 text-xs font-bold text-white shadow-md shadow-brand-700/20 hover:bg-brand-800 active:scale-95 disabled:opacity-60 transition"
                    >
                      {isNewsletterLoading ? "Subscribing..." : "Subscribe"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Middle Row: Live Accent Palette Customizer & Theme Mode */}
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/80 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Icon name="sparkles" size={14} className="text-brand-600" />
                Preview Brand Accent Live:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_COLORS.map((color) => {
                  const isCurrent = activeAccentHex.toUpperCase() === color.id.toUpperCase();
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handlePaletteChange(color.id)}
                      title={`${color.name} (${color.desc})`}
                      className={`group relative flex h-7 w-7 items-center justify-center rounded-xl transition ${
                        isCurrent
                          ? "ring-2 ring-slate-900 scale-110 shadow-sm dark:ring-white"
                          : "hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color.id }}
                    >
                      {isCurrent && <Icon name="check" size={13} strokeWidth={3} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={toggleFooterTheme}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                title="Toggle appearance mode"
              >
                <Icon name={footerDarkMode ? "sun" : "moon"} size={14} />
                <span>{footerDarkMode ? "Light mode" : "Dark mode"}</span>
              </button>

              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                title="Scroll back to top"
              >
                <span>Top</span>
                <Icon name="chevronDown" size={13} className="rotate-180" />
              </button>
            </div>
          </div>

          {/* Sitemap Navigation Grid */}
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-800 text-white shadow-md shadow-brand-700/25">
                  <Icon name="sparkles" size={19} />
                </span>
                <span className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  siraye
                </span>
              </Link>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                The all-in-one productivity operating system unifying single-task scheduling, Pomotroid focus intervals, weekly commitment locking, and punctuality analytics.
              </p>

              {/* Live Multi-Tenant System Status Pill */}
              <div className="pt-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    All Systems Operational · v2.0
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 font-mono">100+ Active Sessions</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 font-mono">PostgreSQL 16 ACID</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 font-mono">Redis 7 Store</span>
                </div>
              </div>
            </div>

            {/* Column 1: Product */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Product</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li><Link to="/schedule" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Weekly Schedule</Link></li>
                <li><Link to="/timer" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Pomotroid Timer</Link></li>
                <li><Link to="/calendar" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Calendar Planner</Link></li>
                <li><Link to="/tracker" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Punctuality Tracker</Link></li>
                <li><Link to="/projects" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Project Boards</Link></li>
                <li><Link to="/my-tasks" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Personal Tasks</Link></li>
              </ul>
            </div>

            {/* Column 2: Workflows */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Workflows</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Single-Task Method</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Weekly Lock Discipline</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Pomotroid Focus Cycles</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Punctuality Scoring Index</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Emergency Urgency Override</a></li>
              </ul>
            </div>

            {/* Column 3: Company & Security */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Company</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li><Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Sign in</Link></li>
                <li><Link to="/signup" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Create workspace</Link></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Privacy Policy</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Terms of Service</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Security & Encryption</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Social Links */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-400 dark:border-slate-800">
            <p>© {new Date().getFullYear()} Siraye Technologies. All rights reserved. Crafted for disciplined execution.</p>
            <div className="flex items-center gap-3 font-semibold">
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:text-brand-700 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer transition">
                Twitter / X
              </span>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:text-brand-700 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer transition">
                GitHub
              </span>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:text-brand-700 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer transition">
                Discord
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
