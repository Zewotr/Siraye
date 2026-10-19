import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getLabels, getProject, getProjectMembers } from "../api/projects";
import { createChecklistItem, createComment, getTask, updateChecklistItem, updateTask } from "../api/tasks";
import Avatar from "./Avatar";
import Icon from "./Icon";

const priorityNames = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low", none: "No priority" };

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function activityLabel(item) {
  const name = item.actor?.name || "Someone";
  if (item.action === "created") return `${name} created this task`;
  if (item.action === "status_changed") return `${name} moved it to ${item.metadata?.status || "a new status"}`;
  if (item.action === "assigned") return `${name} updated assignees`;
  if (item.action === "commented") return `${name} left a comment`;
  if (item.action === "checklist_updated") return `${name} updated the checklist`;
  return `${name} updated this task`;
}

export default function TaskDetailPanel({ taskId, onClose }) {
  const client = useQueryClient();
  const [comment, setComment] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [description, setDescription] = useState("");
  const taskQuery = useQuery({ queryKey: ["task", taskId], queryFn: () => getTask(taskId), enabled: Boolean(taskId) });
  const task = taskQuery.data;
  const projectQuery = useQuery({ queryKey: ["project", task?.project], queryFn: () => getProject(task.project), enabled: Boolean(task?.project) });
  const membersQuery = useQuery({ queryKey: ["project-members", task?.project], queryFn: () => getProjectMembers(task.project), enabled: Boolean(task?.project) });
  const labelsQuery = useQuery({ queryKey: ["labels", task?.workspace_id], queryFn: () => getLabels(task.workspace_id), enabled: Boolean(task?.workspace_id) });

  useEffect(() => setDescription(task?.description || ""), [task?.id, task?.description]);
  useEffect(() => {
    const escape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose]);

  const refresh = () => {
    client.invalidateQueries({ queryKey: ["task", taskId] });
    client.invalidateQueries({ queryKey: ["tasks"] });
  };
  const updateMutation = useMutation({ mutationFn: (payload) => updateTask(taskId, payload), onSuccess: refresh });
  const checklistMutation = useMutation({ mutationFn: createChecklistItem, onSuccess: refresh });
  const toggleChecklistMutation = useMutation({ mutationFn: ({ id, payload }) => updateChecklistItem(id, payload), onSuccess: refresh });
  const commentMutation = useMutation({ mutationFn: createComment, onSuccess: () => { setComment(""); refresh(); } });

  if (!taskId) return null;
  const members = membersQuery.data?.results || membersQuery.data || [];
  const labels = labelsQuery.data?.results || labelsQuery.data || [];
  const statuses = projectQuery.data?.statuses || [];
  const assignedIds = task?.assignees?.map((user) => user.id) || [];
  const labelIds = task?.labels?.map((label) => label.id) || [];

  function setAssignee(userId) {
    updateMutation.mutate({ assignee_ids: assignedIds.includes(userId) ? assignedIds.filter((id) => id !== userId) : [...assignedIds, userId] });
  }

  function setLabel(labelId) {
    updateMutation.mutate({ label_ids: labelIds.includes(labelId) ? labelIds.filter((id) => id !== labelId) : [...labelIds, labelId] });
  }

  function addChecklist(event) {
    event.preventDefault();
    if (!checklistText.trim()) return;
    checklistMutation.mutate({ task: task.id, content: checklistText.trim() });
    setChecklistText("");
  }

  function submitComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    const mentioned = members.filter((member) => comment.toLowerCase().includes(`@${member.user.name.split(" ")[0].toLowerCase()}`)).map((member) => member.user.id);
    commentMutation.mutate({ task: task.id, body: comment.trim(), mention_ids: mentioned });
  }

  return (
    <div className="fixed inset-0 z-[1600] flex justify-end bg-slate-950/25 backdrop-blur-[1px]" onMouseDown={onClose}>
      <aside className="animate-enter scrollbar-subtle h-full w-full max-w-[630px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#171822]" onMouseDown={(event) => event.stopPropagation()}>
        {taskQuery.isLoading ? <div className="space-y-5 p-7"><div className="skeleton h-7 w-3/4 rounded" /><div className="skeleton h-28 rounded-xl" /><div className="skeleton h-40 rounded-xl" /></div> : null}
        {taskQuery.isError ? <div className="p-7"><p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">This task could not be loaded. It may no longer be available.</p><button className="mt-4 text-sm font-semibold text-violet-600" onClick={onClose} type="button">Close panel</button></div> : null}
        {task ? (
          <div className="p-5 sm:p-7">
            <header className="flex items-start gap-3">
              <span className="mt-2 h-3 w-3 rounded-full" style={{ backgroundColor: task.status?.color }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">{task.project_name}</p>
                <input className="mt-1 w-full border-0 bg-transparent p-0 font-heading text-2xl font-bold leading-tight text-slate-900 outline-none dark:text-white" defaultValue={task.title} onBlur={(event) => event.target.value !== task.title && updateMutation.mutate({ title: event.target.value })} />
              </div>
              <button aria-label="Close task detail" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button"><Icon name="x" /></button>
            </header>

            <div className="mt-6 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/75 p-3 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900/60">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Status<select className="mt-1 block w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none dark:text-slate-200" onChange={(event) => updateMutation.mutate({ status_id: Number(event.target.value) })} value={task.status?.id || ""}>{statuses.length ? statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option value={task.status?.id}>{task.status?.name || "Loading…"}</option>}</select></label>
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Priority<select className="mt-1 block w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none dark:text-slate-200" onChange={(event) => updateMutation.mutate({ priority: event.target.value })} value={task.priority}>{Object.entries(priorityNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Due date<input className="mt-1 block w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none dark:text-slate-200" onChange={(event) => updateMutation.mutate({ due_date: event.target.value || null })} type="datetime-local" value={localDateTime(task.due_date)} /></label>
            </div>

            <section className="mt-7">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Description</h3>
              <textarea className="mt-2 min-h-24 w-full resize-none rounded-xl border border-transparent bg-slate-50 p-3 text-sm leading-6 text-slate-600 outline-none transition focus:border-violet-300 focus:bg-white dark:bg-slate-900 dark:text-slate-300 dark:focus:border-violet-500/50 dark:focus:bg-slate-900" onBlur={() => description !== task.description && updateMutation.mutate({ description })} onChange={(event) => setDescription(event.target.value)} placeholder="Add a clear outcome, useful context, or a decision." value={description} />
            </section>

            <section className="mt-7 grid gap-5 sm:grid-cols-2">
              <div><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Assignees</h3><div className="mt-2 flex flex-wrap gap-2">{members.map((member) => <button className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs font-semibold transition ${assignedIds.includes(member.user.id) ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200" : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"}`} key={member.id} onClick={() => setAssignee(member.user.id)} type="button"><Avatar size="xs" user={member.user} />{member.user.name}</button>)}</div></div>
              <div><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Labels</h3><div className="mt-2 flex flex-wrap gap-2">{labels.map((label) => <button className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${labelIds.includes(label.id) ? "ring-1" : "opacity-60"}`} key={label.id} onClick={() => setLabel(label.id)} style={{ borderColor: label.color, color: label.color, backgroundColor: labelIds.includes(label.id) ? `${label.color}15` : "transparent" }} type="button">{label.name}</button>)}</div></div>
            </section>

            <section className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="flex items-center justify-between"><h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Checklist</h3><span className="text-xs font-semibold text-slate-400">{task.checklist_completed}/{task.checklist_total} complete</span></div>
              <div className="mt-3 space-y-1">{task.checklist_items?.map((item) => <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60" key={item.id}><input checked={item.is_completed} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" onChange={() => toggleChecklistMutation.mutate({ id: item.id, payload: { is_completed: !item.is_completed } })} type="checkbox" /><span className={item.is_completed ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}>{item.content}</span></label>)}</div>
              <form className="mt-2 flex gap-2" onSubmit={addChecklist}><input className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-slate-700" onChange={(event) => setChecklistText(event.target.value)} placeholder="Add checklist item" value={checklistText} /><button className="rounded-lg bg-slate-100 px-3 text-slate-600 hover:bg-violet-50 hover:text-violet-600 dark:bg-slate-800 dark:text-slate-300" type="submit"><Icon name="plus" size={16} /></button></form>
            </section>

            <section className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Conversation</h3>
              <div className="mt-4 space-y-4">{task.comments?.map((item) => <article className="flex gap-2.5" key={item.id}><Avatar size="sm" user={item.author} /><div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-baseline justify-between gap-2"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.author?.name || "Former teammate"}</p><time className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</time></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p></div></article>)}</div>
              <form className="mt-4 flex gap-2" onSubmit={submitComment}><Avatar size="sm" user={null} /><textarea className="min-h-16 flex-1 resize-none rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm outline-none focus:border-violet-400 dark:border-slate-700" onChange={(event) => setComment(event.target.value)} placeholder="Leave a comment… use @FirstName to mention a teammate" value={comment} /><button className="self-end rounded-lg bg-violet-600 p-2.5 text-white hover:bg-violet-700 disabled:opacity-60" disabled={commentMutation.isPending || !comment.trim()} type="submit"><Icon name="arrowUpRight" size={17} /></button></form>
            </section>

            <section className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800"><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Activity</h3><div className="mt-3 space-y-3">{task.activity?.map((item) => <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" key={item.id}><span className="h-1.5 w-1.5 rounded-full bg-violet-400" /><span>{activityLabel(item)}</span><span className="ml-auto shrink-0 text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span></div>)}</div></section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
