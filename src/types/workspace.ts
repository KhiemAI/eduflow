import { SubjectConfig, Teacher, SchoolClass, TimetableEntry } from './index.ts';

export interface WorkspacePayload {
  classes: SchoolClass[];
  teachers: Teacher[];
  subjectsConfig: Record<string, SubjectConfig>;
  allTimetables: Record<string, TimetableEntry[]>;
  departmentName: string;
  schoolName: string;
  academicYear: string;
  periodsPerSession: number;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  payload: WorkspacePayload;
  version: number;
}