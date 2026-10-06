export type CommitteeType =
  | 'MANAGING'
  | 'EXECUTIVE'
  | 'FINANCE'
  | 'SECURITY'
  | 'MAINTENANCE'
  | 'CULTURAL'
  | 'ELECTION'
  | 'PROJECT'
  | 'GRIEVANCE'
  | 'AD_HOC'
  | 'OTHER';

export type CommitteeStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'DISSOLVED' | 'ARCHIVED';

export type TermStatus =
  'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'EXTENDED' | 'TERMINATED' | 'CANCELLED';

export type CommitteeMembershipStatus =
  'NOMINATED' | 'ACTIVE' | 'SUSPENDED' | 'RESIGNED' | 'REMOVED' | 'TERM_COMPLETED' | 'CANCELLED';

export type MeetingType =
  | 'COMMITTEE'
  | 'BOARD'
  | 'MANAGEMENT'
  | 'GENERAL_BODY'
  | 'AGM'
  | 'EGM'
  | 'SPECIAL_GENERAL'
  | 'SUBCOMMITTEE'
  | 'PROJECT'
  | 'FINANCE'
  | 'EMERGENCY'
  | 'OTHER';

export type MeetingStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'NOTICE_PUBLISHED'
  | 'AGENDA_PUBLISHED'
  | 'IN_PROGRESS'
  | 'ADJOURNED'
  | 'COMPLETED'
  | 'MINUTES_DRAFTED'
  | 'MINUTES_UNDER_APPROVAL'
  | 'MINUTES_APPROVED'
  | 'CLOSED'
  | 'CANCELLED';

export type VenueType = 'PHYSICAL' | 'ONLINE' | 'HYBRID';

export type AgendaStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'SUPERSEDED';

export type AgendaItemType =
  | 'INFORMATION'
  | 'DISCUSSION'
  | 'DECISION'
  | 'MOTION'
  | 'FINANCIAL'
  | 'BUDGET'
  | 'PROJECT'
  | 'POLICY'
  | 'ELECTION'
  | 'COMPLIANCE'
  | 'OTHER';

export type GovernanceParticipantType =
  | 'COMMITTEE_MEMBER'
  | 'RESIDENT'
  | 'OWNER'
  | 'AUTHORIZED_REPRESENTATIVE'
  | 'PROXY'
  | 'MANAGEMENT'
  | 'STAFF'
  | 'INVITEE'
  | 'EXTERNAL_ADVISOR'
  | 'OTHER';

export type GovernanceAttendanceStatus =
  | 'EXPECTED'
  | 'PRESENT'
  | 'ABSENT'
  | 'EXCUSED'
  | 'LATE'
  | 'LEFT_EARLY'
  | 'REMOTE_PRESENT'
  | 'INVALIDATED';

export type QuorumStatus =
  'NOT_EVALUATED' | 'MET' | 'NOT_MET' | 'LOST_DURING_MEETING' | 'WAIVED' | 'NOT_REQUIRED';

export type ProxyStatus =
  'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'REVOKED' | 'EXPIRED' | 'USED';

export type MotionStatus =
  | 'PROPOSED'
  | 'SECONDED'
  | 'UNDER_DISCUSSION'
  | 'AMENDED'
  | 'PUT_TO_VOTE'
  | 'PASSED'
  | 'FAILED'
  | 'WITHDRAWN'
  | 'DEFERRED'
  | 'INVALIDATED';

export type VoteType =
  'FORMAL_MOTION' | 'RESOLUTION_CANDIDATE' | 'ELECTION' | 'SPECIAL_RESOLUTION' | 'OTHER';

export type VotingMethod =
  | 'OPEN_BALLOT'
  | 'SECRET_BALLOT'
  | 'ROLL_CALL'
  | 'SHOW_OF_HANDS_RECORDED'
  | 'DIGITAL'
  | 'PAPER_RECORDED'
  | 'HYBRID';

export type VoteStatus =
  | 'DRAFT'
  | 'READY'
  | 'OPEN'
  | 'CLOSED'
  | 'COUNTED'
  | 'RESULT_PUBLISHED'
  | 'CANCELLED'
  | 'INVALIDATED';

export type VoteResultStatus = 'PASSED' | 'FAILED' | 'TIED' | 'NO_QUORUM' | 'INVALID' | 'CANCELLED';

export type ResolutionStatus =
  'DRAFT' | 'ADOPTED' | 'EFFECTIVE' | 'SUPERSEDED' | 'REVOKED' | 'EXPIRED' | 'INVALIDATED';

export type MinutesStatus =
  'DRAFT' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'PUBLISHED' | 'SUPERSEDED';

export type ActionItemStatus =
  'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED' | 'WAIVED';

export type GovernanceNoticeType =
  | 'GENERAL'
  | 'MAINTENANCE'
  | 'FINANCIAL'
  | 'SECURITY'
  | 'WATER'
  | 'ELECTRICITY'
  | 'EVENT'
  | 'MEETING'
  | 'AGM'
  | 'EGM'
  | 'EMERGENCY'
  | 'POLICY'
  | 'COMPLIANCE'
  | 'PROJECT'
  | 'OTHER';

export type GovernanceNoticeStatus =
  | 'DRAFT'
  | 'UNDER_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'EXPIRED'
  | 'WITHDRAWN'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export type AcknowledgementStatus =
  'NOT_REQUIRED' | 'PENDING' | 'ACKNOWLEDGED' | 'DECLINED' | 'EXPIRED';

export type PolicyCategory =
  | 'PARKING'
  | 'VISITOR'
  | 'AMENITY'
  | 'PET'
  | 'RENOVATION'
  | 'WASTE_MANAGEMENT'
  | 'SECURITY'
  | 'FINANCIAL'
  | 'MOVE_IN_OUT'
  | 'EMERGENCY'
  | 'DATA_PRIVACY'
  | 'OTHER';

export type PolicyStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'EFFECTIVE'
  | 'SUPERSEDED'
  | 'REVOKED'
  | 'EXPIRED';
