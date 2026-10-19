import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, isToday, isTomorrow } from "date-fns";

import { completeTask, getTasks } from "../../api/tasks";
import Icon from "../../components/Icon";
import LoadingSpinner from "../../components/LoadingSpinner";
import TaskDetailPanel from "../../components/TaskDetailPanel";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../hooks/useWorkspace";
import { formatDate } from "../../utils/format";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const PRIORITY_THEMES = {
  urgent: { text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-500/20", dot: "bg-rose-500" },
  high: { text: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-500/20", dot: "bg-orange-500" },
  medium: { text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-500/20", dot: "bg-amber-500" },
  low: { text: "text-sky-700 dark:text-sky-300", bg: "bg-sky-100 dark:bg-sky-500/20", dot: "bg-sky-500" },
  none: { text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", dot: "bg-slate-400" },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeWorkspace, projects } = useWorkspace();
  const [agendaFilter, setAgendaFilter] = useState("today"); // 'today' | 'urgent' | 'in_progress'
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "dashboard", activeWorkspace?.id],
    queryFn: () => getTasks({ page_size: 250 }),
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const tasks = useMemo(() => data?.results || data || [], [data]);

  // Metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status?.category === "done" || t.status?.is_done || t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status?.category === "in_progress" || t.status === "in_progress").length;
    const pending = Math.max(0, total - completed - inProgress);

    const dueTodayCount = tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return isToday(d) && !t.status?.is_done && t.status?.category !== "done";
    }).length;

    const overdueCount = tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d < new Date() && !t.status?.is_done && t.status?.category !== "done";
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      dueTodayCount,
      overdueCount,
      completionRate,
    };
  }, [tasks]);

  // Today / Priority Agenda list
  const agendaTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isDone = t.status?.category === "done" || t.status?.is_done;
      if (isDone) return false;

      if (agendaFilter === "urgent") {
        return t.priority === "urgent" || t.priority === "high";
      }
      if (agendaFilter === "in_progress") {
        return t.status?.category === "in_progress" || t.status === "in_progress";
      }
      // 'today' filter: tasks due today, overdue, or in progress
      if (!t.due_date) return t.status?.category === "in_progress";
      const d = new Date(t.due_date);
      return isToday(d) || d < new Date() || t.status?.category === "in_progress";
    });
  }, [tasks, agendaFilter]);

  // Chart data for status overview
  const statusChartData = useMemo(() => {
    return [
      { name: "Completed", count: stats.completed, fill: "#10b981" },
      { name: "In Progress", count: stats.inProgress, fill: "#f59e0b" },
      { name: "Pending", count: stats.pending, fill: "#255a54" },
    ];
  }, [stats]);

  // Priority distribution
  const priorityData = useMemo(() => {
    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    tasks.forEach((t) => {
      if (counts[t.priority] !== undefined) counts[t.priority]++;
    });
    return [
      { name: "Urgent", value: counts.urgent, color: "#ef4444" },
      { name: "High", value: counts.high, color: "#f97316" },
      { name: "Medium", value: counts.medium, color: "#eab308" },
      { name: "Low", value: counts.low, color: "#38bdf8" },
    ].filter((p) => p.value > 0);
  }, [tasks]);

  // Read today's focus timer session count from local storage
  const todayPomoSessions = useMemo(() => {
    try {
      const saved = localStorage.getItem(`siraye:pomo_count:${new Date().toDateString()}`);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  }, []);

  if (isLoading) return <LoadingSpinner label="Loading overview" />;

  return (
    <div className="animate-enter space-y-7">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#171822] sm:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                <span className="h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400 animate-pulse" />
                {activeWorkspace?.name || "Personal Workspace"}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {getGreeting()}, {user?.name?.split(" ")[0] || "Planner"}!
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {stats.dueTodayCount > 0
                ? `You have ${stats.dueTodayCount} ${stats.dueTodayCount === 1 ? "task" : "tasks"} due today and ${stats.inProgress} in progress. Single-task your schedule to build momentum.`
                : "You're all clear on immediate deadlines. Pick your next focus block or plan the upcoming week."}
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-700/25 transition hover:bg-brand-800"
              to="/tasks/new"
            >
              <Icon name="plus" size={15} />
              New task
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              to="/timer"
            >
              <Icon name="clock" size={15} />
              Focus Timer
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              to="/schedule"
            >
              <Icon name="calendarCheck" size={15} />
              Weekly Schedule
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tasks & Completion Progress */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Work</span>
            <span className="rounded-lg bg-brand-50 p-1.5 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Icon name="layers" size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</h2>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {stats.completionRate}% completed
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">{stats.completed} tasks done, {stats.pending} waiting</p>
        </article>

        {/* In Progress Deep Work */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Progress</span>
            <span className="rounded-lg bg-amber-50 p-1.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <Icon name="zap" size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</h2>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Active flow</span>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">Tasks currently being executed</p>
        </article>

        {/* Due Today / Overdue */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today & Overdue</span>
            <span className="rounded-lg bg-rose-50 p-1.5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <Icon name="alertCircle" size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">{stats.dueTodayCount}</h2>
            {stats.overdueCount > 0 ? (
              <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                +{stats.overdueCount} overdue
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-600">On schedule</span>
            )}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">Demanding immediate attention</p>
        </article>

        {/* Pomodoro Focus Sessions Today */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Focus Sessions</span>
            <span className="rounded-lg bg-sky-50 p-1.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              <Icon name="clock" size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
              {todayPomoSessions}
            </h2>
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              {todayPomoSessions * 25}m focused
            </span>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">Completed with Pomotroid timer today</p>
        </article>
      </section>

      {/* Main Grid: Agenda & Analytics */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Today's Priority Agenda */}
        <div className="space-y-6 lg:col-span-8">
          {/* Priority Agenda Card */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  Focus Agenda
                </h3>
                <p className="text-xs text-slate-400">Immediate tasks waiting for execution</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center rounded-xl border border-slate-200 p-1 dark:border-slate-800">
                {[
                  { id: "today", label: "Today & Due" },
                  { id: "urgent", label: "Urgent & High" },
                  { id: "in_progress", label: "In Progress" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      agendaFilter === tab.id
                        ? "bg-brand-700 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    }`}
                    onClick={() => setAgendaFilter(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            {/* Task list */}
            <div className="mt-4 space-y-2.5">
              {agendaTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    <Icon name="checkCircle" size={24} />
                  </span>
                  <h4 className="mt-3 font-heading text-base font-bold text-slate-800 dark:text-slate-200">
                    No active tasks in this view
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    You're caught up! Add a new task or take a well-deserved break.
                  </p>
                </div>
              ) : (
                agendaTasks.map((task) => {
                  const priority = PRIORITY_THEMES[task.priority] || PRIORITY_THEMES.none;
                  const isDue = task.due_date && isToday(new Date(task.due_date));
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

                  return (
                    <div
                      key={task.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3.5 transition hover:border-brand-300 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className={`mt-1 h-2 w-2 rounded-full ${priority.dot} shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {task.project_name ? (
                              <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {task.project_name}
                              </span>
                            ) : null}
                            <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${priority.bg} ${priority.text}`}>
                              {task.priority || "none"}
                            </span>
                          </div>
                          <h4
                            className="mt-0.5 truncate text-sm font-semibold text-slate-800 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-300 cursor-pointer"
                            onClick={() => setSelectedTaskId(task.id)}
                          >
                            {task.title}
                          </h4>
                          {task.due_date ? (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                              <Icon name="clock" size={12} />
                              <span className={isOverdue ? "text-rose-600 font-semibold" : isDue ? "text-amber-600 font-semibold" : ""}>
                                {isOverdue ? "Overdue: " : isDue ? "Due today: " : "Due: "}
                                {formatDate(task.due_date)}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          onClick={() => navigate(`/timer?taskId=${task.id}`)}
                          title="Start Pomodoro timer on this task"
                          type="button"
                        >
                          <Icon name="clock" size={13} />
                          Focus
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-700 hover:text-white dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-700 dark:hover:text-white"
                          disabled={completeMutation.isPending}
                          onClick={() => completeMutation.mutate(task.id)}
                          type="button"
                        >
                          <Icon name="check" size={13} />
                          Done
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Task Status Overview Chart */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Workload & Status Breakdown
            </h3>
            <p className="text-xs text-slate-400">Distribution across current task lifecycle</p>

            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171822",
                      borderRadius: "12px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Quick Focus, Weekly Schedule Pill, Projects */}
        <div className="space-y-6 lg:col-span-4">
          {/* Quick Pomodoro Launch Widget */}
          <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-6 shadow-soft dark:border-brand-500/20 dark:from-brand-500/10 dark:to-[#171822]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Deep Work Station
              </span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-white">
                <Icon name="clock" size={15} />
              </span>
            </div>
            <h3 className="mt-2 font-heading text-xl font-bold text-slate-900 dark:text-white">
              Pomotroid Timer
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Eliminate friction. Enter flow state with timed intervals and deliberate focus rounds.
            </p>

            <div className="my-5 rounded-2xl bg-white p-4 text-center shadow-xs dark:bg-slate-900/80">
              <p className="font-heading text-4xl font-bold tracking-tight text-brand-700 dark:text-brand-300">
                25:00
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">Standard Flow Round</p>
            </div>

            <Link
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-xs font-bold text-white shadow-md shadow-brand-700/25 transition hover:bg-brand-800"
              to="/timer"
            >
              <Icon name="play" size={14} />
              Launch Focus Session
            </Link>
          </section>

          {/* Weekly Schedule Preview Widget */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Icon name="calendarCheck" size={18} className="text-brand-700 dark:text-brand-400" />
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                  Weekly Schedule
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                1 Task / Slot
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Coordinated weekly schedule with commitment locking from Monday to Sunday.
            </p>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60 text-xs">
              <div className="flex items-center gap-2">
                <Icon name="lock" size={14} className="text-amber-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Locked Execution</span>
              </div>
              <Link to="/schedule" className="font-bold text-brand-700 hover:underline dark:text-brand-300">
                Manage Schedule →
              </Link>
            </div>
          </section>

          {/* Active Projects Tracker */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                Projects
              </h3>
              <Link to="/projects" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
                View all ({projects.length})
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {projects.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">No active projects yet.</p>
              ) : (
                projects.slice(0, 4).map((p) => {
                  const pTasks = tasks.filter((t) => String(t.project) === String(p.id) || t.project_name === p.name);
                  const pDone = pTasks.filter((t) => t.status?.category === "done" || t.status?.is_done).length;
                  const percent = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

                  return (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className="block rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/30 dark:border-slate-800 dark:hover:bg-slate-900/60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {pDone}/{pTasks.length} done
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Task Detail Panel Modal */}
      <TaskDetailPanel onClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} />
    </div>
  );
}
