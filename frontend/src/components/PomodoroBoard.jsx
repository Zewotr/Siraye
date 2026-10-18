import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { completeTask, getTask, getTasks, updateChecklistItem } from "../api/tasks";
import Icon from "./Icon";

const DEFAULT_SETTINGS = {
  focusTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  roundsCount: 4,
  soundEnabled: true,
  autoStartBreaks: false,
  autoStartFocus: false,
};

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch {
    // Ignore audio permission/context errors
  }
}

export default function PomodoroBoard({ customTasks, projectId, initialTaskId }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("siraye:pomotroid_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [mode, setMode] = useState("focus"); // 'focus' | 'shortBreak' | 'longBreak'
  const [timeLeft, setTimeLeft] = useState(settings.focusTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(() => {
    const saved = localStorage.getItem(`siraye:pomo_count:${new Date().toDateString()}`);
    return saved ? Number(saved) : 0;
  });

  const [localTaskId, setLocalTaskId] = useState(initialTaskId || "");
  const selectedTaskId = searchParams.get("taskId") || localTaskId;

  // Task queries if customTasks not passed
  const { data: tasksData } = useQuery({
    queryKey: ["tasks", "timer-queue", projectId],
    queryFn: () => getTasks({ project: projectId || undefined, completed: "false", page_size: 50 }),
    enabled: !customTasks,
  });

  const { data: activeTaskData } = useQuery({
    queryKey: ["task", selectedTaskId],
    queryFn: () => getTask(selectedTaskId),
    enabled: Boolean(selectedTaskId),
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", selectedTaskId] });
    },
  });

  const checklistMutation = useMutation({
    mutationFn: ({ id, payload }) => updateChecklistItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", selectedTaskId] });
    },
  });

  const tasks = useMemo(() => {
    if (customTasks) return customTasks.filter((t) => !t.status?.is_done && t.status?.category !== "done");
    return tasksData?.results || tasksData || [];
  }, [customTasks, tasksData]);

  const activeTask = activeTaskData || tasks.find((t) => String(t.id) === String(selectedTaskId));

  const totalDuration = useMemo(() => {
    if (mode === "focus") return settings.focusTime * 60;
    if (mode === "shortBreak") return settings.shortBreakTime * 60;
    return settings.longBreakTime * 60;
  }, [mode, settings]);

  const prevModeRef = useRef(mode);
  const prevSettingsRef = useRef(settings);

  useEffect(() => {
    if (!isRunning) {
      if (prevModeRef.current !== mode || prevSettingsRef.current !== settings) {
        setTimeLeft(totalDuration);
      }
    }
    prevModeRef.current = mode;
    prevSettingsRef.current = settings;
  }, [mode, settings, isRunning, totalDuration]);

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, currentRound, settings]);

  function handleSessionComplete() {
    setIsRunning(false);
    if (settings.soundEnabled) {
      playChime();
    }

    if (mode === "focus") {
      const nextCount = completedSessionsCount + 1;
      setCompletedSessionsCount(nextCount);
      localStorage.setItem(`siraye:pomo_count:${new Date().toDateString()}`, String(nextCount));

      if (currentRound >= settings.roundsCount) {
        setMode("longBreak");
        setTimeLeft(settings.longBreakTime * 60);
        setCurrentRound(1);
        if (settings.autoStartBreaks) setIsRunning(true);
      } else {
        setMode("shortBreak");
        setTimeLeft(settings.shortBreakTime * 60);
        setCurrentRound((r) => r + 1);
        if (settings.autoStartBreaks) setIsRunning(true);
      }
    } else {
      setMode("focus");
      setTimeLeft(settings.focusTime * 60);
      if (settings.autoStartFocus) setIsRunning(true);
    }
  }

  function handleReset() {
    setIsRunning(false);
    setTimeLeft(totalDuration);
  }

  function handleSkip() {
    setIsRunning(false);
    if (mode === "focus") {
      if (currentRound >= settings.roundsCount) {
        setMode("longBreak");
        setTimeLeft(settings.longBreakTime * 60);
        setCurrentRound(1);
      } else {
        setMode("shortBreak");
        setTimeLeft(settings.shortBreakTime * 60);
        setCurrentRound((r) => r + 1);
      }
    } else {
      setMode("focus");
      setTimeLeft(settings.focusTime * 60);
    }
  }

  function updateSetting(key, val) {
    const next = { ...settings, [key]: val };
    setSettings(next);
    localStorage.setItem("siraye:pomotroid_settings", JSON.stringify(next));
  }

  function selectTask(taskId) {
    setLocalTaskId(taskId);
    const next = new URLSearchParams(searchParams);
    if (taskId) next.set("taskId", taskId);
    else next.delete("taskId");
    setSearchParams(next, { replace: true });
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const modeTheme = {
    focus: {
      color: "#255a54",
      bgClass: "bg-brand-500/10 text-brand-700 dark:text-brand-300",
      btnClass: "bg-brand-700 hover:bg-brand-800 text-white shadow-brand-700/25",
      ringColor: "#255a54",
      title: "Focus Time",
    },
    shortBreak: {
      color: "#0284c7",
      bgClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
      btnClass: "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/25",
      ringColor: "#0284c7",
      title: "Short Break",
    },
    longBreak: {
      color: "#7c3aed",
      bgClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
      btnClass: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/25",
      ringColor: "#7c3aed",
      title: "Long Break",
    },
  }[mode];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#171822] dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => setShowSettings(true)}
          type="button"
        >
          <Icon name="settings" size={14} />
          Timer settings
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Pomodoro Clock Display (8 cols) */}
        <section className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-[#171822] lg:col-span-8">
          {/* Mode Switcher */}
          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900">
            <button
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                mode === "focus"
                  ? "bg-white text-brand-700 shadow-sm dark:bg-[#171822] dark:text-brand-300"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              onClick={() => {
                setMode("focus");
                setIsRunning(false);
                setTimeLeft(settings.focusTime * 60);
              }}
              type="button"
            >
              Focus ({settings.focusTime}m)
            </button>
            <button
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                mode === "shortBreak"
                  ? "bg-white text-sky-700 shadow-sm dark:bg-[#171822] dark:text-sky-300"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              onClick={() => {
                setMode("shortBreak");
                setIsRunning(false);
                setTimeLeft(settings.shortBreakTime * 60);
              }}
              type="button"
            >
              Short Break ({settings.shortBreakTime}m)
            </button>
            <button
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                mode === "longBreak"
                  ? "bg-white text-violet-700 shadow-sm dark:bg-[#171822] dark:text-violet-300"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              onClick={() => {
                setMode("longBreak");
                setIsRunning(false);
                setTimeLeft(settings.longBreakTime * 60);
              }}
              type="button"
            >
              Long Break ({settings.longBreakTime}m)
            </button>
          </div>

          {/* Pomotroid Circle */}
          <div className="relative my-8 flex items-center justify-center">
            <svg className="h-[290px] w-[290px] -rotate-90 transform" viewBox="0 0 300 300">
              <circle
                className="text-slate-100 dark:text-slate-800/80"
                cx="150"
                cy="150"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
              />
              <circle
                cx="150"
                cy="150"
                fill="transparent"
                r={radius}
                stroke={modeTheme.ringColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="11"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${modeTheme.bgClass}`}>
                {modeTheme.title}
              </span>
              <h2 className="mt-2 font-heading text-6xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl">
                {formattedTime}
              </h2>

              <div className="mt-3.5 flex items-center gap-2">
                {Array.from({ length: settings.roundsCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                      i < currentRound
                        ? "scale-110 bg-brand-600 dark:bg-brand-400"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                    title={`Round ${i + 1}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                Round {currentRound} of {settings.roundsCount}
              </p>
            </div>
          </div>

          {/* Controls: Reset, Play/Pause, Skip */}
          <div className="flex items-center gap-4">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={handleReset}
              title="Reset Timer"
              type="button"
            >
              <Icon name="rotateCcw" size={19} />
            </button>

            <button
              className={`flex h-15 w-36 items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-lg transition active:scale-95 ${modeTheme.btnClass}`}
              onClick={() => setIsRunning(!isRunning)}
              type="button"
            >
              <Icon name={isRunning ? "pause" : "play"} size={20} />
              {isRunning ? "Pause" : "Focus"}
            </button>

            <button
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={handleSkip}
              title="Skip to next session"
              type="button"
            >
              <Icon name="skipForward" size={19} />
            </button>
          </div>

          {/* Active Focused Task Bar */}
          {activeTask ? (
            <div className="mt-7 flex w-full max-w-md items-center justify-between rounded-2xl border border-brand-200 bg-brand-50/70 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Focusing On
                </p>
                <h4 className="mt-0.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                  {activeTask.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-brand-800 disabled:opacity-50"
                  disabled={completeMutation.isPending}
                  onClick={() => completeMutation.mutate(activeTask.id)}
                  type="button"
                >
                  <span className="flex items-center gap-1">
                    <Icon name="check" size={13} />
                    Done
                  </span>
                </button>
                <button
                  aria-label="Deselect task"
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  onClick={() => selectTask("")}
                  type="button"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-xs text-slate-400">
              Select a task from the side queue to focus and track your workflow.
            </p>
          )}

          {/* Quick Metrics */}
          <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{completedSessionsCount}</p>
              <p className="text-[10px] text-slate-400">Sessions</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{completedSessionsCount * settings.focusTime}m</p>
              <p className="text-[10px] text-slate-400">Focused</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{settings.roundsCount - currentRound + 1}</p>
              <p className="text-[10px] text-slate-400">To Long Break</p>
            </div>
          </div>
        </section>

        {/* Task Focus Queue (4 cols) */}
        <section className="flex flex-col rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-[#171822] lg:col-span-4">
          <header className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                Task Queue
              </h3>
              <p className="text-xs text-slate-400">Select task to focus</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {tasks.length}
            </span>
          </header>

          <div className="scrollbar-subtle mt-4 flex-1 space-y-2.5 overflow-y-auto max-h-[500px]">
            {tasks.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-400">No pending tasks in queue.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const isSelected = String(task.id) === String(selectedTaskId);

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl border p-3 transition ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                        : "border-slate-200/70 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {task.project_name ? (
                          <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {task.project_name}
                          </span>
                        ) : null}
                        <h4 className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {task.title}
                        </h4>
                      </div>

                      <button
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          isSelected
                            ? "bg-brand-700 text-white"
                            : "bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        }`}
                        onClick={() => selectTask(isSelected ? "" : task.id)}
                        type="button"
                      >
                        {isSelected ? "Active" : "Focus"}
                      </button>
                    </div>

                    {isSelected && activeTask?.checklist_items?.length ? (
                      <div className="mt-2.5 border-t border-brand-200/60 pt-2 dark:border-brand-500/20">
                        <div className="space-y-1">
                          {activeTask.checklist_items.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300"
                            >
                              <input
                                checked={item.is_completed}
                                className="rounded text-brand-600 focus:ring-brand-500"
                                onChange={() =>
                                  checklistMutation.mutate({
                                    id: item.id,
                                    payload: { is_completed: !item.is_completed },
                                  })
                                }
                                type="checkbox"
                              />
                              <span className={item.is_completed ? "line-through opacity-50" : ""}>
                                {item.content}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Settings Modal */}
      {showSettings ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                Pomodoro Settings
              </h3>
              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setShowSettings(false)}
                type="button"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Focus (minutes)
                  <input
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    max={120}
                    min={1}
                    onChange={(e) => updateSetting("focusTime", Number(e.target.value) || 25)}
                    type="number"
                    value={settings.focusTime}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Short Break (min)
                  <input
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    max={60}
                    min={1}
                    onChange={(e) => updateSetting("shortBreakTime", Number(e.target.value) || 5)}
                    type="number"
                    value={settings.shortBreakTime}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Long Break (min)
                  <input
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    max={60}
                    min={1}
                    onChange={(e) => updateSetting("longBreakTime", Number(e.target.value) || 15)}
                    type="number"
                    value={settings.longBreakTime}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Rounds before Long Break
                  <input
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    max={12}
                    min={1}
                    onChange={(e) => updateSetting("roundsCount", Number(e.target.value) || 4)}
                    type="number"
                    value={settings.roundsCount}
                  />
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Sound chime alert on completion</span>
                  <input
                    checked={settings.soundEnabled}
                    className="rounded text-brand-700 focus:ring-brand-500"
                    onChange={(e) => updateSetting("soundEnabled", e.target.checked)}
                    type="checkbox"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Auto-start breaks</span>
                  <input
                    checked={settings.autoStartBreaks}
                    className="rounded text-brand-700 focus:ring-brand-500"
                    onChange={(e) => updateSetting("autoStartBreaks", e.target.checked)}
                    type="checkbox"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Auto-start focus after break</span>
                  <input
                    checked={settings.autoStartFocus}
                    className="rounded text-brand-700 focus:ring-brand-500"
                    onChange={(e) => updateSetting("autoStartFocus", e.target.checked)}
                    type="checkbox"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                className="rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white hover:bg-brand-800"
                onClick={() => setShowSettings(false)}
                type="button"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

