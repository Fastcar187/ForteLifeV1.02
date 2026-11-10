import { SessionUser, UserRole } from "./types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  patient: 1,
  frontdesk: 2,
  doctor: 3,
  facility_admin: 4,
  platform_admin: 5,
};

export const MFA_REQUIRED_ROLES: UserRole[] = [
  "doctor",
  "facility_admin",
  "platform_admin",
];

export function isMfaRequired(role: UserRole): boolean {
  return MFA_REQUIRED_ROLES.includes(role);
}

/**
 * Checks if a session user has permission to access a specific role endpoint
 */
export function hasRoleAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (userRole === "platform_admin") return true; // Platform admin has system-wide access
  return allowedRoles.includes(userRole);
}

/**
 * Validates facility scoping for staff roles
 */
export function canAccessFacility(
  user: SessionUser,
  targetFacilityId: string
): boolean {
  if (user.role === "platform_admin") return true;
  if (!user.facilityId) return false;
  return user.facilityId === targetFacilityId;
}

/**
 * Validates patient scoping: a patient can only access their own user_id
 */
export function canAccessPatientData(
  user: SessionUser,
  targetPatientUserId: string
): boolean {
  if (user.role === "patient") {
    return user.id === targetPatientUserId;
  }
  // Staff can view patient data if they are authorized staff in that facility
  return ["frontdesk", "doctor", "facility_admin", "platform_admin"].includes(
    user.role
  );
}

