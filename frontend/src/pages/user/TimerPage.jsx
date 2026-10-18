import Icon from "../../components/Icon";
import PomodoroBoard from "../../components/PomodoroBoard";

export default function TimerPage() {
  return (
    <div className="animate-enter space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <Icon name="clock" size={20} />
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Pomodoro Focus Board
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sleek Pomotroid-inspired interval timer for deliberate, flow-state productivity. Set focus time, take regular breaks, and track your work.
        </p>
      </div>

      <PomodoroBoard />
    </div>
  );
}

