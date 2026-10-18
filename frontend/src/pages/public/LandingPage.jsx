import { useState } from "react";
import { Link } from "react-router-dom";

import Icon from "../../components/Icon";

export default function LandingPage() {
  const [activeShowcase, setActiveShowcase] = useState("schedule"); // 'schedule' | 'timer' | 'sidebar' | 'tracker'

  return (
    <div className="w-full space-y-24 pb-12 pt-4">
      {/* Hero Section */}
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

        {/* Interactive App Showcase Preview */}
        <div className="relative mt-14 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-2 shadow-2xl shadow-brand-900/10 dark:border-slate-800 dark:bg-[#171822] sm:p-4">
          {/* Showcase Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-bold text-slate-400">siraye.app</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
              {[
                { id: "schedule", label: "Weekly Schedule", icon: "calendarCheck" },
                { id: "timer", label: "Pomotroid Timer", icon: "clock" },
                { id: "tracker", label: "Punctuality Tracker", icon: "trendingUp" },
                { id: "sidebar", label: "Next 3-5 Tasks", icon: "sidebar" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeShowcase === tab.id
                      ? "bg-white text-brand-700 shadow-xs dark:bg-slate-800 dark:text-brand-300"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                  onClick={() => setActiveShowcase(tab.id)}
                  type="button"
                >
                  <Icon name={tab.icon} size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="relative min-h-[380px] rounded-2xl bg-[#f8f9fc] p-6 text-left dark:bg-[#10111a]">
            {activeShowcase === "schedule" && (
              <div className="space-y-4 animate-enter">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 dark:border-amber-800">
                      <Icon name="lock" size={12} /> Week in progress (Locked Mon-Sun)
                    </span>
                    <h3 className="mt-1 font-heading text-lg font-bold text-slate-900 dark:text-white">
                      Strict 1-Task-at-a-Time Coordination
                    </h3>
                  </div>
                  <span className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow">
                    Urgent Schedule Override
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {[
                    { day: "Monday", color: "border-indigo-300 bg-indigo-50/50", badge: "bg-indigo-600", task: "Backend API Auth", slot: "08:30" },
                    { day: "Tuesday", color: "border-amber-300 bg-amber-50/50", badge: "bg-amber-600", task: "Database Migrations", slot: "10:15" },
                    { day: "Wednesday", color: "border-emerald-300 bg-emerald-50/50", badge: "bg-emerald-600", task: "Vite Bundle Tuning", slot: "12:00" },
                    { day: "Thursday", color: "border-sky-300 bg-sky-50/50", badge: "bg-sky-600", task: "Calendar Integration", slot: "14:00" },
                    { day: "Friday", color: "border-violet-300 bg-violet-50/50", badge: "bg-violet-600", task: "Punctuality Analytics", slot: "15:45" },
                    { day: "Saturday", color: "border-rose-300 bg-rose-50/50", badge: "bg-rose-600", task: "QA Smoke Testing", slot: "10:00" },
                    { day: "Sunday", color: "border-teal-300 bg-teal-50/50", badge: "bg-teal-600", task: "Weekly Plan Lock", slot: "17:30" },
                  ].map((item, idx) => (
                    <div key={idx} className={`rounded-xl border ${item.color} p-3 text-xs`}>
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${item.badge}`}>
                        {item.day}
                      </span>
                      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2 shadow-xs dark:bg-slate-900">
                        <span className="text-[10px] font-bold text-slate-400">{item.slot}</span>
                        <p className="mt-0.5 truncate font-bold text-slate-800 dark:text-slate-100">{item.task}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeShowcase === "timer" && (
              <div className="flex flex-col items-center justify-center py-6 text-center animate-enter">
                <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-900">
                  <span className="rounded-lg bg-white px-3 py-1 text-brand-700 shadow-xs dark:bg-slate-800 dark:text-brand-300">
                    Focus (25m)
                  </span>
                  <span className="px-3 py-1 text-slate-400">Short Break (5m)</span>
                  <span className="px-3 py-1 text-slate-400">Long Break (15m)</span>
                </div>

                <div className="relative my-6 flex h-48 w-48 items-center justify-center rounded-full border-8 border-brand-600 bg-white shadow-soft dark:bg-slate-900">
                  <div className="text-center">
                    <p className="font-heading text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                      24:59
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Round 1 of 4
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs dark:bg-slate-800">
                    <Icon name="rotateCcw" size={17} />
                  </span>
                  <span className="rounded-2xl bg-brand-700 px-6 py-2.5 text-xs font-bold text-white shadow-md">
                    Pause Focus
                  </span>
                  <span className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs dark:bg-slate-800">
                    <Icon name="skipForward" size={17} />
                  </span>
                </div>
              </div>
            )}

            {activeShowcase === "tracker" && (
              <div className="space-y-4 animate-enter">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-white p-4 shadow-xs dark:bg-[#171822]">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Punctuality Score</p>
                    <p className="mt-1 font-heading text-2xl font-bold text-emerald-600">94%</p>
                    <p className="text-[10px] text-slate-400">On-time deliveries</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-xs dark:bg-[#171822]">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Consistency Index</p>
                    <p className="mt-1 font-heading text-2xl font-bold text-brand-700 dark:text-brand-400">89%</p>
                    <p className="text-[10px] text-slate-400">Regular execution</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-xs dark:bg-[#171822]">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Current Streak</p>
                    <p className="mt-1 font-heading text-2xl font-bold text-amber-600">12 Days</p>
                    <p className="text-[10px] text-slate-400">Consecutive delivery</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-xs dark:bg-[#171822]">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Overdue Items</p>
                    <p className="mt-1 font-heading text-2xl font-bold text-slate-900 dark:text-white">0</p>
                    <p className="text-[10px] text-emerald-600 font-bold">All clear</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-xs dark:bg-[#171822]">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed Schedule Audit Log</p>
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Refactor WebSocket Layer</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">On Time (3h early)</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Implement Emergency Lock Override</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">On Time (1d early)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeShowcase === "sidebar" && (
              <div className="flex justify-end animate-enter">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-[#171822]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Icon name="sidebar" size={16} className="text-brand-700 dark:text-brand-400" />
                      <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-white">Next Up Queue</h4>
                    </div>
                    <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800">Next 4 tasks</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {[
                      { num: 1, title: "Review Pull Request #41", due: "Due in 2h", prio: "urgent", prioClass: "bg-rose-100 text-rose-700" },
                      { num: 2, title: "Deploy Frontend Container to Production", due: "Today 17:00", prio: "high", prioClass: "bg-orange-100 text-orange-700" },
                      { num: 3, title: "Run Database Vacuum & Backup", due: "Tomorrow", prio: "medium", prioClass: "bg-amber-100 text-amber-700" },
                    ].map((item) => (
                      <div key={item.num} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-400">#{item.num}</span>
                          <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${item.prioClass}`}>{item.prio}</span>
                        </div>
                        <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                        <div className="mt-2 flex items-center justify-between border-t border-slate-200/50 pt-1.5">
                          <span className="text-[10px] text-slate-400">{item.due}</span>
                          <span className="text-[10px] font-bold text-brand-700 hover:underline">Focus Timer →</span>
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

      {/* Feature Deep Dive Grid */}
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

      {/* Comparison Matrix: Siraye vs Traditional Tools */}
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

      {/* Social Proof / User Quotes */}
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

      {/* Pre-Footer Action Banner */}
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

      {/* Comprehensive Product Footer */}
      <footer className="border-t border-slate-200 bg-white pt-16 pb-12 dark:border-slate-800 dark:bg-[#12131c]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-md shadow-brand-700/25">
                  <Icon name="sparkles" size={19} />
                </span>
                <span className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  siraye
                </span>
              </Link>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                The all-in-one productivity operating system unifying single-task scheduling, Pomotroid focus intervals, weekly commitment locking, and punctuality analytics.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  All systems operational · v2.0
                </span>
              </div>
            </div>

            {/* Column 1: Product */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Product</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li><Link to="/schedule" className="hover:text-brand-600 dark:hover:text-brand-400">Weekly Schedule</Link></li>
                <li><Link to="/timer" className="hover:text-brand-600 dark:hover:text-brand-400">Pomotroid Timer</Link></li>
                <li><Link to="/calendar" className="hover:text-brand-600 dark:hover:text-brand-400">Calendar Planner</Link></li>
                <li><Link to="/tracker" className="hover:text-brand-600 dark:hover:text-brand-400">Punctuality Tracker</Link></li>
                <li><Link to="/projects" className="hover:text-brand-600 dark:hover:text-brand-400">Project Boards</Link></li>
                <li><Link to="/my-tasks" className="hover:text-brand-600 dark:hover:text-brand-400">Personal Tasks</Link></li>
              </ul>
            </div>

            {/* Column 2: Workflows */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Workflows</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Single-Tasking Method</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Weekly Lock Discipline</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Pomotroid Focus Cycles</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Punctuality Score Index</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Emergency Override</a></li>
              </ul>
            </div>

            {/* Column 3: Company & Legal */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Company</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li><Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400">Sign in</Link></li>
                <li><Link to="/signup" className="hover:text-brand-600 dark:hover:text-brand-400">Create workspace</Link></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Privacy Policy</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Terms of Service</a></li>
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Security & Backups</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-400 dark:border-slate-800">
            <p>© {new Date().getFullYear()} Siraye. All rights reserved. Crafted for disciplined execution.</p>
            <div className="flex items-center gap-4 font-semibold">
              <span className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">Twitter/X</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">GitHub</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">Discord</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
