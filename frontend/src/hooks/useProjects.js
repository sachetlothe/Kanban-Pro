import { useContext } from "react";
import { ProjectContext } from "../context/ProjectContext.jsx";

export const useProjects = () => useContext(ProjectContext);
