import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';

// Services
import { GovernanceSequenceService } from './governance-sequence.service.js';
import { CommitteeMasterService } from './committee-master.service.js';
import { GovernanceMeetingService } from './governance-meeting.service.js';
import { MeetingNoticeService } from './meeting-notice.service.js';
import { MeetingAgendaService } from './meeting-agenda.service.js';
import { GovernanceEligibilityService } from './governance-eligibility.service.js';
import { GovernanceQuorumService } from './governance-quorum.service.js';
import { GovernanceProxyService } from './governance-proxy.service.js';
import { GovernanceMotionService } from './governance-motion.service.js';
import { GovernanceVoteService } from './governance-vote.service.js';
import { VoteCountingService } from './vote-counting.service.js';
import { GovernancePollService } from './governance-poll.service.js';
import { GovernanceResolutionService } from './governance-resolution.service.js';
import { MeetingMinutesService } from './meeting-minutes.service.js';
import { GovernanceActionItemService } from './governance-action-item.service.js';
import { GovernanceNoticeService } from './governance-notice.service.js';
import { GovernanceAcknowledgementService } from './governance-acknowledgement.service.js';
import { GovernancePolicyService } from './governance-policy.service.js';
import { GovernanceIntegrityService } from './governance-integrity.service.js';
import { GovernanceDashboardService } from './governance-dashboard.service.js';

// Controllers
import { GovernanceCommitteesController } from './committees.controller.js';
import { GovernanceMeetingsController } from './meetings.controller.js';
import { GovernanceAgendasController } from './agendas.controller.js';
import { GovernanceAttendanceController } from './attendance.controller.js';
import { GovernanceMotionsController } from './motions.controller.js';
import { GovernanceVotesController } from './votes.controller.js';
import { GovernancePollsController } from './polls.controller.js';
import { GovernanceResolutionsController } from './resolutions.controller.js';
import { GovernanceMinutesController } from './minutes.controller.js';
import { GovernanceActionsController } from './actions.controller.js';
import { GovernanceNoticesController } from './notices.controller.js';
import { GovernancePoliciesController } from './policies.controller.js';
import { GovernanceDashboardController } from './dashboard.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    GovernanceCommitteesController,
    GovernanceMeetingsController,
    GovernanceAgendasController,
    GovernanceAttendanceController,
    GovernanceMotionsController,
    GovernanceVotesController,
    GovernancePollsController,
    GovernanceResolutionsController,
    GovernanceMinutesController,
    GovernanceActionsController,
    GovernanceNoticesController,
    GovernancePoliciesController,
    GovernanceDashboardController,
  ],
  providers: [
    GovernanceSequenceService,
    CommitteeMasterService,
    GovernanceMeetingService,
    MeetingNoticeService,
    MeetingAgendaService,
    GovernanceEligibilityService,
    GovernanceQuorumService,
    GovernanceProxyService,
    GovernanceMotionService,
    GovernanceVoteService,
    VoteCountingService,
    GovernancePollService,
    GovernanceResolutionService,
    MeetingMinutesService,
    GovernanceActionItemService,
    GovernanceNoticeService,
    GovernanceAcknowledgementService,
    GovernancePolicyService,
    GovernanceIntegrityService,
    GovernanceDashboardService,
  ],
  exports: [
    GovernanceSequenceService,
    CommitteeMasterService,
    GovernanceMeetingService,
    MeetingNoticeService,
    MeetingAgendaService,
    GovernanceEligibilityService,
    GovernanceQuorumService,
    GovernanceProxyService,
    GovernanceMotionService,
    GovernanceVoteService,
    VoteCountingService,
    GovernancePollService,
    GovernanceResolutionService,
    MeetingMinutesService,
    GovernanceActionItemService,
    GovernanceNoticeService,
    GovernanceAcknowledgementService,
    GovernancePolicyService,
    GovernanceIntegrityService,
    GovernanceDashboardService,
  ],
})
export class GovernanceModule {}
