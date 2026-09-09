import { createContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  addCommentRequest,
  completeSprintRequest,
  createBoardRequest,
  createCardRequest,
  createProjectRequest,
  createSprintRequest,
  deleteProjectRequest,
  deleteBoardRequest,
  deleteCardRequest,
  getActivitiesRequest,
  getProjectDetailsRequest,
  getProjectsRequest,
  inviteMemberRequest,
  moveCardRequest,
  renameBoardRequest,
  startSprintRequest,
  updateCardRequest,
  updateSprintRequest,
} from "../api/projectApi";
import { useAuth } from "../hooks/useAuth";

export const ProjectContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const ProjectProvider = ({ children }) => {
  const { token, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [projectView, setProjectView] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setProjects([]);
      setActiveProjectId("");
      setProjectView(null);
      setActivities([]);
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const connection = io(SOCKET_URL, { autoConnect: true });
    setSocket(connection);

    return () => {
      connection.disconnect();
    };
  }, [token]);

  const resetProjectState = () => {
    setProjects([]);
    setActiveProjectId("");
    setProjectView(null);
    setActivities([]);
  };

  const ensureReviewBoard = async (projectId, view) => {
    const reviewBoards = (view?.boards || []).filter((board) => board.name.toLowerCase().includes("review"));

    if (reviewBoards.length > 0) {
      return view;
    }

    await createBoardRequest(projectId, { name: "In Code Review" });
    return getProjectDetailsRequest(projectId);
  };

  const handleRequestError = async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      resetProjectState();
      logout();
      return true;
    }

    if (status === 404) {
      await refreshProjects();
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    refreshProjects();
  }, [token]);

  useEffect(() => {
    if (!socket || !activeProjectId) {
      return;
    }

    socket.emit("project:join", activeProjectId);
    const handleProjectUpdated = (payload) => {
      if (payload.project?._id === activeProjectId) {
        setProjectView(payload);
      }
    };

    socket.on("project:updated", handleProjectUpdated);

    return () => {
      socket.emit("project:leave", activeProjectId);
      socket.off("project:updated", handleProjectUpdated);
    };
  }, [socket, activeProjectId]);

  const refreshProjects = async () => {
    setIsLoading(true);
    try {
      const response = await getProjectsRequest();
      setProjects(response.projects);

      const nextActiveProject = response.projects.find((project) => project._id === activeProjectId);

      if (!nextActiveProject) {
        setActiveProjectId(response.projects[0]?._id || "");
      }

      if (response.projects.length === 0) {
        setProjectView(null);
        setActivities([]);
      }
    } catch (error) {
      const wasHandled = await handleRequestError(error);
      if (!wasHandled) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadProject = async (projectId) => {
    setActiveProjectId(projectId);
    try {
      const [rawView, activityResponse] = await Promise.all([
        getProjectDetailsRequest(projectId),
        getActivitiesRequest(projectId),
      ]);
      const view = await ensureReviewBoard(projectId, rawView);
      setProjectView(view);
      setActivities(activityResponse.activities);
    } catch (error) {
      const wasHandled = await handleRequestError(error);
      if (!wasHandled) {
        throw error;
      }
    }
  };

  const createProject = async (payload) => {
    const response = await createProjectRequest(payload);
    await refreshProjects();
    setActiveProjectId(response.project._id);
    setProjectView(response);
    setActivities([]);
  };

  const deleteProject = async (projectId) => {
    await deleteProjectRequest(projectId);
    const response = await getProjectsRequest();
    const remainingProjects = response.projects;
    const fallbackProjectId = remainingProjects[0]?._id || "";

    setProjects(remainingProjects);

    if (activeProjectId === projectId) {
      setActiveProjectId(fallbackProjectId);
      setProjectView(null);
      setActivities([]);
      return;
    }

    setProjectView((currentView) =>
      currentView?.project?._id === projectId ? null : currentView
    );
  };

  const inviteMember = async (payload) => {
    const response = await inviteMemberRequest(activeProjectId, payload);
    setProjectView(response);
    const activityResponse = await getActivitiesRequest(activeProjectId);
    setActivities(activityResponse.activities);
  };

  const createBoard = async (payload) => {
    await createBoardRequest(activeProjectId, payload);
    await loadProject(activeProjectId);
  };

  const createSprint = async (payload) => {
    const response = await createSprintRequest(activeProjectId, payload);
    setProjectView(response);
    const activityResponse = await getActivitiesRequest(activeProjectId);
    setActivities(activityResponse.activities);
  };

  const updateSprint = async (sprintId, payload) => {
    const response = await updateSprintRequest(activeProjectId, sprintId, payload);
    setProjectView(response);
    const activityResponse = await getActivitiesRequest(activeProjectId);
    setActivities(activityResponse.activities);
  };

  const startSprint = async (sprintId) => {
    const response = await startSprintRequest(activeProjectId, sprintId);
    setProjectView(response);
    const activityResponse = await getActivitiesRequest(activeProjectId);
    setActivities(activityResponse.activities);
  };

  const completeSprint = async (sprintId) => {
    const response = await completeSprintRequest(activeProjectId, sprintId);
    setProjectView(response);
    const activityResponse = await getActivitiesRequest(activeProjectId);
    setActivities(activityResponse.activities);
  };

  const renameBoard = async (boardId, payload) => {
    await renameBoardRequest(boardId, payload);
    await loadProject(activeProjectId);
  };

  const deleteBoard = async (boardId) => {
    await deleteBoardRequest(boardId);
    await loadProject(activeProjectId);
  };

  const createCard = async (boardId, payload) => {
    await createCardRequest(boardId, payload);
    await loadProject(activeProjectId);
  };

  const updateCard = async (cardId, payload) => {
    await updateCardRequest(cardId, payload);
    await loadProject(activeProjectId);
  };

  const deleteCard = async (cardId) => {
    await deleteCardRequest(cardId);
    await loadProject(activeProjectId);
  };

  const moveCard = async (cardId, payload) => {
    const response = await moveCardRequest(cardId, payload);
    setProjectView(response);
    const activityResponse = await getActivitiesRequest(activeProjectId);
    setActivities(activityResponse.activities);
  };

  const addComment = async (cardId, payload) => {
    await addCommentRequest(cardId, payload);
    await loadProject(activeProjectId);
  };

  const value = useMemo(
    () => ({
      projects,
      activeProjectId,
      projectView,
      activities,
      isLoading,
      setActiveProjectId,
      refreshProjects,
      loadProject,
      createProject,
      deleteProject,
      inviteMember,
      createBoard,
      createSprint,
      updateSprint,
      startSprint,
      completeSprint,
      renameBoard,
      deleteBoard,
      createCard,
      updateCard,
      deleteCard,
      moveCard,
      addComment,
    }),
    [projects, activeProjectId, projectView, activities, isLoading]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};
