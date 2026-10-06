import {
  CommitteeType,
  MeetingType,
  VenueType,
  AgendaItemType,
  GovernanceParticipantType,
  GovernanceAttendanceStatus,
  VoteType,
  VotingMethod,
  GovernanceNoticeType,
  PolicyCategory,
} from '@community-os/types';

export interface CreateCommitteeDto {
  organizationId: string;
  communityId: string;
  code: string;
  name: string;
  description?: string;
  committeeType?: CommitteeType;
  effectiveFrom?: string;
}

export interface CreateCommitteeTermDto {
  committeeId: string;
  termNumber: string;
  startDate: string;
  endDate: string;
  electionReference?: string;
  notes?: string;
}

export interface CreateCommitteePositionDto {
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  isExecutive?: boolean;
}

export interface AssignCommitteeMemberDto {
  committeeTermId: string;
  positionId: string;
  personReferenceType: string; // RESIDENT, USER, EXTERNAL
  residentId?: string;
  userId?: string;
  externalPersonName?: string;
  startDate: string;
  endDate?: string;
  appointmentMethod?: string;
  appointmentReference?: string;
}

export interface CreateMeetingDto {
  organizationId: string;
  communityId: string;
  meetingType: MeetingType;
  committeeId?: string;
  committeeTermId?: string;
  title: string;
  description?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  timezone?: string;
  venueType?: VenueType;
  venueReference?: string;
  onlineMeetingUrl?: string;
  amenityBookingReferenceId?: string;
}

export interface PublishMeetingNoticeDto {
  meetingId: string;
  minimumNoticeDays?: number;
  instructions?: string;
  attachmentDocumentIds?: string[];
}

export interface CreateMeetingAgendaDto {
  meetingId: string;
  title?: string;
  items: Array<{
    itemNumber: string;
    title: string;
    description?: string;
    itemType: AgendaItemType;
    presenter?: string;
    estimatedDurationMinutes?: number;
    decisionRequired?: boolean;
    votingExpected?: boolean;
    linkedSourceType?: string;
    linkedSourceId?: string;
    displayOrder?: number;
  }>;
}

export interface RecordMeetingAttendanceDto {
  meetingId: string;
  participantType: GovernanceParticipantType;
  residentId?: string;
  userId?: string;
  committeeMembershipId?: string;
  proxyReferenceId?: string;
  attendanceStatus?: GovernanceAttendanceStatus;
}

export interface EvaluateQuorumDto {
  meetingId: string;
  requiredPercentage?: number;
  requiredHeadcount?: number;
}

export interface CreateProxyAuthorizationDto {
  organizationId: string;
  communityId: string;
  meetingId: string;
  principalResidentId: string;
  proxyResidentId: string;
  validityDate: string;
  scope?: string;
  supportingDocumentId?: string;
}

export interface ProposeMotionDto {
  meetingId: string;
  agendaItemId?: string;
  title: string;
  text: string;
  proposedByMemberId: string;
  secondedByMemberId?: string;
  voteRequired?: boolean;
}

export interface AmendMotionDto {
  motionId: string;
  proposedChange: string;
  newMotionText: string;
  proposedByMemberId: string;
}

export interface CreateVoteDto {
  meetingId: string;
  motionId?: string;
  title: string;
  description?: string;
  voteType?: VoteType;
  votingMethod?: VotingMethod;
  thresholdType?: string; // SIMPLE_MAJORITY, SUPERMAJORITY, ABSOLUTE_MAJORITY
  thresholdPercentage?: number;
  opensAt?: string;
  closesAt?: string;
  options?: string[]; // Defaults to ['YES', 'NO', 'ABSTAIN']
}

export interface CastVoteBallotDto {
  voteId: string;
  entitlementId: string;
  selectedOption: string; // 'YES', 'NO', 'ABSTAIN'
  signatureHash?: string;
}

export interface CreateGovernancePollDto {
  organizationId: string;
  communityId: string;
  title: string;
  description?: string;
  pollType?: string; // SINGLE_CHOICE, MULTIPLE_CHOICE, YES_NO
  targetAudienceType?: string; // ALL_RESIDENTS, OWNERS_ONLY, TENANTS_ONLY, COMMITTEE_ONLY
  opensAt?: string;
  closesAt?: string;
  options: string[];
}

export interface RespondGovernancePollDto {
  pollId: string;
  residentId: string;
  selectedOptions: string[];
}

export interface AdoptResolutionDto {
  communityId: string;
  meetingId: string;
  agendaItemId?: string;
  motionId?: string;
  voteId?: string;
  title: string;
  resolutionText: string;
  classification?: string;
  effectiveDate?: string;
  linkedDomainType?: string; // CAPEX_PROJECT, BUDGET, POLICY, AMENITY, VENDOR
  linkedDomainId?: string;
}

export interface GenerateMinutesDraftDto {
  meetingId: string;
  summary?: string;
  preparedByUserId?: string;
}

export interface ApproveMinutesDto {
  minutesId: string;
  approvedByUserId: string;
  publicationAudience?: string;
}

export interface CreateGovernanceActionItemDto {
  organizationId: string;
  communityId: string;
  meetingId?: string;
  resolutionId?: string;
  title: string;
  description?: string;
  ownerType: string; // USER, WORKER, TEAM
  ownerUserId?: string;
  ownerWorkerId?: string;
  dueDate: string;
  priority?: string;
  linkedDomainType?: string;
  linkedDomainId?: string;
}

export interface CreateGovernanceNoticeDto {
  organizationId: string;
  communityId: string;
  noticeType?: GovernanceNoticeType;
  title: string;
  summary?: string;
  body: string;
  audienceType?: string; // ALL, BUILDING, TOWER, FLOOR, OWNERS, TENANTS
  audienceTargetId?: string;
  priority?: string; // NORMAL, HIGH, URGENT, EMERGENCY
  publishAt?: string;
  expiresAt?: string;
  requiresAcknowledgement?: boolean;
}

export interface AcknowledgeNoticeDto {
  noticeId: string;
  residentId: string;
  method?: string; // IN_APP, DIGITAL_SIGNATURE
}

export interface CreateGovernancePolicyDto {
  organizationId: string;
  communityId: string;
  title: string;
  category: PolicyCategory;
  description?: string;
  content: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  resolutionId?: string;
  requiresResidentAcknowledgement?: boolean;
}

export interface RevisePolicyDto {
  policyId: string;
  content: string;
  effectiveFrom: string;
  changeSummary?: string;
  resolutionId?: string;
}

export interface AcknowledgePolicyDto {
  policyVersionId: string;
  residentId: string;
}
