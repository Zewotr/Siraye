import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";

import { completeTask, createTask, getTasks, updateTask } from "../../api/tasks";
import Icon from "../../components/Icon";
import LoadingSpinner from "../../components/LoadingSpinner";
import TaskDetailPanel from "../../components/TaskDetailPanel";
import { useWorkspace } from "../../hooks/useWorkspace";

// 7 Distinct Day Palettes (no two days share the same color)
const DAY_THEMES = [
  {
    name: "Monday",
    short: "Mon",
    headerBg: "bg-indigo-600 text-white",
    cardBorder: "border-indigo-200 dark:border-indigo-800",
    bgCol: "bg-indigo-50/30 dark:bg-indigo-950/15",
    accent: "#4f46e5",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  {
    name: "Tuesday",
    short: "Tue",
    headerBg: "bg-amber-600 text-white",
    cardBorder: "border-amber-200 dark:border-amber-800",
    bgCol: "bg-amber-50/30 dark:bg-amber-950/15",
    accent: "#d97706",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    name: "Wednesday",
    short: "Wed",
    headerBg: "bg-emerald-600 text-white",
    cardBorder: "border-emerald-200 dark:border-emerald-800",
    bgCol: "bg-emerald-50/30 dark:bg-emerald-950/15",
    accent: "#059669",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    name: "Thursday",
    short: "Thu",
    headerBg: "bg-sky-600 text-white",
    cardBorder: "border-sky-200 dark:border-sky-800",
    bgCol: "bg-sky-50/30 dark:bg-sky-950/15",
    accent: "#0284c7",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  },
  {
    name: "Friday",
    short: "Fri",
    headerBg: "bg-violet-600 text-white",
    cardBorder: "border-violet-200 dark:border-violet-800",
    bgCol: "bg-violet-50/30 dark:bg-violet-950/15",
    accent: "#7c3aed",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    name: "Saturday",
    short: "Sat",
    headerBg: "bg-rose-600 text-white",
    cardBorder: "border-rose-200 dark:border-rose-800",
    bgCol: "bg-rose-50/30 dark:bg-rose-950/15",
    accent: "#e11d48",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
  {
    name: "Sunday",
    short: "Sun",
    headerBg: "bg-teal-600 text-white",
    cardBorder: "border-teal-200 dark:border-teal-800",
    bgCol: "bg-teal-50/30 dark:bg-teal-950/15",
    accent: "#0d9488",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  },
];

// Distinct non-repeating Task Palettes for consecutive tasks
const TASK_PALETTES = [
  {
    bg: "bg-teal-50/90 dark:bg-teal-950/40",
    border: "border-teal-300 dark:border-teal-700",
    text: "text-teal-950 dark:text-teal-100",
    chip: "bg-teal-100/90 text-teal-800 dark:bg-teal-900/70 dark:text-teal-200",
    dot: "bg-teal-500",
  },
  {
    bg: "bg-orange-50/90 dark:bg-orange-950/40",
    border: "border-orange-300 dark:border-orange-700",
    text: "text-orange-950 dark:text-orange-100",
    chip: "bg-orange-100/90 text-orange-800 dark:bg-orange-900/70 dark:text-orange-200",
    dot: "bg-orange-500",
  },
  {
    bg: "bg-blue-50/90 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-950 dark:text-blue-100",
    chip: "bg-blue-100/90 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-fuchsia-50/90 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-300 dark:border-fuchsia-700",
    text: "text-fuchsia-950 dark:text-fuchsia-100",
    chip: "bg-fuchsia-100/90 text-fuchsia-800 dark:bg-fuchsia-900/70 dark:text-fuchsia-200",
    dot: "bg-fuchsia-500",
  },
  {
    bg: "bg-lime-50/90 dark:bg-lime-950/40",
    border: "border-lime-300 dark:border-lime-700",
    text: "text-lime-950 dark:text-lime-100",
    chip: "bg-lime-100/90 text-lime-800 dark:bg-lime-900/70 dark:text-lime-200",
    dot: "bg-lime-500",
  },
  {
    bg: "bg-purple-50/90 dark:bg-purple-950/40",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-950 dark:text-purple-100",
    chip: "bg-purple-100/90 text-purple-800 dark:bg-purple-900/70 dark:text-purple-200",
    dot: "bg-purple-500",
  },
];

// Structured, sequential non-overlapping time slots (only 1 task at a time allowed)
const TIME_SLOTS = [
  { id: "slot_1", label: "08:30 - 10:00", name: "Morning Focus 1", startTime: "08:30", endTime: "10:00" },
  { id: "slot_2", label: "10:15 - 11:45", name: "Morning Focus 2", startTime: "10:15", endTime: "11:45" },
  { id: "slot_3", label: "12:00 - 13:00", name: "Deep Work Block", startTime: "12:00", endTime: "13:00" },
  { id: "slot_4", label: "14:00 - 15:30", name: "Afternoon Execution", startTime: "14:00", endTime: "15:30" },
  { id: "slot_5", label: "15:45 - 17:15", name: "Afternoon Focus 2", startTime: "15:45", endTime: "17:15" },
  { id: "slot_6", label: "17:30 - 18:30", name: "Review & Wrap-up", startTime: "17:30", endTime: "18:30" },
];

export default function SchedulePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace, projects } = useWorkspace();

  // Navigation state
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("weekly"); // 'weekly' | 'daily'
  const [selectedDailyIndex, setSelectedDailyIndex] = useState(() => {
    const day = new Date().getDay(); // 0 is Sunday, 1 is Monday
    return day === 0 ? 6 : day - 1;
  });

  // Selection & Modals state
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { dayIndex, slotId }
  const [urgentModalOpen, setUrgentModalOpen] = useState(false);
  const [urgentForm, setUrgentForm] = useState({
    taskId: "",
    newTitle: "",
    dayIndex: 0,
    slotId: "slot_1",
    reason: "",
    projectId: "",
  });

  // Calculate week boundaries
  const weekStart = useMemo(
    () => startOfWeek(selectedWeekDate, { weekStartsOn: 1 }),
    [selectedWeekDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(selectedWeekDate, { weekStartsOn: 1 }),
    [selectedWeekDate]
  );

  const weekKey = useMemo(() => format(weekStart, "yyyy-'W'II"), [weekStart]);

  // Week lock logic:
  // "weekly plan can't be edited between days monday to sunday of that week but can edit if week not started"
  const isWeekLocked = useMemo(() => {
    const now = new Date();
    // If current time is on or after the start of Monday 00:00:00 of this week, it is in progress or past -> LOCKED
    return now >= weekStart;
  }, [weekStart]);

  // Tasks Query
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", "schedule", activeWorkspace?.id],
    queryFn: () => getTasks({ page_size: 250 }),
  });

  const allTasks = useMemo(() => tasksData?.results || tasksData || [], [tasksData]);

  // Local schedule storage map for the workspace
  const scheduleStorageKey = `siraye:schedule:${activeWorkspace?.id || "default"}:${weekKey}`;

  const [scheduleMap, setScheduleMap] = useState(() => {
    try {
      const saved = localStorage.getItem(scheduleStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load scheduleMap when week changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(scheduleStorageKey);
      setScheduleMap(saved ? JSON.parse(saved) : {});
    } catch {
      setScheduleMap({});
    }
  }, [scheduleStorageKey]);

  function persistSchedule(newSchedule) {
    setScheduleMap(newSchedule);
    try {
      localStorage.setItem(scheduleStorageKey, JSON.stringify(newSchedule));
    } catch {
      // Storage error fallback
    }
  }

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTask(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // Days of the active week
  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStart, i);
      return {
        index: i,
        date,
        theme: DAY_THEMES[i],
        formatted: format(date, "MMM d"),
        isToday: isToday(date),
      };
    });
  }, [weekStart]);

  // Scheduled task IDs to filter backlog
  const scheduledTaskIds = useMemo(() => {
    const ids = new Set();
    Object.values(scheduleMap).forEach((daySlots) => {
      if (daySlots && typeof daySlots === "object") {
        Object.values(daySlots).forEach((item) => {
          if (item?.taskId) ids.add(String(item.taskId));
        });
      }
    });
    return ids;
  }, [scheduleMap]);

  // Available tasks to schedule (unassigned to this week)
  const availableTasks = useMemo(() => {
    return allTasks.filter(
      (task) =>
        !task.status?.is_done &&
        task.status?.category !== "done" &&
        !scheduledTaskIds.has(String(task.id))
    );
  }, [allTasks, scheduledTaskIds]);

  // Handle assigning a task to a day & slot (enforcing strictly 1 task at a time)
  function handleAssignSlot(task, dayIndex, slotId) {
    if (isWeekLocked) return;

    const dayKey = `day_${dayIndex}`;
    const daySlots = scheduleMap[dayKey] || {};

    // Calculate dates for task
    const targetDay = addDays(weekStart, dayIndex);
    const slot = TIME_SLOTS.find((s) => s.id === slotId);
    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM] = slot.endTime.split(":").map(Number);

    const startDateTime = new Date(targetDay);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(targetDay);
    endDateTime.setHours(endH, endM, 0, 0);

    const updated = {
      ...scheduleMap,
      [dayKey]: {
        ...daySlots,
        [slotId]: {
          taskId: task.id,
          title: task.title,
          priority: task.priority,
          projectName: task.project_name,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isUrgent: false,
        },
      },
    };

    persistSchedule(updated);
    setAssignModal(null);

    // Sync to backend task model
    updateTaskMutation.mutate({
      id: task.id,
      payload: {
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        due_date: endDateTime.toISOString(),
      },
    });
  }

  // Handle removing a task from a slot
  function handleRemoveFromSlot(dayIndex, slotId) {
    if (isWeekLocked) return;
    const dayKey = `day_${dayIndex}`;
    const daySlots = { ...(scheduleMap[dayKey] || {}) };
    delete daySlots[slotId];

    const updated = {
      ...scheduleMap,
      [dayKey]: daySlots,
    };
    persistSchedule(updated);
  }

  // Handle Urgent Schedule submission (Emergency Override)
  function handleUrgentSubmit(e) {
    e.preventDefault();
    const { taskId, newTitle, dayIndex, slotId, reason, projectId } = urgentForm;
    const dayKey = `day_${dayIndex}`;
    const daySlots = scheduleMap[dayKey] || {};
    const slot = TIME_SLOTS.find((s) => s.id === slotId);

    const targetDay = addDays(weekStart, Number(dayIndex));
    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM] = slot.endTime.split(":").map(Number);

    const startDateTime = new Date(targetDay);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(targetDay);
    endDateTime.setHours(endH, endM, 0, 0);

    if (taskId) {
      // Existing task urgent assignment
      const existingTask = allTasks.find((t) => String(t.id) === String(taskId));
      const updated = {
        ...scheduleMap,
        [dayKey]: {
          ...daySlots,
          [slotId]: {
            taskId: existingTask.id,
            title: existingTask.title,
            priority: "urgent",
            projectName: existingTask.project_name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isUrgent: true,
            urgentReason: reason || "Emergency Override",
          },
        },
      };

      persistSchedule(updated);
      setUrgentModalOpen(false);

      updateTaskMutation.mutate({
        id: existingTask.id,
        payload: {
          priority: "urgent",
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          due_date: endDateTime.toISOString(),
        },
      });
    } else if (newTitle.trim()) {
      // Create new urgent task
      const targetProject = projects.find((p) => String(p.id) === String(projectId)) || projects[0];
      const defaultStatus = targetProject?.statuses?.find((s) => s.category === "todo") || targetProject?.statuses?.[0];

      createTaskMutation.mutate(
        {
          title: newTitle.trim(),
          project: targetProject?.id,
          status_id: defaultStatus?.id,
          priority: "urgent",
          due_date: endDateTime.toISOString(),
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
        },
        {
          onSuccess: (created) => {
            const updated = {
              ...scheduleMap,
              [dayKey]: {
                ...daySlots,
                [slotId]: {
                  taskId: created.id,
                  title: created.title,
                  priority: "urgent",
                  projectName: targetProject?.name,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  isUrgent: true,
                  urgentReason: reason || "Emergency Override",
                },
              },
            };
            persistSchedule(updated);
            setUrgentModalOpen(false);
          },
        }
      );
    }
  }

  // Daily plan: fetch tasks scheduled for the selected day from weekly schedule
  const dailyPlanTasks = useMemo(() => {
    const dayKey = `day_${selectedDailyIndex}`;
    const daySlots = scheduleMap[dayKey] || {};

    return TIME_SLOTS.map((slot, slotIndex) => {
      const scheduledItem = daySlots[slot.id];
      const taskObject = scheduledItem ? allTasks.find((t) => String(t.id) === String(scheduledItem.taskId)) : null;

      // Color scheme for consecutive tasks
      const paletteIndex = (slotIndex * 3 + selectedDailyIndex) % TASK_PALETTES.length;
      const palette = TASK_PALETTES[paletteIndex];

      return {
        slot,
        slotIndex,
        palette,
        item: scheduledItem,
        task: taskObject,
        isOccupied: Boolean(scheduledItem),
      };
    });
  }, [scheduleMap, selectedDailyIndex, allTasks]);

  const activeDailyDay = daysOfWeek[selectedDailyIndex];

  if (isLoading) return <LoadingSpinner label="Loading weekly coordination schedule" />;

  return (
    <div className="animate-enter space-y-6">
      {/* Top Header & Week Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Icon name="calendarCheck" size={20} />
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Weekly & Daily Schedule
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Coordinate weekly plans with tasks created (strictly 1 task at a time). Daily plans fetch directly from your weekly schedule.
          </p>
        </div>

        {/* Action Controls & Urgent Schedule Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Urgent Schedule Button */}
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700 active:scale-95"
            onClick={() => {
              setUrgentForm({
                taskId: availableTasks[0]?.id ? String(availableTasks[0].id) : "",
                newTitle: "",
                dayIndex: selectedDailyIndex,
                slotId: "slot_1",
                reason: "",
                projectId: projects[0]?.id ? String(projects[0].id) : "",
              });
              setUrgentModalOpen(true);
            }}
            title="Emergency Override: insert urgent task into schedule"
            type="button"
          >
            <Icon name="alertTriangle" size={15} />
            Urgent Schedule
          </button>

          {/* View Mode Toggle: Weekly / Daily */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-[#171822]">
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === "weekly"
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              onClick={() => setViewMode("weekly")}
              type="button"
            >
              Weekly Plan
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === "daily"
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              onClick={() => setViewMode("daily")}
              type="button"
            >
              Daily Focus Plan
            </button>
          </div>
        </div>
      </div>

      {/* Week Selector Bar & Status Lock Alert */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#171822]">
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous week"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={() => setSelectedWeekDate((d) => subWeeks(d, 1))}
            type="button"
          >
            <Icon name="chevronLeft" size={17} />
          </button>

          <span className="font-heading text-sm font-bold text-slate-800 dark:text-slate-100">
            {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
          </span>

          <button
            aria-label="Next week"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={() => setSelectedWeekDate((d) => addWeeks(d, 1))}
            type="button"
          >
            <Icon name="chevronRight" size={17} />
          </button>

          <button
            className="ml-2 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => setSelectedWeekDate(new Date())}
            type="button"
          >
            Current Week
          </button>
        </div>

        {/* Lock Status Pill */}
        <div className="flex items-center gap-2">
          {isWeekLocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Icon name="lock" size={13} />
              Week In Progress (Locked Mon-Sun)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Icon name="unlock" size={13} />
              Future Week (Planning Unlocked)
            </span>
          )}
        </div>
      </div>

      {/* Lock Notice Info Banner */}
      {isWeekLocked ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <span className="mt-0.5 text-amber-600 dark:text-amber-400">
            <Icon name="lock" size={17} />
          </span>
          <div>
            <p className="font-bold">Weekly Commitment Lock Active</p>
            <p className="mt-0.5 leading-relaxed opacity-90">
              Weekly plans cannot be edited once Monday arrives through Sunday to encourage disciplined execution. Unscheduled or future weeks can be edited freely. For high-priority emergencies, use the <strong>Urgent Schedule</strong> button above.
            </p>
          </div>
        </div>
      ) : null}

      {/* VIEW 1: WEEKLY PLAN VIEW */}
      {viewMode === "weekly" ? (
        <div className="space-y-4">
          {/* Weekly 7-Day Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
            {daysOfWeek.map((day) => {
              const dayKey = `day_${day.index}`;
              const daySlots = scheduleMap[dayKey] || {};

              return (
                <div
                  key={day.index}
                  className={`flex flex-col rounded-2xl border ${day.theme.cardBorder} ${day.theme.bgCol} p-3.5 shadow-xs transition`}
                >
                  {/* Day Header with Distinct Colors */}
                  <header
                    className="flex items-center justify-between border-b border-slate-200/60 pb-2.5 dark:border-slate-800/80 cursor-pointer"
                    onClick={() => {
                      setSelectedDailyIndex(day.index);
                      setViewMode("daily");
                    }}
                    title="Click to view full Daily Focus Plan"
                  >
                    <div>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold shadow-xs ${day.theme.headerBg}`}>
                        {day.theme.name}
                      </span>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {day.formatted} {day.isToday ? "· Today" : ""}
                      </p>
                    </div>

                    <button
                      className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Focus on this day"
                      type="button"
                    >
                      <Icon name="arrowUpRight" size={14} />
                    </button>
                  </header>

                  {/* Day Slots List (1 task per slot strictly) */}
                  <div className="mt-3 flex-1 space-y-2">
                    {TIME_SLOTS.map((slot, slotIndex) => {
                      const item = daySlots[slot.id];
                      const taskObj = item ? allTasks.find((t) => String(t.id) === String(item.taskId)) : null;
                      const isCompleted = taskObj?.status?.category === "done" || taskObj?.status?.is_done;

                      // Consecutive task coloring: guaranteed no two consecutive tasks share same color
                      const paletteIndex = (slotIndex * 3 + day.index) % TASK_PALETTES.length;
                      const palette = TASK_PALETTES[paletteIndex];

                      return (
                        <div key={slot.id} className="relative">
                          {item ? (
                            <div
                              className={`rounded-xl border p-2.5 transition shadow-xs ${
                                item.isUrgent
                                  ? "border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40 ring-1 ring-rose-400"
                                  : `${palette.border} ${palette.bg}`
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${palette.chip}`}>
                                  {slot.startTime}
                                </span>

                                <div className="flex items-center gap-1">
                                  {item.isUrgent ? (
                                    <span className="rounded bg-rose-600 px-1 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                                      Urgent
                                    </span>
                                  ) : null}

                                  {!isWeekLocked ? (
                                    <button
                                      aria-label="Remove task from slot"
                                      className="rounded p-0.5 text-slate-400 hover:text-rose-600"
                                      onClick={() => handleRemoveFromSlot(day.index, slot.id)}
                                      type="button"
                                    >
                                      <Icon name="x" size={13} />
                                    </button>
                                  ) : null}
                                </div>
                              </div>

                              <h4
                                className={`mt-1.5 cursor-pointer text-xs font-bold leading-tight hover:underline ${
                                  isCompleted ? "line-through opacity-50" : palette.text
                                }`}
                                onClick={() => setSelectedTaskId(item.taskId)}
                              >
                                {item.title}
                              </h4>

                              {item.urgentReason ? (
                                <p className="mt-1 text-[10px] italic text-rose-600 dark:text-rose-400">
                                  {item.urgentReason}
                                </p>
                              ) : null}

                              <div className="mt-2 flex items-center justify-between border-t border-slate-200/50 pt-1.5 dark:border-slate-800/50">
                                <span className="text-[10px] text-slate-400">{slot.name}</span>
                                {taskObj && !isCompleted ? (
                                  <button
                                    className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 hover:bg-brand-700 hover:text-white dark:bg-slate-800 dark:text-brand-300"
                                    onClick={() => completeMutation.mutate(item.taskId)}
                                    type="button"
                                  >
                                    Done
                                  </button>
                                ) : isCompleted ? (
                                  <span className="text-[10px] font-bold text-emerald-600">✓ Done</span>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            /* Empty Slot */
                            <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200/80 bg-white/40 p-2 dark:border-slate-800 dark:bg-slate-900/30">
                              <span className="text-[10px] font-medium text-slate-400">
                                {slot.startTime} · Free
                              </span>

                              {!isWeekLocked ? (
                                <button
                                  className="rounded px-2 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
                                  onClick={() => setAssignModal({ dayIndex: day.index, slotId: slot.id })}
                                  type="button"
                                >
                                  + Assign
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">Locked</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: DAILY FOCUS PLAN (Fetched from Weekly Schedule) */
        <div className="space-y-6">
          {/* Day Tabs Switcher */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            {daysOfWeek.map((day) => (
              <button
                key={day.index}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  selectedDailyIndex === day.index
                    ? `${day.theme.headerBg} shadow-sm`
                    : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#171822] dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
                onClick={() => setSelectedDailyIndex(day.index)}
                type="button"
              >
                {day.theme.name} ({day.formatted})
              </button>
            ))}
          </div>

          {/* Daily Schedule Banner */}
          <div className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border ${activeDailyDay.theme.cardBorder} ${activeDailyDay.theme.bgCol} p-6 shadow-soft`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${activeDailyDay.theme.headerBg}`}>
                  {activeDailyDay.theme.name} Schedule
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Fetched directly from Week {format(weekStart, "w")}
                </span>
              </div>
              <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900 dark:text-white">
                {activeDailyDay.theme.name}, {format(activeDailyDay.date, "MMMM d, yyyy")}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Coordinated timeline with sequential non-overlapping single-task blocks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-center shadow-xs dark:bg-[#171822]">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {dailyPlanTasks.filter((t) => t.isOccupied).length}
                </p>
                <p className="text-[10px] text-slate-400">Tasks Planned</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-xs dark:bg-[#171822]">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {dailyPlanTasks.filter((t) => t.task?.status?.category === "done" || t.task?.status?.is_done).length}
                </p>
                <p className="text-[10px] text-slate-400">Completed</p>
              </div>
            </div>
          </div>

          {/* Daily Timeline Slots */}
          <div className="space-y-3.5">
            {dailyPlanTasks.map(({ slot, item, task, palette }) => {
              const isCompleted = task?.status?.category === "done" || task?.status?.is_done;

              return (
                <div
                  key={slot.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4.5 transition ${
                    item
                      ? item.isUrgent
                        ? "border-rose-400 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/25 ring-1 ring-rose-400/50"
                        : `${palette.border} ${palette.bg}`
                      : "border-dashed border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/30"
                  }`}
                >
                  {/* Time and Info */}
                  <div className="flex items-start gap-4">
                    <div className="min-w-[130px]">
                      <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${item ? palette.chip : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {slot.label}
                      </span>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">{slot.name}</p>
                    </div>

                    <div className="min-w-0 flex-1">
                      {item ? (
                        <>
                          <div className="flex items-center gap-2">
                            {item.isUrgent ? (
                              <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                                Urgent Override
                              </span>
                            ) : null}
                            {item.projectName ? (
                              <span className="rounded bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                {item.projectName}
                              </span>
                            ) : null}
                          </div>
                          <h3
                            className={`mt-1 font-heading text-base font-bold cursor-pointer hover:underline ${
                              isCompleted ? "line-through opacity-50" : palette.text
                            }`}
                            onClick={() => setSelectedTaskId(item.taskId)}
                          >
                            {item.title}
                          </h3>
                          {item.urgentReason ? (
                            <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400 italic">
                              Urgency reason: {item.urgentReason}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-sm italic text-slate-400">
                          Open Slot · No task scheduled. Only 1 task allowed at this time.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {item ? (
                      <>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-brand-50 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                          onClick={() => navigate(`/timer?taskId=${item.taskId}`)}
                          title="Focus with Pomodoro Timer"
                          type="button"
                        >
                          <Icon name="clock" size={14} />
                          Focus Timer
                        </button>

                        <button
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            isCompleted
                              ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              : "bg-brand-700 text-white shadow-sm hover:bg-brand-800"
                          }`}
                          disabled={isCompleted || completeMutation.isPending}
                          onClick={() => completeMutation.mutate(item.taskId)}
                          type="button"
                        >
                          {isCompleted ? "Completed ✓" : "Mark Done"}
                        </button>

                        {!isWeekLocked ? (
                          <button
                            aria-label="Remove task"
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                            onClick={() => handleRemoveFromSlot(selectedDailyIndex, slot.id)}
                            type="button"
                          >
                            <Icon name="x" size={16} />
                          </button>
                        ) : null}
                      </>
                    ) : !isWeekLocked ? (
                      <button
                        className="rounded-xl bg-brand-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-800"
                        onClick={() => setAssignModal({ dayIndex: selectedDailyIndex, slotId: slot.id })}
                        type="button"
                      >
                        + Assign Task
                      </button>
                    ) : (
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-400 dark:bg-slate-800">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Assignment Modal (Strict 1 task at a time) */}
      {assignModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setAssignModal(null)}
        >
          <div
            className="animate-enter w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Plan Slot
                </p>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  {daysOfWeek[assignModal.dayIndex].theme.name} · {TIME_SLOTS.find((s) => s.id === assignModal.slotId)?.label}
                </h3>
                <p className="text-xs text-slate-400">Strict single-task allocation (only 1 task allowed at this time)</p>
              </div>
              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setAssignModal(null)}
                type="button"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto scrollbar-subtle">
              {availableTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-400">No unassigned tasks found.</p>
                  <button
                    className="mt-3 text-xs font-bold text-brand-700 hover:underline dark:text-brand-300"
                    onClick={() => {
                      setAssignModal(null);
                      navigate("/tasks/new");
                    }}
                    type="button"
                  >
                    + Create a new task first
                  </button>
                </div>
              ) : (
                availableTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/30 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {task.project_name || "General"} · {task.priority || "Normal"}
                      </span>
                      <h4 className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {task.title}
                      </h4>
                    </div>

                    <button
                      className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-800"
                      onClick={() => handleAssignSlot(task, assignModal.dayIndex, assignModal.slotId)}
                      type="button"
                    >
                      Assign Slot
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Urgent Schedule Modal (Emergency Override) */}
      {urgentModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setUrgentModalOpen(false)}
        >
          <div
            className="animate-enter w-full max-w-lg rounded-2xl border border-rose-300 bg-white p-6 shadow-2xl dark:border-rose-800 dark:bg-slate-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-rose-100 pb-3 dark:border-rose-900/50">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  <Icon name="alertTriangle" size={17} />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold text-rose-700 dark:text-rose-300">
                    Urgent Schedule Override
                  </h3>
                  <p className="text-xs text-slate-400">
                    Schedule emergency work into a locked or active week.
                  </p>
                </div>
              </div>
              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setUrgentModalOpen(false)}
                type="button"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <form onSubmit={handleUrgentSubmit} className="mt-4 space-y-4">
              {/* Option 1: Select existing task or enter new title */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Select Existing Task to Schedule
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  onChange={(e) => setUrgentForm((f) => ({ ...f, taskId: e.target.value }))}
                  value={urgentForm.taskId}
                >
                  <option value="">-- Or type a new urgent task below --</option>
                  {allTasks
                    .filter((t) => !t.status?.is_done && t.status?.category !== "done")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.priority}] {t.title}
                      </option>
                    ))}
                </select>
              </div>

              {!urgentForm.taskId ? (
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Or New Urgent Task Title
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onChange={(e) => setUrgentForm((f) => ({ ...f, newTitle: e.target.value }))}
                    placeholder="E.g. Fix critical server outage"
                    value={urgentForm.newTitle}
                  />
                </div>
              ) : null}

              {/* Day & Slot Selection */}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Target Day
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onChange={(e) => setUrgentForm((f) => ({ ...f, dayIndex: Number(e.target.value) }))}
                    value={urgentForm.dayIndex}
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d.index} value={d.index}>
                        {d.theme.name} ({d.formatted})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Target Time Slot (1 task limit)
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onChange={(e) => setUrgentForm((f) => ({ ...f, slotId: e.target.value }))}
                    value={urgentForm.slotId}
                  >
                    {TIME_SLOTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.startTime} - {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Urgency Justification */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Urgency Justification / Reason
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  onChange={(e) => setUrgentForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Why does this task bypass regular locked planning?"
                  required
                  value={urgentForm.reason}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setUrgentModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  disabled={(!urgentForm.taskId && !urgentForm.newTitle.trim()) || !urgentForm.reason.trim()}
                  type="submit"
                >
                  Override & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Task Detail Modal */}
      <TaskDetailPanel onClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} />
    </div>
  );
}

