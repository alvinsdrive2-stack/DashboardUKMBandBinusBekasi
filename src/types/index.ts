import { User, Event, EventPersonnel, OrganizationLvl, EventStatus, ApprovalStatus } from '../generated/prisma';

export type {
  User,
  Event,
  EventPersonnel,
  OrganizationLvl,
  EventStatus,
  ApprovalStatus
};

// Extended types with relations
export type EventWithPersonnel = Event & {
  personnel: (EventPersonnel & {
    user?: User | null;
  })[];
};

export type UserWithPersonnel = User & {
  eventPersonnel: (EventPersonnel & {
    event: Event;
  })[];
};

// Form types
export interface EventSubmissionForm {
  title: string;
  description: string;
  date: string;
  location: string;
  submittedBy: string;
  email: string;
  phoneNumber: string;
}

export interface UserRegistration {
  name: string;
  nim: string;
  email: string;
  major: string;
  instruments: string[];
  phoneNumber: string;
  organizationLvl: OrganizationLvl;
  technicLvl: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  password: string;
}

// Dashboard types
export interface DashboardStats {
  totalEvents: number;
  pendingEvents: number;
  upcomingEvents: number;
  completedEvents: number;
}