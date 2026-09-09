import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { Sidebar } from "../components/Sidebar.jsx";

export const AppShell = () => {
  const { activeProjectId, loadProject } = useProjects();

  useEffect(() => {
    if (activeProjectId) {
      loadProject(activeProjectId);
    }
  }, [activeProjectId]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};
