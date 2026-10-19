import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

import { completeTask, createTask, getTasks } from "../../api/tasks";
import CreateTaskModal from "../../components/CreateTaskModal";
import Icon from "../../components/Icon";
import TaskDetailPanel from "../../components/TaskDetailPanel";
import { useWorkspace } from "../../hooks/useWorkspace";

const PRIORITY_COLORS = {
  urgent: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
  none: "bg-slate-400",
};

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const { activeWorkspace, projects } = useWorkspace();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // When user clicks a date to open choices
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [fullModalDate, setFullModalDate] = useState(null); // For opening CreateTaskModal with date

  // Quick add form state inside the date choice modal
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState("medium");
  const [quickProjectId, setQuickProjectId] = useState("");
  const [quickTime, setQuickTime] = useState("17:00");

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", "calendar", activeWorkspace?.id],
    queryFn: () => getTasks({ page_size: 250 }),
  });

  const tasks = useMemo(() => tasksData?.results || tasksData || [], [tasksData]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      const dateStr = task.due_date || task.start_time;
      if (!dateStr) return;
      const key = format(new Date(dateStr), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedDate(null);
      setQuickTitle("");
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  function handleDateClick(day) {
    setSelectedDate(day);
    setQuickTitle("");
    setQuickPriority("medium");
    setQuickProjectId(projects[0]?.id ? String(projects[0].id) : "");
    setQuickTime("17:00");
  }

  function handleQuickSubmit(e) {
    e.preventDefault();
    if (!quickTitle.trim() || !selectedDate) return;

    const [hours, minutes] = quickTime.split(":").map(Number);
    const targetDate = new Date(selectedDate);
    targetDate.setHours(hours || 17, minutes || 0, 0, 0);

    const project = projects.find((p) => String(p.id) === String(quickProjectId)) || projects[0];
    const defaultStatus = project?.statuses?.find((s) => s.category === "todo") || project?.statuses?.[0];

    createTaskMutation.mutate({
      title: quickTitle.trim(),
      project: project?.id,
      status_id: defaultStatus?.id,
      priority: quickPriority,
      due_date: targetDate.toISOString(),
    });
  }

  function openFullModalForDate(date) {
    setSelectedDate(null);
    setFullModalDate(date);
  }

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return tasksByDay[key] || [];
  }, [selectedDate, tasksByDay]);

  return (
    <div className="animate-enter space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Icon name="calendar" size={20} />
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Calendar Schedule
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View deadlines, schedules, and click any date to add or plan tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#171822] dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setCurrentDate(new Date())}
            type="button"
          >
            Today
          </button>

          <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#171822]">
            <button
              aria-label="Previous month"
              className="rounded-l-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              type="button"
            >
              <Icon name="chevronLeft" size={17} />
            </button>
            <span className="min-w-[150px] px-3 text-center font-heading text-sm font-bold text-slate-800 dark:text-slate-100">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <button
              aria-label="Next month"
              className="rounded-r-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              type="button"
            >
              <Icon name="chevronRight" size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-soft dark:border-slate-800 dark:bg-[#171822]">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="py-3.5">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)] divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDay[dateKey] || [];
            const inCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`group relative flex flex-col p-2 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer ${
                  !inCurrentMonth ? "bg-slate-50/30 opacity-40 dark:bg-slate-950/20" : ""
                } ${isDayToday ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                onClick={() => handleDateClick(day)}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isDayToday
                        ? "bg-brand-700 text-white shadow-sm shadow-brand-700/30"
                        : inCurrentMonth
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Add task button shown on hover */}
                  <button
                    aria-label={`Add task on ${format(day, "MMM d")}`}
                    className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-400 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/15 dark:hover:text-brand-300 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDateClick(day);
                    }}
                    title="Click to add task"
                    type="button"
                  >
                    <Icon name="plus" size={13} />
                  </button>
                </div>

                {/* Tasks List in Cell */}
                <div className="mt-1.5 flex-1 space-y-1 overflow-y-auto max-h-[100px] scrollbar-subtle">
                  {dayTasks.slice(0, 3).map((task) => {
                    const isCompleted = task.status?.category === "done" || task.status?.is_done;

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-medium transition ${
                          isCompleted
                            ? "bg-slate-100 text-slate-400 line-through dark:bg-slate-800 dark:text-slate-500"
                            : "bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 hover:ring-brand-400 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(task.id);
                        }}
                        title={`${task.title} (${task.priority || "none"})`}
                      >
                        <span
                          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                            PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.none
                          }`}
                        />
                        <span className="truncate">{task.title}</span>
                      </div>
                    );
                  })}

                  {dayTasks.length > 3 ? (
                    <span className="block px-1 text-[10px] font-bold text-brand-700 dark:text-brand-400">
                      +{dayTasks.length - 3} more
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Click Choice Modal: "allow when click on date to give choice to add task" */}
      {selectedDate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setSelectedDate(null)}
        >
          <div
            className="animate-enter w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Date Schedule
                </p>
                <h3 className="mt-1 font-heading text-xl font-bold text-slate-900 dark:text-white">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
              </div>
              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSelectedDate(null)}
                type="button"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            {/* Existing tasks on this date */}
            {selectedDayTasks.length > 0 ? (
              <div className="mt-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500">
                  Scheduled Tasks ({selectedDayTasks.length})
                </p>
                <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto scrollbar-subtle">
                  {selectedDayTasks.map((task) => {
                    const isDone = task.status?.category === "done" || task.status?.is_done;

                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60"
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer min-w-0 flex-1 pr-2"
                          onClick={() => {
                            setSelectedDate(null);
                            setSelectedTaskId(task.id);
                          }}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.none
                            }`}
                          />
                          <span
                            className={`truncate font-medium ${
                              isDone
                                ? "line-through text-slate-400"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <button
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            isDone
                              ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              : "bg-brand-50 text-brand-700 hover:bg-brand-700 hover:text-white dark:bg-brand-500/20 dark:text-brand-300"
                          }`}
                          disabled={completeMutation.isPending || isDone}
                          onClick={() => completeMutation.mutate(task.id)}
                          type="button"
                        >
                          {isDone ? "Done" : "Mark Done"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Quick Add Section */}
            <form onSubmit={handleQuickSubmit} className="mt-4 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Add Task
              </h4>

              <input
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="What needs to be done on this date?"
                required
                value={quickTitle}
              />

              <div className="grid grid-cols-3 gap-2.5">
                <label className="text-xs font-semibold text-slate-500">
                  Priority
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onChange={(e) => setQuickPriority(e.target.value)}
                    value={quickPriority}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="none">None</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-500">
                  Project
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onChange={(e) => setQuickProjectId(e.target.value)}
                    value={quickProjectId}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-500">
                  Due Time
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onChange={(e) => setQuickTime(e.target.value)}
                    type="time"
                    value={quickTime}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                  onClick={() => openFullModalForDate(selectedDate)}
                  type="button"
                >
                  More options (Full Form)...
                </button>

                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setSelectedDate(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-800 disabled:opacity-50"
                    disabled={!quickTitle.trim() || createTaskMutation.isPending}
                    type="submit"
                  >
                    <Icon name="plus" size={14} />
                    {createTaskMutation.isPending ? "Adding…" : "Add Task"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Full Task Modal if user selected "More options" */}
      {fullModalDate && projects[0] ? (
        <CreateTaskModal
          onClose={() => setFullModalDate(null)}
          open={Boolean(fullModalDate)}
          project={projects.find((p) => String(p.id) === String(quickProjectId)) || projects[0]}
        />
      ) : null}

      {/* Task Detail Panel when a task chip is clicked */}
      <TaskDetailPanel onClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} />
    </div>
  );
}

