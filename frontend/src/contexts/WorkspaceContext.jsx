import { createContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getProjects } from "../api/projects";
import { getWorkspaces } from "../api/workspaces";
import { useAuth } from "../hooks/useAuth";

export const WorkspaceContext = createContext(null);

function normalizeList(data) {
  return data?.results || data || [];
}

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState(() => localStorage.getItem("siraye:workspace"));

  const workspacesQuery = useQuery({
    queryKey: ["workspaces", user?.id],
    queryFn: getWorkspaces,
    enabled: Boolean(user?.id),
  });
  const workspaces = normalizeList(workspacesQuery.data);
  const activeWorkspace = workspaces.find((workspace) => String(workspace.id) === String(workspaceId)) || workspaces[0] || null;

  useEffect(() => {
    if (!activeWorkspace) return;
    const nextId = String(activeWorkspace.id);
    if (workspaceId !== nextId) setWorkspaceId(nextId);
    localStorage.setItem("siraye:workspace", nextId);
  }, [activeWorkspace, workspaceId]);

  const projectsQuery = useQuery({
    queryKey: ["projects", "workspace", activeWorkspace?.id],
    queryFn: () => getProjects({ workspace: activeWorkspace.id, archived: false }),
    enabled: Boolean(activeWorkspace?.id),
  });
  const projects = normalizeList(projectsQuery.data);

  const value = useMemo(
    () => ({
      workspaces,
      isLoadingWorkspaces: workspacesQuery.isLoading,
      workspacesError: workspacesQuery.error,
      activeWorkspace,
      setActiveWorkspace: (workspace) => setWorkspaceId(String(typeof workspace === "object" ? workspace.id : workspace)),
      projects,
      isLoadingProjects: projectsQuery.isLoading,
    }),
    [workspaces, workspacesQuery.isLoading, workspacesQuery.error, activeWorkspace, projects, projectsQuery.isLoading]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
