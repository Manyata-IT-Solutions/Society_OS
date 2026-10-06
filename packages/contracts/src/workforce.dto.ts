import {
  WorkerType,
  WorkerStatus,
  EngagementType,
  ProficiencyLevel,
  AttendanceMethod,
  LeaveType,
} from '@community-os/types';

export interface CreateWorkerDto {
  organizationId: string;
  primaryCommunityId?: string;
  workerType?: WorkerType;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  photoDocumentId?: string;
  userId?: string;
}

export interface UpdateWorkerDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  status?: WorkerStatus;
  primaryCommunityId?: string;
  userId?: string;
}

export interface LinkUserDto {
  workerId: string;
  userId: string;
}

export interface CreateEngagementDto {
  workerId: string;
  organizationId: string;
  communityId?: string;
  vendorId?: string;
  engagementType: EngagementType;
  employmentReference?: string;
  startDate: string;
  endDate?: string;
  departmentId?: string;
  jobRoleId?: string;
  managerWorkerId?: string;
}

export interface CreateDepartmentDto {
  organizationId: string;
  communityId?: string;
  code: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
}

export interface CreateJobRoleDto {
  organizationId: string;
  departmentId?: string;
  code: string;
  name: string;
  description?: string;
  trade?: string;
}

export interface CreateSkillDto {
  organizationId: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
}

export interface AssignWorkerSkillDto {
  workerId: string;
  skillId: string;
  proficiencyLevel?: ProficiencyLevel;
  verified?: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

export interface CreateWorkerCertificationDto {
  workerId: string;
  name: string;
  certificationType: string;
  certificateNumber?: string;
  issuedBy?: string;
  issueDate: string;
  expiryDate?: string;
  documentId?: string;
}

export interface CreateShiftTemplateDto {
  organizationId: string;
  communityId?: string;
  code: string;
  name: string;
  startLocalTime: string; // "06:00"
  endLocalTime: string; // "14:00"
  breakMinutes?: number;
  crossesMidnight?: boolean;
}

export interface GenerateShiftInstancesDto {
  communityId: string;
  shiftTemplateId: string;
  startDate: string;
  endDate: string;
  locationReference?: string;
  requiredHeadcount?: number;
}

export interface CreateRosterDto {
  organizationId: string;
  communityId: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  departmentId?: string;
}

export interface AssignShiftDto {
  shiftInstanceId: string;
  workerId: string;
  assignmentRole?: string;
  replacementForAssignmentId?: string;
}

export interface ShiftSwapRequestDto {
  requesterAssignmentId: string;
  targetAssignmentId: string;
  reason?: string;
}

export interface RecordAttendanceDto {
  organizationId: string;
  communityId: string;
  workerId: string;
  shiftAssignmentId?: string;
  method?: AttendanceMethod;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  sourceDeviceId?: string;
  rawEventNonce?: string;
}

export interface AttendanceCorrectionRequestDto {
  attendanceSessionId: string;
  requestedCheckInAt?: string;
  requestedCheckOutAt?: string;
  reason: string;
  evidenceDocumentId?: string;
}

export interface DecideCorrectionDto {
  correctionId: string;
  approved: boolean;
  decisionNotes?: string;
}

export interface CreateLeaveRequestDto {
  workerId: string;
  communityId?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface DecideLeaveRequestDto {
  leaveRequestId: string;
  approved: boolean;
  decisionNotes?: string;
}

export interface CreateOvertimeRecordDto {
  workerId: string;
  shiftInstanceId?: string;
  date: string;
  requestedMinutes: number;
  reason: string;
}

export interface CreateDeploymentDto {
  organizationId: string;
  communityId: string;
  workerId: string;
  targetType: string; // GATE, FACILITY, AMENITY, BUILDING, PROJECT
  targetId?: string;
  locationName: string;
  roleName?: string;
  validFrom: string;
  validUntil?: string;
}

export interface CreateTimesheetEntryDto {
  workerId: string;
  date: string;
  sourceType: string; // WORK_ORDER, PROJECT, AMENITY, SECURITY, FACILITY
  sourceReferenceId?: string;
  durationMinutes: number;
  activityDescription: string;
}

export interface CreateWorkforceTaskDto {
  organizationId: string;
  communityId: string;
  title: string;
  description?: string;
  assignedWorkerId?: string;
  locationReference?: string;
  dueAt?: string;
  priority?: string;
  checklist?: Array<{ label: string; done: boolean }>;
}
