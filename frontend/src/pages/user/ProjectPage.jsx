import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { getProject } from "../../api/projects";
import { getTasks, reorderTasks } from "../../api/tasks";
import CreateTaskModal from "../../components/CreateTaskModal";
import Icon from "../../components/Icon";
import TaskCard from "../../components/TaskCard";
import TaskDetailPanel from "../../components/TaskDetailPanel";
import { formatDate } from "../../utils/format";

function getList(data) {
  return data?.results || data || [];
}

function BoardSkeleton() {
  return <div className="grid min-w-[900px] grid-cols-4 gap-4">{[1, 2, 3, 4].map((column) => <div key={column}><div className="skeleton h-5 w-24 rounded" />{[1, 2, 3].map((card) => <div className="skeleton mt-3 h-28 rounded-xl" key={card} />)}</div>)}</div>;
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const client = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const tasksQuery = useQuery({ queryKey: ["tasks", "project", projectId, search, priority], queryFn: () => getTasks({ project: projectId, search: search || undefined, priority: priority || undefined, page_size: 250 }) });
  const reorderMutation = useMutation({ mutationFn: reorderTasks, onSuccess: () => client.invalidateQueries({ queryKey: ["tasks"] }) });
  const project = projectQuery.data;
  const tasks = getList(tasksQuery.data);
  const groupedTasks = useMemo(() => {
    const groups = Object.fromEntries((project?.statuses || []).map((item) => [item.id, []]));
    tasks.forEach((task) => {
      if (groups[task.status?.id]) groups[task.status.id].push(task);
    });
    return groups;
  }, [project?.statuses, tasks]);
  const modalOpen = searchParams.get("new") === "1";

  function toggleModal(open) {
    const next = new URLSearchParams(searchParams);
    if (open) next.set("new", "1");
    else next.delete("new");
    setSearchParams(next, { replace: true });
  }

  function moveTask(statusId) {
    if (!draggedTask || draggedTask.status?.id === statusId) return setDraggedTask(null);
    const nextIds = [...(groupedTasks[statusId] || []).map((task) => task.id), draggedTask.id];
    reorderMutation.mutate({ status_id: statusId, task_ids: nextIds });
    setDraggedTask(null);
  }

  if (projectQuery.isLoading) return <BoardSkeleton />;
  if (projectQuery.isError || !project) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">This project is not available or you no longer have access.</div>;

  return (
    <div className="animate-enter min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg" style={{ backgroundColor: project.color }}><Icon name="layers" size={21} /></span>
          <div><div className="flex items-center gap-2"><h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{project.name}</h1><span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{project.key}</span></div><p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{project.description || "A focused space for moving work forward together."}</p></div>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700" onClick={() => toggleModal(true)} type="button"><Icon name="plus" size={17} />New task</button>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-y border-slate-200/80 py-3 dark:border-slate-800">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 transition focus-within:ring-violet-300 dark:bg-slate-900 dark:ring-slate-800 dark:focus-within:ring-violet-500/50"><Icon className="text-slate-400" name="search" size={16} /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" value={search} /></div>
        <div className="flex items-center gap-2"><div className="relative"><Icon className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" name="filter" size={15} /><select className="rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-600 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300" onChange={(event) => setPriority(event.target.value)} value={priority}><option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="none">No priority</option></select></div><div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800"><button aria-label="Board view" className={`rounded-md p-1.5 ${view === "board" ? "bg-violet-600 text-white" : "text-slate-400"}`} onClick={() => setView("board")} type="button"><Icon name="grid" size={16} /></button><button aria-label="List view" className={`rounded-md p-1.5 ${view === "list" ? "bg-violet-600 text-white" : "text-slate-400"}`} onClick={() => setView("list")} type="button"><Icon name="list" size={16} /></button></div></div>
      </div>

      {view === "board" ? (
        <div className="scrollbar-subtle mt-5 overflow-x-auto pb-4">
          {tasksQuery.isLoading ? <BoardSkeleton /> : <div className="grid min-w-[950px] grid-cols-5 gap-4">{project.statuses?.map((status) => <section className="rounded-xl bg-slate-100/80 p-2.5 dark:bg-slate-900/70" key={status.id} onDragOver={(event) => event.preventDefault()} onDrop={() => moveTask(status.id)}><header className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} /><h2 className="text-xs font-bold text-slate-600 dark:text-slate-300">{status.name}</h2><span className="text-[11px] font-semibold text-slate-400">{groupedTasks[status.id]?.length || 0}</span></div><button className="rounded p-1 text-slate-400 hover:bg-white hover:text-violet-600 dark:hover:bg-slate-800" onClick={() => toggleModal(true)} type="button"><Icon name="plus" size={15} /></button></header><div className="min-h-[160px] space-y-2.5">{groupedTasks[status.id]?.map((task) => <TaskCard draggable key={task.id} onClick={(item) => setSelectedTaskId(item.id)} onDragStart={(_, item) => setDraggedTask(item)} task={task} />)}{!groupedTasks[status.id]?.length ? <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">Drop work here</div> : null}</div></section>)}</div>}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#171822]">
          <div className="scrollbar-subtle overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 dark:border-slate-800 dark:bg-slate-900"><tr><th className="px-5 py-3">Task</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Priority</th><th className="px-3 py-3">Due</th><th className="px-3 py-3">Assignees</th></tr></thead><tbody>{tasks.map((task) => <tr className="cursor-pointer border-b border-slate-50 text-sm transition hover:bg-violet-50/50 dark:border-slate-800 dark:hover:bg-violet-500/5" key={task.id} onClick={() => setSelectedTaskId(task.id)}><td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-200">{task.title}</td><td className="px-3 py-3.5"><span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.status?.color }} />{task.status?.name}</span></td><td className="px-3 py-3.5 text-xs capitalize text-slate-500">{task.priority}</td><td className="px-3 py-3.5 text-xs text-slate-500">{formatDate(task.due_date)}</td><td className="px-3 py-3.5"><div className="flex -space-x-1">{task.assignees?.slice(0, 3).map((user) => <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-700 ring-2 ring-white dark:ring-[#171822]" key={user.id}>{user.name?.slice(0, 1)}</span>)}</div></td></tr>)}{tasks.length === 0 ? <tr><td className="px-5 py-12 text-center text-sm text-slate-400" colSpan="5">No tasks match these filters.</td></tr> : null}</tbody></table></div>
        </div>
      )}
      <CreateTaskModal onClose={() => toggleModal(false)} open={modalOpen} project={project} />
      <TaskDetailPanel onClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} />
    </div>
  );
}
