import { Project, ProjectMetadata } from "../types/project";

const STORAGE_KEY = "image-editor-projects";

export const saveProject = async (project: Project) => {
  // For now, save to localStorage
  const projects = JSON.parse(localStorage.getItem("projects") || "{}");
  projects[project.id] = {
    ...project,
    lastModified: new Date().toISOString(),
  };
  localStorage.setItem("projects", JSON.stringify(projects));
};

export const loadProjects = (): Project[] => {
  const projects = JSON.parse(localStorage.getItem("projects") || "{}");
  return Object.values(projects);
};

export const loadProject = async (id: string): Promise<Project | null> => {
  const projectJson = localStorage.getItem(`project-${id}`);
  return projectJson ? JSON.parse(projectJson) : null;
};

export const loadAllProjects = async (): Promise<ProjectMetadata[]> => {
  const projectsJson = localStorage.getItem(STORAGE_KEY);
  return projectsJson ? JSON.parse(projectsJson) : [];
};

export const deleteProject = async (id: string): Promise<void> => {
  const projects = await loadAllProjects();
  const updatedProjects = projects.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  localStorage.removeItem(`project-${id}`);
};
