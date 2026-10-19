import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getLabels, getProjectMembers } from "../api/projects";
import { createTask } from "../api/tasks";
import Icon from "./Icon";

function toInputValue(date) {
  if (!date) return "";
  const value = new Date(date);
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default function CreateTaskModal({ open, onClose, project }) {
  const client = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status_id: "", due_date: "", assignee_ids: [], label_ids: [] });
  const labelsQuery = useQuery({ queryKey: ["labels", project?.workspace], queryFn: () => getLabels(project.workspace), enabled: Boolean(project?.workspace && open) });
  const membersQuery = useQuery({ queryKey: ["project-members", project?.id], queryFn: () => getProjectMembers(project.id), enabled: Boolean(project?.id && open) });

  useEffect(() => {
    if (!project) return;
    setForm({
      title: "",
      description: "",
      priority: "medium",
      status_id: String(project.statuses?.find((item) => item.category === "todo")?.id || project.statuses?.[0]?.id || ""),
      due_date: toInputValue(new Date(Date.now() + 3 * 86400000)),
      assignee_ids: [],
      label_ids: [],
    });
  }, [project, open]);

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["tasks"] });
      client.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
  });

  if (!open || !project) return null;
  const labels = labelsQuery.data?.results || labelsQuery.data || [];
  const members = membersQuery.data?.results || membersQuery.data || [];
  const toggle = (key, value) => setForm((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));

  function submit(event) {
    event.preventDefault();
    mutation.mutate({ ...form, project: project.id, status_id: Number(form.status_id), due_date: form.due_date || null, assignee_ids: form.assignee_ids, label_ids: form.label_ids });
  }

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section className="animate-enter w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">{project.key} · {project.name}</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-slate-900 dark:text-white">Create a task</h2>
          </div>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button"><Icon name="x" /></button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <input autoFocus className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-2 text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 dark:border-slate-700 dark:text-white" onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to be done?" required value={form.title} />
          <textarea className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800" onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add context, decisions, or an outcome…" rows={3} value={form.description} />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-500">Status<select className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" onChange={(event) => setForm({ ...form, status_id: event.target.value })} value={form.status_id}>{project.statuses?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-500">Priority<select className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" onChange={(event) => setForm({ ...form, priority: event.target.value })} value={form.priority}><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="none">None</option></select></label>
            <label className="text-xs font-semibold text-slate-500">Due date<input className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-[7px] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" onChange={(event) => setForm({ ...form, due_date: event.target.value })} type="datetime-local" value={form.due_date} /></label>
          </div>
          {members.length ? <div><p className="mb-2 text-xs font-semibold text-slate-500">Assign to</p><div className="flex flex-wrap gap-2">{members.map((member) => <button className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${form.assignee_ids.includes(member.user.id) ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200" : "border-slate-200 text-slate-500 dark:border-slate-700"}`} key={member.id} onClick={() => toggle("assignee_ids", member.user.id)} type="button">{member.user.name}</button>)}</div></div> : null}
          {labels.length ? <div><p className="mb-2 text-xs font-semibold text-slate-500">Labels</p><div className="flex flex-wrap gap-2">{labels.map((label) => <button className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${form.label_ids.includes(label.id) ? "ring-1" : "opacity-70"}`} key={label.id} onClick={() => toggle("label_ids", label.id)} style={{ borderColor: label.color, color: label.color, backgroundColor: form.label_ids.includes(label.id) ? `${label.color}16` : "transparent" }} type="button">{label.name}</button>)}</div></div> : null}
          {mutation.isError ? <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600">{mutation.error.response?.data?.detail || "Could not create this task. Check the project permissions and try again."}</p> : null}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button">Cancel</button><button className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700 disabled:opacity-60" disabled={mutation.isPending} type="submit"><Icon name="plus" size={15} />{mutation.isPending ? "Creating…" : "Create task"}</button></div>
        </form>
      </section>
    </div>
  );
}
