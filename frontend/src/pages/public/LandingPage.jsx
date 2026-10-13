import { Link } from "react-router-dom";

import Icon from "../../components/Icon";

const boardColumns = [
  {
    title: "To do",
    count: "02",
    tasks: [
      { title: "Map the onboarding journey", label: "Product", color: "bg-sky-100 text-sky-800", date: "Today", priority: "bg-rose-500" },
      { title: "Collect launch-day feedback", label: "Research", color: "bg-amber-100 text-amber-800", date: "Tomorrow", priority: "bg-amber-400" },
    ],
  },
  {
    title: "In progress",
    count: "02",
    tasks: [
      { title: "Prepare the first-run checklist", label: "Design", color: "bg-emerald-100 text-emerald-800", date: "Today", priority: "bg-rose-500" },
      { title: "Review workspace permissions", label: "Engineering", color: "bg-violet-100 text-violet-800", date: "Jun 18", priority: "bg-sky-500" },
    ],
  },
  {
    title: "Done",
    count: "01",
    tasks: [
      { title: "Agree on the launch goals", label: "Planning", color: "bg-orange-100 text-orange-800", date: "Complete", priority: "bg-amber-400", done: true },
    ],
  },
];

const features = [
  {
    icon: "layers",
    number: "01",
    title: "Give work a home",
    description: "Group tasks by project and workspace, so everyone knows where work belongs and what the team is moving toward.",
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    icon: "calendar",
    number: "02",
    title: "Make priorities visible",
    description: "Set owners, due dates, and priority. Reminders bring upcoming work back into view before it slips by.",
    tone: "bg-amber-50 text-amber-800",
  },
  {
    icon: "users",
    number: "03",
    title: "Move forward together",
    description: "Share context and coordinate with your team, while workspace roles help keep access clear and intentional.",
    tone: "bg-sky-50 text-sky-800",
  },
];

export default function LandingPage() {
  return (
    <div className="pb-16">
      <section className="grid gap-12 pb-16 pt-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-12">
        <div className="animate-enter">
          <p className="mb-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-800">
            <span className="h-2 w-2 rounded-full bg-accent" />
            A calmer way to get it done
          </p>
          <h1 className="max-w-xl font-heading text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
            Make room for the work that matters.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Siraye brings your projects, priorities, and people into one clear view, so you can spend less time keeping track and more time moving forward.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900" to="/login">
              Start planning <Icon name="arrowUpRight" size={17} />
            </Link>
            <a className="inline-flex min-h-12 items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-brand-900 transition hover:bg-brand-50" href="#how-it-works">
              See how it works <Icon name="arrowUpRight" size={16} />
            </a>
          </div>
          <p className="mt-5 text-xs font-medium text-slate-500">One workspace for the plan, the people, and the next step.</p>
        </div>

        <div aria-label="Illustration of a project board with tasks in progress" className="relative min-w-0 animate-enter lg:pl-2" role="img">
          <div className="absolute -inset-3 -rotate-2 rounded-xl bg-brand-100 sm:-inset-5" />
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-float">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-800 text-white"><Icon name="layers" size={16} /></span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-slate-800 sm:text-sm">Product launch</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Team workspace / Q3</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-[10px] font-semibold text-slate-500 sm:text-xs">
                <span className="hidden items-center gap-1 sm:inline-flex"><Icon name="users" size={14} /> 4 people</span>
                <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-800">Board view</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
              <div>
                <p className="font-heading text-base font-semibold text-slate-900 sm:text-lg">Launch checklist</p>
                <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">A shared view of what moves the launch forward.</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-brand-800 sm:text-xs"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> On track</span>
            </div>
            <div className="grid grid-cols-3 gap-2 overflow-hidden px-3 pb-4 sm:gap-3 sm:px-5 sm:pb-5">
              {boardColumns.map((column) => (
                <div className="min-w-0" key={column.title}>
                  <div className="mb-2 flex items-center justify-between gap-1 border-t-2 border-brand-200 pt-2">
                    <p className="truncate text-[9px] font-extrabold text-slate-600 sm:text-[11px]">{column.title}</p>
                    <span className="text-[9px] text-slate-400">{column.count}</span>
                  </div>
                  <div className="space-y-2">
                    {column.tasks.map((task) => (
                      <article className="min-h-[94px] rounded-md border border-slate-200 bg-white p-2 shadow-sm sm:min-h-[112px] sm:p-2.5" key={task.title}>
                        <div className="flex items-start gap-1.5">
                          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${task.priority}`} />
                          <p className={`line-clamp-2 text-[9px] font-bold leading-4 sm:text-[11px] ${task.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{task.title}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                          <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold sm:text-[9px] ${task.color}`}>{task.label}</span>
                          <span className="inline-flex items-center gap-1 text-[8px] text-slate-400 sm:text-[9px]"><Icon name="calendar" size={11} /> {task.date}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[9px] text-slate-500 sm:px-5 sm:text-[10px]">
              <span className="inline-flex items-center gap-1.5"><Icon name="checkSquare" size={13} /> 1 of 5 tasks complete</span>
              <span>Updated just now</span>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-2 hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-soft sm:flex lg:-left-6">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-100 text-amber-800"><Icon name="bell" size={15} /></span>
            <span className="text-[10px] font-bold text-slate-700">A timely nudge, right on schedule</span>
          </div>
        </div>
      </section>

      <section aria-label="Siraye at a glance" className="grid grid-cols-1 border-y border-slate-200 py-5 sm:grid-cols-3">
        <div className="flex items-center gap-3 py-2 sm:justify-center sm:border-r sm:border-slate-200 sm:py-0">
          <Icon className="text-brand-700" name="checkSquare" size={19} />
          <p className="text-xs font-bold text-slate-700">Tasks with owners and due dates</p>
        </div>
        <div className="flex items-center gap-3 py-2 sm:justify-center sm:border-r sm:border-slate-200 sm:py-0">
          <Icon className="text-brand-700" name="bell" size={19} />
          <p className="text-xs font-bold text-slate-700">Reminders before work is due</p>
        </div>
        <div className="flex items-center gap-3 py-2 sm:justify-center sm:py-0">
          <Icon className="text-brand-700" name="users" size={19} />
          <p className="text-xs font-bold text-slate-700">Projects shared with your team</p>
        </div>
      </section>

      <section className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16" id="how-it-works">
        <div className="max-w-md">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-brand-800">A little more headspace</p>
          <h2 className="font-heading text-3xl font-semibold leading-tight text-ink sm:text-4xl">From scattered to moving, one clear step at a time.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">Siraye gives everyday team work enough structure to stay visible, without making the process feel like another job.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article className="border-t border-slate-200 pt-4" key={feature.number}>
              <div className="flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-md ${feature.tone}`}><Icon name={feature.icon} size={18} /></span>
                <span className="font-heading text-xs font-bold text-slate-400">{feature.number}</span>
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-lg bg-brand-900 px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-10">
        <div className="max-w-xl">
          <p className="text-xs font-extrabold uppercase tracking-wider text-brand-200">Make the next step clear</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">Bring your team's work into focus.</h2>
          <p className="mt-2 text-sm leading-6 text-brand-100">Sign in to open your workspace and pick up where your team left off.</p>
        </div>
        <Link className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-brand-900 transition hover:bg-brand-50" to="/login">
          Go to Siraye <Icon name="arrowUpRight" size={17} />
        </Link>
      </section>
    </div>
  );
}
