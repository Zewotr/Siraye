import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { submitOnboarding } from "../../api/auth";
import Icon from "../../components/Icon";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../hooks/useWorkspace";
import { applyThemeColor } from "../../utils/theme";

const COLOR_OPTIONS = [
  { id: "#255A54", name: "Deep Pine", class: "bg-[#255A54]", text: "text-[#255A54]", desc: "Classic Siraye" },
  { id: "#635BFF", name: "Electric Indigo", class: "bg-[#635BFF]", text: "text-[#635BFF]", desc: "Modern & high energy" },
  { id: "#0EA5E9", name: "Ocean Sky", class: "bg-[#0EA5E9]", text: "text-[#0EA5E9]", desc: "Calm & expansive" },
  { id: "#10B981", name: "Emerald Mint", class: "bg-[#10B981]", text: "text-[#10B981]", desc: "Fresh & productive" },
  { id: "#F59E0B", name: "Warm Amber", class: "bg-[#F59E0B]", text: "text-[#F59E0B]", desc: "Creative & motivating" },
  { id: "#F43F5E", name: "Rose Sunset", class: "bg-[#F43F5E]", text: "text-[#F43F5E]", desc: "Bold & striking" },
  { id: "#8B5CF6", name: "Royal Violet", class: "bg-[#8B5CF6]", text: "text-[#8B5CF6]", desc: "Deep & focused" },
];

const JOB_ROLES = [
  {
    id: "student",
    label: "Student",
    icon: "🎓",
    description: "Coursework, exams, research schedules & study pomodoros",
  },
  {
    id: "government_worker",
    label: "Government Worker",
    icon: "🏛️",
    description: "Public administration, departmental coordination & reporting",
  },
  {
    id: "teacher",
    label: "Teacher / Educator",
    icon: "📚",
    description: "Lesson planning, grading periods, lectures & academic tracking",
  },
  {
    id: "software_engineer",
    label: "Software Engineer / Tech",
    icon: "💻",
    description: "Sprints, bug tracking, code reviews & release milestones",
  },
  {
    id: "healthcare",
    label: "Healthcare Professional",
    icon: "🏥",
    description: "Clinical tasks, shift planning, patient admin & rotations",
  },
  {
    id: "business_owner",
    label: "Business Owner / Manager",
    icon: "💼",
    description: "Team objectives, client deliverables, finances & company growth",
  },
  {
    id: "freelancer",
    label: "Freelancer / Creative",
    icon: "🎨",
    description: "Client deadlines, creative milestones & hourly project delivery",
  },
  {
    id: "other",
    label: "Other Profession",
    icon: "🚀",
    description: "Specialized roles, personal task planning & lifelong learning",
  },
];

const GOAL_OPTIONS = [
  { id: "weekly_planner", label: "Weekly Schedule Coordination", icon: "calendarCheck" },
  { id: "pomodoro_focus", label: "Pomotroid Deep Work & Focus Timer", icon: "clock" },
  { id: "consistency_tracker", label: "Punctuality & Habit Consistency", icon: "trendingUp" },
  { id: "team_projects", label: "Multi-Project & Kanban Boards", icon: "layers" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { setActiveWorkspace } = useWorkspace();

  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem("siraye:theme") || "system");
  const [selectedRole, setSelectedRole] = useState(JOB_ROLES[0].id);
  const [customRoleText, setCustomRoleText] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(GOAL_OPTIONS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Live Color Application
  function handleColorSelect(color) {
    setSelectedColor(color);
    applyThemeColor(color.id);
  }

  // Live Theme Application
  function handleThemeChange(themeId) {
    setSelectedTheme(themeId);
    localStorage.setItem("siraye:theme", themeId);
    if (themeId === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeId === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }

  async function handleFinish(event) {
    if (event) event.preventDefault();

    const roleToSubmit = selectedRole === "other" && customRoleText.trim() ? customRoleText.trim() : selectedRole;

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        job_type: roleToSubmit,
        accent_color: selectedColor.id,
        theme_preference: selectedTheme,
        primary_goal: selectedGoal,
      };

      await submitOnboarding(payload);

      // Save locally & apply immediately
      localStorage.setItem("siraye:color", selectedColor.id);
      applyThemeColor(selectedColor.id);
      localStorage.setItem("siraye:job_type", roleToSubmit);
      localStorage.setItem("siraye:primary_goal", selectedGoal);

      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save personalization. Proceeding to dashboard...");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  }

  const firstName = (user?.name || "").split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#f8f9fc] px-4 py-10 text-slate-900 dark:bg-[#0c0d14] dark:text-slate-100 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Onboarding Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3.5 py-1 text-xs font-bold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <Icon name="sparkles" size={14} />
            Quick Workspace Setup
          </div>
          <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome to Siraye, {firstName}!
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Customize your workspace appearance and tell us what you do so we can tailor the system to your workflow.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* STEP 1: What describes your role / occupation? */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-xs font-black text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                1
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  What best describes your daily role?
                </h2>
                <p className="text-xs text-slate-400">
                  Used for tailored task suggestions and platform analytics.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {JOB_ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/30 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-2xl shrink-0">{role.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                          {role.label}
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-brand-700 p-0.5 text-white dark:bg-brand-500">
                            <Icon name="check" size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                        {role.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedRole === "other" && (
              <div className="mt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Please specify your occupation / profession
                </label>
                <input
                  type="text"
                  value={customRoleText}
                  onChange={(e) => setCustomRoleText(e.target.value)}
                  placeholder="e.g. Architect, Researcher, Pilot..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
          </section>

          {/* STEP 2: Workspace Accent Color (At least 5 rich colors) */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-xs font-black text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  2
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                    Pick your workspace accent color
                  </h2>
                  <p className="text-xs text-slate-400">
                    Colors your projects, cards, and daily highlights.
                  </p>
                </div>
              </div>

              {/* Selected Color Chip */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedColor.id }} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedColor.name}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
              {COLOR_OPTIONS.map((color) => {
                const isSelected = selectedColor.id === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`group flex flex-col items-center gap-2.5 rounded-2xl border p-3.5 text-center transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-50/80 ring-2 ring-slate-900/10 dark:border-white dark:bg-slate-800 dark:ring-white/10"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850"
                    }`}
                  >
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition group-hover:scale-105`}
                      style={{ backgroundColor: color.id }}
                    >
                      {isSelected && <Icon name="check" size={16} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        {color.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate max-w-[80px]">
                        {color.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 3: Interface Theme */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-xs font-black text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                3
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  Interface Theme
                </h2>
                <p className="text-xs text-slate-400">
                  Choose your visual preference with instant preview.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { id: "light", label: "Light Mode", icon: "sun", desc: "Clean & high contrast" },
                { id: "dark", label: "Dark Mode", icon: "moon", desc: "Low-glare midnight focus" },
                { id: "system", label: "System Auto", icon: "sidebar", desc: "Matches OS setting" },
              ].map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeChange(theme.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/40 text-brand-700 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400"
                    }`}
                  >
                    <Icon name={theme.icon} size={22} />
                    <div>
                      <span className="block text-xs font-bold">{theme.label}</span>
                      <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5">{theme.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 4: Primary Productivity Goal */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-xs font-black text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                4
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  What is your main productivity goal?
                </h2>
                <p className="text-xs text-slate-400">
                  We'll prioritize this view in your daily dashboard.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/30 text-brand-900 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10 dark:text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300"
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: selectedColor.id }}
                    >
                      <Icon name={goal.icon} size={17} />
                    </span>
                    <span className="text-xs font-bold">{goal.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Actions Bar */}
          <div className="flex flex-col-reverse items-center justify-between gap-4 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Skip setup for now →
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-700/25 transition hover:bg-brand-800 active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Icon name="refreshCw" size={16} className="animate-spin" />
                  Saving personalization…
                </>
              ) : (
                <>
                  Complete Setup & Open Dashboard
                  <Icon name="skipForward" size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

