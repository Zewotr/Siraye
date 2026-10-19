import Avatar from "./Avatar";
import Icon from "./Icon";

const priorityStyles = {
  urgent: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-sky-500",
  none: "bg-slate-300 dark:bg-slate-600",
};

function dueLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TaskCard({ task, onClick, draggable = false, onDragEnd, onDragStart }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date() && !task.status?.is_done && task.status?.category !== "done";
  return (
    <article
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-slate-800 dark:bg-[#1b1c27] dark:hover:border-violet-500/40"
      draggable={draggable}
      onClick={() => onClick?.(task)}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart?.(event, task)}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityStyles[task.priority] || priorityStyles.none}`} title={`${task.priority || "none"} priority`} />
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">{task.title}</h3>
        <button aria-label="Open task" className="-mr-1 -mt-1 rounded-md p-1 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-800" type="button">
          <Icon name="dots" size={16} />
        </button>
      </div>
      {task.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{task.description}</p> : null}
      {task.labels?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.labels.slice(0, 2).map((label) => (
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" key={label.id} style={{ backgroundColor: `${label.color}1F`, color: label.color }}>
              {label.name}
            </span>
          ))}
          {task.labels.length > 2 ? <span className="px-1 text-[10px] font-bold text-slate-400">+{task.labels.length - 2}</span> : null}
        </div>
      ) : null}
      <footer className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-400">
          {task.due_date ? (
            <span className={`inline-flex items-center gap-1 font-medium ${overdue ? "text-rose-500" : ""}`}>
              <Icon name="calendar" size={13} /> {dueLabel(task.due_date)}
            </span>
          ) : null}
          {task.checklist_total ? (
            <span className={`inline-flex items-center gap-1 ${task.checklist_total === task.checklist_completed ? "text-emerald-500" : ""}`}>
              <Icon name="checkSquare" size={13} /> {task.checklist_completed}/{task.checklist_total}
            </span>
          ) : null}
          {task.comments_count ? <span className="inline-flex items-center gap-1"><Icon name="message" size={13} /> {task.comments_count}</span> : null}
        </div>
        {task.assignees?.length ? (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((assignee) => <Avatar className="ring-2 ring-white dark:ring-[#1b1c27]" key={assignee.id} size="xs" user={assignee} />)}
          </div>
        ) : null}
      </footer>
    </article>
  );
}
