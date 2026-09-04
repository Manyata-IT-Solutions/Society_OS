import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { ApprovalPolicyRepository } from './approval-policy.repository.js';
import { ApprovalInstanceRepository } from './approval-instance.repository.js';
import { ApprovalService } from './approval.service.js';
import { ApprovalsController } from './approvals.controller.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuthModule, AuthorizationModule],
  controllers: [ApprovalsController],
  providers: [ApprovalPolicyRepository, ApprovalInstanceRepository, ApprovalService],
  exports: [ApprovalPolicyRepository, ApprovalInstanceRepository, ApprovalService],
})
export class ApprovalModule {}
