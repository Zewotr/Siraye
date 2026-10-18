import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  differenceInDays,
  differenceInHours,
  format,
  isAfter,
  isBefore,
  subDays,
} from "date-fns";

import { getTasks } from "../../api/tasks";
import Icon from "../../components/Icon";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatCard from "../../components/StatCard";
import TaskDetailPanel from "../../components/TaskDetailPanel";
import { useWorkspace } from "../../hooks/useWorkspace";
import { formatDate } from "../../utils/format";

const PIE_COLORS = {
  onTime: "#10b981", // Emerald
  late: "#f59e0b", // Amber
  overdue: "#ef4444", // Rose
  onTrack: "#3b82f6", // Sky
  flexible: "#94a3b8", // Slate
};

export default function TrackerPage() {
  const { activeWorkspace } = useWorkspace();
  const [dateRange, setDateRange] = useState("30"); // 7, 14, 30, all
  const [filterType, setFilterType] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", "tracker", activeWorkspace?.id],
    queryFn: () => getTasks({ page_size: 300 }),
  });

  const rawTasks = useMemo(() => tasksData?.results || tasksData || [], [tasksData]);

  // Filter tasks by date range
  const tasks = useMemo(() => {
    if (dateRange === "all") return rawTasks;
    const daysLimit = Number(dateRange);
    const cutoff = subDays(new Date(), daysLimit);

    return rawTasks.filter((task) => {
      const taskDate = new Date(task.completed_at || task.due_date || task.created_at);
      return isAfter(taskDate, cutoff);
    });
  }, [rawTasks, dateRange]);

  // Analytics & Punctuality / Consistency evaluation
  const metrics = useMemo(() => {
    const now = new Date();
    let onTimeCount = 0;
    let lateCount = 0;
    let overdueCount = 0;
    let onTrackCount = 0;
    let flexibleCompletedCount = 0;
    let flexiblePendingCount = 0;

    const completionDates = new Set();
    const tasksWithMetrics = [];

    tasks.forEach((task) => {
      const isDone = task.status?.category === "done" || task.status?.is_done;
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const completedAt = task.completed_at ? new Date(task.completed_at) : null;

      let punctualityStatus = "unknown";
      let punctualityLabel = "-";
      let marginText = "";

      if (isDone) {
        if (completedAt) {
          completionDates.add(format(completedAt, "yyyy-MM-dd"));
        } else {
          completionDates.add(format(new Date(task.updated_at || task.created_at), "yyyy-MM-dd"));
        }

        if (dueDate && completedAt) {
          if (completedAt <= dueDate) {
            onTimeCount++;
            punctualityStatus = "on_time";
            const diffH = differenceInHours(dueDate, completedAt);
            marginText = diffH > 24 ? `${Math.floor(diffH / 24)}d early` : `${diffH}h early`;
            punctualityLabel = "On Time";
          } else {
            lateCount++;
            punctualityStatus = "late";
            const diffH = differenceInHours(completedAt, dueDate);
            marginText = diffH > 24 ? `${Math.floor(diffH / 24)}d late` : `${diffH}h late`;
            punctualityLabel = "Late";
          }
        } else {
          flexibleCompletedCount++;
          punctualityStatus = "flexible";
          punctualityLabel = "Completed (No deadline)";
        }
      } else {
        // Pending
        if (dueDate) {
          if (now > dueDate) {
            overdueCount++;
            punctualityStatus = "overdue";
            const diffH = differenceInHours(now, dueDate);
            marginText = diffH > 24 ? `${Math.floor(diffH / 24)}d overdue` : `${diffH}h overdue`;
            punctualityLabel = "Overdue";
          } else {
            onTrackCount++;
            punctualityStatus = "on_track";
            const diffH = differenceInHours(dueDate, now);
            marginText = diffH > 24 ? `${Math.floor(diffH / 24)}d left` : `${diffH}h left`;
            punctualityLabel = "On Schedule";
          }
        } else {
          flexiblePendingCount++;
          punctualityStatus = "flexible_pending";
          punctualityLabel = "In Progress";
        }
      }

      tasksWithMetrics.push({
        ...task,
        punctualityStatus,
        punctualityLabel,
        marginText,
        isDone,
      });
    });

    const totalCompleted = onTimeCount + lateCount + flexibleCompletedCount;
    const completedWithDeadlines = onTimeCount + lateCount;
    const punctualityScore =
      completedWithDeadlines > 0 ? Math.round((onTimeCount / completedWithDeadlines) * 100) : 100;

    // Calculate Consistency & Streak
    // Count active days in the last period
    const daysInPeriod = dateRange === "all" ? 30 : Number(dateRange);
    const activeDaysCount = completionDates.size;
    const consistencyScore = Math.min(
      100,
      Math.round((activeDaysCount / Math.max(1, Math.min(daysInPeriod, 30))) * 100 * 1.5)
    );

    // Calculate current streak of consecutive days
    let streak = 0;
    let checkDate = new Date();
    while (streak < 365) {
      const key = format(checkDate, "yyyy-MM-dd");
      if (completionDates.has(key)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (streak === 0 && !completionDates.has(key)) {
        // Check yesterday in case today's tasks aren't done yet
        checkDate = subDays(checkDate, 1);
        if (completionDates.has(format(checkDate, "yyyy-MM-dd"))) {
          streak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return {
      totalTasks: tasks.length,
      totalCompleted,
      onTimeCount,
      lateCount,
      overdueCount,
      onTrackCount,
      flexibleCompletedCount,
      punctualityScore,
      consistencyScore,
      currentStreak: streak,
      activeDaysCount,
      tasksWithMetrics,
    };
  }, [tasks, dateRange]);

  // Timeline chart data: group by days
  const timelineData = useMemo(() => {
    const days = Math.min(14, dateRange === "all" ? 14 : Number(dateRange));
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateKey = format(d, "yyyy-MM-dd");
      const label = format(d, "MMM d");

      let scheduled = 0;
      let completedOnTime = 0;
      let completedLate = 0;

      tasks.forEach((t) => {
        const isDone = t.status?.category === "done" || t.status?.is_done;
        const due = t.due_date ? format(new Date(t.due_date), "yyyy-MM-dd") : null;
        const done = t.completed_at ? format(new Date(t.completed_at), "yyyy-MM-dd") : null;

        if (due === dateKey) scheduled++;
        if (isDone && done === dateKey) {
          if (t.due_date && new Date(t.completed_at) > new Date(t.due_date)) {
            completedLate++;
          } else {
            completedOnTime++;
          }
        }
      });

      data.push({
        date: label,
        Scheduled: scheduled,
        "On Time": completedOnTime,
        Late: completedLate,
      });
    }

    return data;
  }, [tasks, dateRange]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { name: "Completed On Time", value: metrics.onTimeCount, color: PIE_COLORS.onTime },
      { name: "Completed Late", value: metrics.lateCount, color: PIE_COLORS.late },
      { name: "Currently Overdue", value: metrics.overdueCount, color: PIE_COLORS.overdue },
      { name: "On Schedule", value: metrics.onTrackCount, color: PIE_COLORS.onTrack },
      { name: "Flexible / No Due", value: metrics.flexibleCompletedCount, color: PIE_COLORS.flexible },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  // Filtered task audit table
  const filteredTasks = useMemo(() => {
    if (filterType === "all") return metrics.tasksWithMetrics;
    if (filterType === "on_time") return metrics.tasksWithMetrics.filter((t) => t.punctualityStatus === "on_time");
    if (filterType === "overdue")
      return metrics.tasksWithMetrics.filter((t) => t.punctualityStatus === "overdue" || t.punctualityStatus === "late");
    if (filterType === "in_progress") return metrics.tasksWithMetrics.filter((t) => !t.isDone);
    return metrics.tasksWithMetrics;
  }, [metrics.tasksWithMetrics, filterType]);

  if (isLoading) return <LoadingSpinner label="Evaluating schedule and performance" />;

  return (
    <div className="animate-enter space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Icon name="trendingUp" size={20} />
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Schedule & Consistency Tracker
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Analyze schedule execution, completed works, punctuality, and output consistency.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-[#171822]">
          {[
            { label: "7 days", value: "7" },
            { label: "14 days", value: "14" },
            { label: "30 days", value: "30" },
            { label: "All time", value: "all" },
          ].map((item) => (
            <button
              key={item.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                dateRange === item.value
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              onClick={() => setDateRange(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stat KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Punctuality Score</p>
            <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Icon name="target" size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
              {metrics.punctualityScore}%
            </h2>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {metrics.onTimeCount} on-time
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Completed on or before deadline</p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Consistency Index</p>
            <span className="rounded-lg bg-brand-50 p-1.5 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Icon name="zap" size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
              {metrics.consistencyScore}%
            </h2>
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
              {metrics.activeDaysCount} active days
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Regular execution cadence</p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Streak</p>
            <span className="rounded-lg bg-amber-50 p-1.5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Icon name="award" size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
              {metrics.currentStreak} {metrics.currentStreak === 1 ? "day" : "days"}
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">Consecutive days delivering work</p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Tasks</p>
            <span className="rounded-lg bg-rose-50 p-1.5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <Icon name="alertCircle" size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
              {metrics.overdueCount}
            </h2>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {metrics.lateCount} finished late
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Tasks requiring immediate attention</p>
        </article>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Timeline Chart (8 Cols) */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#171822] lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                Daily Schedule & Completion Trend
              </h3>
              <p className="text-xs text-slate-400">Scheduled workload vs timely delivery</p>
            </div>
          </div>

          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171822",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Bar dataKey="Scheduled" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="On Time" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Punctuality Breakdown Donut (4 Cols) */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#171822] lg:col-span-4">
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            Punctuality Distribution
          </h3>
          <p className="text-xs text-slate-400">Breakdown of deadline adherence</p>

          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171822",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Smart Coaching Insights Banner */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-5 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-[#171822]">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-700 text-white shadow-md">
            <Icon name="sparkles" size={17} />
          </span>
          <div>
            <h4 className="font-heading text-base font-bold text-slate-900 dark:text-white">
              Productivity & Consistency Insights
            </h4>
            <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <p>
                • <strong>Punctuality:</strong>{" "}
                {metrics.punctualityScore >= 80
                  ? "Excellent on-time rate! You consistently meet your scheduled commitments."
                  : "Consider adding time buffers to high-priority deadlines to curb overdue work."}
              </p>
              <p>
                • <strong>Execution Streak:</strong> You have an active streak of {metrics.currentStreak}{" "}
                {metrics.currentStreak === 1 ? "day" : "days"}. Keep momentum by finishing at least 1 task daily.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Task Schedule & Punctuality Audit Table */}
      <section className="rounded-3xl border border-slate-200/90 bg-white shadow-soft dark:border-slate-800 dark:bg-[#171822] overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Schedule & Delivery Log
            </h3>
            <p className="text-xs text-slate-400">Detailed timeline for each task</p>
          </div>

          {/* Table Filter Tabs */}
          <div className="flex items-center rounded-xl border border-slate-200 p-1 dark:border-slate-800">
            {[
              { id: "all", label: "All Tasks" },
              { id: "on_time", label: "On Time" },
              { id: "overdue", label: "Late / Overdue" },
              { id: "in_progress", label: "In Progress" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  filterType === tab.id
                    ? "bg-brand-700 text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
                onClick={() => setFilterType(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
              <tr>
                <th className="px-5 py-3.5">Task</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Scheduled Due</th>
                <th className="px-4 py-3.5">Completed Date</th>
                <th className="px-4 py-3.5 text-right">Punctuality Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                    No tasks found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  return (
                    <tr
                      key={task.id}
                      className="cursor-pointer transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              task.isDone ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.project_name ? (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {task.project_name}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs capitalize text-slate-500 dark:text-slate-400">
                        {task.priority || "none"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {task.due_date ? formatDate(task.due_date) : "No deadline"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {task.completed_at ? formatDate(task.completed_at) : task.isDone ? "Completed" : "Pending"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            task.punctualityStatus === "on_time"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : task.punctualityStatus === "late"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                              : task.punctualityStatus === "overdue"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                              : task.punctualityStatus === "on_track"
                              ? "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {task.punctualityLabel}
                          {task.marginText ? ` (${task.marginText})` : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Task Detail Modal */}
      <TaskDetailPanel onClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} />
    </div>
  );
}

