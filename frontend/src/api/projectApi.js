import { api } from "./client";

export const getProjectsRequest = async () => (await api.get("/projects")).data;
export const createProjectRequest = async (payload) => (await api.post("/projects", payload)).data;
export const getProjectDetailsRequest = async (projectId) => (await api.get(`/projects/${projectId}`)).data;
export const deleteProjectRequest = async (projectId) => (await api.delete(`/projects/${projectId}`)).data;
export const inviteMemberRequest = async (projectId, payload) =>
  (await api.post(`/projects/${projectId}/invite`, payload)).data;
export const createBoardRequest = async (projectId, payload) =>
  (await api.post(`/projects/${projectId}/boards`, payload)).data;
export const createSprintRequest = async (projectId, payload) =>
  (await api.post(`/projects/${projectId}/sprints`, payload)).data;
export const updateSprintRequest = async (projectId, sprintId, payload) =>
  (await api.patch(`/projects/${projectId}/sprints/${sprintId}`, payload)).data;
export const startSprintRequest = async (projectId, sprintId) =>
  (await api.patch(`/projects/${projectId}/sprints/${sprintId}/start`)).data;
export const completeSprintRequest = async (projectId, sprintId) =>
  (await api.patch(`/projects/${projectId}/sprints/${sprintId}/complete`)).data;
export const renameBoardRequest = async (boardId, payload) =>
  (await api.patch(`/projects/boards/${boardId}`, payload)).data;
export const deleteBoardRequest = async (boardId) => (await api.delete(`/projects/boards/${boardId}`)).data;
export const createCardRequest = async (boardId, payload) => (await api.post(`/cards/boards/${boardId}`, payload)).data;
export const updateCardRequest = async (cardId, payload) => (await api.patch(`/cards/${cardId}`, payload)).data;
export const deleteCardRequest = async (cardId) => (await api.delete(`/cards/${cardId}`)).data;
export const moveCardRequest = async (cardId, payload) => (await api.patch(`/cards/${cardId}/move`, payload)).data;
export const addCommentRequest = async (cardId, payload) => (await api.post(`/cards/${cardId}/comments`, payload)).data;
export const getActivitiesRequest = async (projectId) => (await api.get(`/activities/${projectId}`)).data;
