export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  gradient: string;
  preferences?: {
    theme: "light" | "dark" | "system";
    notifications: boolean;
  };
  createdAt: Date;
}

export interface Subject {
  _id: string;
  name: string;
  color: number;
  creditHours: number;
  professor: string;
  archived: boolean;
  createdBy: string | User;
  createdAt: Date;
}

export interface Assignment {
  _id: string;
  subject: string | Subject;
  title: string;
  description?: string;
  dueDate: Date;
  category: "Lab" | "Theory" | "Project" | "Presentation" | "Quiz" | "Admin";
  priority: "High" | "Medium" | "Low";
  files: FileAttachment[];
  createdBy: string | User;
  createdAt: Date;
}

export interface Submission {
  _id: string;
  assignment: string | Assignment;
  user: string | User;
  submittedAt: Date;
  isLate: boolean;
  penaltyNote?: string;
}

export interface Task {
  _id: string;
  name: string;
  type: string;
  deadline: Date;
  priority: "High" | "Medium" | "Low";
  notes?: string;
  files: FileAttachment[];
  subTasks: SubTask[];
  createdBy: string | User;
  createdAt: Date;
}

export interface TaskCompletion {
  _id: string;
  task: string | Task;
  user: string | User;
  completedAt: Date;
}

export interface SubTask {
  _id: string;
  description: string;
  assignedTo?: string | User;
  completed: boolean;
  completedAt?: Date;
}

export interface Exam {
  _id: string;
  subject: string | Subject;
  name: string;
  date: Date;
  totalMarks: number;
  createdBy: string | User;
  createdAt: Date;
}

export interface Mark {
  _id: string;
  exam: string | Exam;
  user: string | User;
  score: number;
  recordedBy: string | User;
  recordedAt: Date;
}

export interface AttendanceRecord {
  _id: string;
  subject: string | Subject;
  user: string | User;
  date: Date;
  status: "present" | "absent";
  markedBy: string | User;
  createdAt: Date;
}

export interface Resource {
  _id: string;
  subject: string | Subject;
  title: string;
  type: "pdf" | "image" | "link" | "note";
  url?: string;
  content?: string;
  tags: string[];
  uploadedBy: string | User;
  starredBy: string[];
  uploadedAt: Date;
}

export interface StudySession {
  _id: string;
  subject?: string | Subject;
  title: string;
  scheduledDate: Date;
  duration: number; // minutes
  attendees: string[];
  notes?: string;
  createdBy: string | User;
  createdAt: Date;
}

export interface SyllabusTopic {
  _id: string;
  name: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}

export interface Syllabus {
  _id: string;
  subject: string | Subject;
  topics: SyllabusTopic[];
  uploadedBy: string | User;
  uploadedAt: Date;
}

export interface RevisionTopic {
  _id: string;
  subject: string | Subject;
  topicName: string;
  status: "Not Started" | "Studying" | "Needs Revision" | "Mastered";
  revisionRounds: number;
  user: string | User;
  updatedAt: Date;
}

export interface Comment {
  _id: string;
  itemId: string;
  itemType: "assignment" | "task";
  user: string | User;
  text: string;
  mentions: string[];
  replies: CommentReply[];
  createdAt: Date;
}

export interface CommentReply {
  _id: string;
  user: string | User;
  text: string;
  mentions: string[];
  createdAt: Date;
}

export interface ActivityLog {
  _id: string;
  action: string;
  user: string | User;
  itemId?: string;
  itemType?: string;
  details: string;
  reactions?: { emoji: string; users: string[] }[];
  createdAt: Date;
}

export interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  version: number;
  uploadedBy: string;
  uploadedAt: Date;
}
