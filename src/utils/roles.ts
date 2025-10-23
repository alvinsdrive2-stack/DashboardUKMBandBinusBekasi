import { OrganizationLvl } from '@/types';

export const isManager = (organizationLvl: string): boolean => {
  return organizationLvl === 'COMMISSIONER' || organizationLvl === 'PENGURUS';
};

export const isMember = (organizationLvl: string): boolean => {
  return organizationLvl === 'TALENT' || organizationLvl === 'SPECTA';
};

export const canManageEvents = (organizationLvl: string): boolean => {
  return isManager(organizationLvl);
};

export const canViewPendingEvents = (organizationLvl: string): boolean => {
  return isManager(organizationLvl);
};

export const canRegisterForEvents = (organizationLvl: string): boolean => {
  return isMember(organizationLvl);
};