import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';

import { WorkforceSequenceService } from './workforce-sequence.service.js';
import { WorkerMasterService } from './worker-master.service.js';
import { WorkerEngagementService } from './worker-engagement.service.js';
import { WorkforceStructureService } from './workforce-structure.service.js';
import { WorkforceShiftService } from './workforce-shift.service.js';
import { WorkforceRosterService } from './workforce-roster.service.js';
import { WorkforceCoverageEngine } from './workforce-coverage.engine.js';
import { WorkforceAttendanceService } from './workforce-attendance.service.js';
import { AttendanceCorrectionService } from './attendance-correction.service.js';
import { WorkforceLeaveOvertimeService } from './workforce-leave-overtime.service.js';
import { WorkforceDeploymentService } from './workforce-deployment.service.js';
import { WorkforceCapabilityResolver } from './workforce-capability.resolver.js';
import { WorkforceTimesheetService } from './workforce-timesheet.service.js';
import { WorkforceTaskService } from './workforce-task.service.js';
import { WorkforceIntegrityService } from './workforce-integrity.service.js';
import { WorkforceDashboardService } from './workforce-dashboard.service.js';

import { WorkersController } from './workers.controller.js';
import { EngagementsController } from './engagements.controller.js';
import { StructureController } from './structure.controller.js';
import { ShiftsController } from './shifts.controller.js';
import { RostersController } from './rosters.controller.js';
import { AttendanceController } from './attendance.controller.js';
import { CorrectionsController } from './corrections.controller.js';
import { LeaveOvertimeController } from './leave-overtime.controller.js';
import { DeploymentsController } from './deployments.controller.js';
import { TechniciansController } from './technicians.controller.js';
import { TimesheetsController } from './timesheets.controller.js';
import { TasksController } from './tasks.controller.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    WorkersController,
    EngagementsController,
    StructureController,
    ShiftsController,
    RostersController,
    AttendanceController,
    CorrectionsController,
    LeaveOvertimeController,
    DeploymentsController,
    TechniciansController,
    TimesheetsController,
    TasksController,
    DashboardController,
  ],
  providers: [
    WorkforceSequenceService,
    WorkerMasterService,
    WorkerEngagementService,
    WorkforceStructureService,
    WorkforceShiftService,
    WorkforceRosterService,
    WorkforceCoverageEngine,
    WorkforceAttendanceService,
    AttendanceCorrectionService,
    WorkforceLeaveOvertimeService,
    WorkforceDeploymentService,
    WorkforceCapabilityResolver,
    WorkforceTimesheetService,
    WorkforceTaskService,
    WorkforceIntegrityService,
    WorkforceDashboardService,
  ],
  exports: [
    WorkerMasterService,
    WorkerEngagementService,
    WorkforceStructureService,
    WorkforceShiftService,
    WorkforceRosterService,
    WorkforceCoverageEngine,
    WorkforceAttendanceService,
    AttendanceCorrectionService,
    WorkforceLeaveOvertimeService,
    WorkforceDeploymentService,
    WorkforceCapabilityResolver,
    WorkforceTimesheetService,
    WorkforceTaskService,
    WorkforceIntegrityService,
    WorkforceDashboardService,
  ],
})
export class WorkforceModule {}
