import type {
  EntityStatus,
  UserStatus,
  MembershipStatus,
  ScopeType,
  AssignmentStatus,
  BuildingType,
  BuildingStatus,
  UnitType,
  UnitStatus,
  AreaUnit,
  ResidentStatus,
  HouseholdStatus,
  HouseholdRelationshipType,
  OwnershipType,
  TenancyStatus,
  OccupancyType,
} from '@community-os/types';

export const DOMAIN_EVENT_NAMES = {
  // Phase 13: Finance & General Ledger Events
  FINANCE_ENTITY_CREATED: 'finance.entity.created.v1',
  FINANCE_ACCOUNT_CREATED: 'finance.account.created.v1',
  FINANCE_ACCOUNT_UPDATED: 'finance.account.updated.v1',
  FINANCE_ACCOUNT_ARCHIVED: 'finance.account.archived.v1',
  FINANCE_FISCAL_YEAR_OPENED: 'finance.fiscal_year.opened.v1',
  FINANCE_PERIOD_SOFT_CLOSED: 'finance.period.soft_closed.v1',
  FINANCE_PERIOD_HARD_CLOSED: 'finance.period.hard_closed.v1',
  FINANCE_PERIOD_REOPENED: 'finance.period.reopened.v1',
  FINANCE_JOURNAL_CREATED: 'finance.journal.created.v1',
  FINANCE_JOURNAL_SUBMITTED: 'finance.journal.submitted.v1',
  FINANCE_JOURNAL_APPROVED: 'finance.journal.approved.v1',
  FINANCE_JOURNAL_POSTED: 'finance.journal.posted.v1',
  FINANCE_JOURNAL_REVERSED: 'finance.journal.reversed.v1',
  FINANCE_OPENING_BALANCE_POSTED: 'finance.opening_balance.posted.v1',
  FINANCE_FUND_CREATED: 'finance.fund.created.v1',
  FINANCE_COST_CENTER_CREATED: 'finance.cost_center.created.v1',
  FINANCE_INTEGRITY_ISSUE_DETECTED: 'finance.integrity_issue.detected.v1',
  FINANCE_PROJECTION_REBUILT: 'finance.projection.rebuilt.v1',

  ORGANIZATION_CREATED: 'organization.created.v1',
  ORGANIZATION_UPDATED: 'organization.updated.v1',
  ORGANIZATION_STATUS_CHANGED: 'organization.status_changed.v1',
  COMMUNITY_CREATED: 'community.created.v1',
  COMMUNITY_UPDATED: 'community.updated.v1',
  COMMUNITY_STATUS_CHANGED: 'community.status_changed.v1',

  // Property Events (Phase 3)
  PORTFOLIO_CREATED: 'portfolio.created.v1',
  PORTFOLIO_UPDATED: 'portfolio.updated.v1',
  PROPERTY_SECTION_CREATED: 'community.section_created.v1',
  BUILDING_CREATED: 'building.created.v1',
  BUILDING_UPDATED: 'building.updated.v1',
  FLOOR_CREATED: 'floor.created.v1',
  UNIT_CREATED: 'unit.created.v1',
  UNIT_UPDATED: 'unit.updated.v1',
  UNIT_STATUS_CHANGED: 'unit.status_changed.v1',
  PROPERTY_IMPORT_COMPLETED: 'property.import_completed.v1',

  // Household & Resident Events (Phase 4)
  RESIDENT_CREATED: 'resident.created.v1',
  RESIDENT_UPDATED: 'resident.updated.v1',
  RESIDENT_USER_LINKED: 'resident.user_linked.v1',
  RESIDENT_INVITED: 'resident.invited.v1',
  HOUSEHOLD_CREATED: 'household.created.v1',
  HOUSEHOLD_MEMBER_ADDED: 'household.member_added.v1',
  HOUSEHOLD_MEMBER_REMOVED: 'household.member_removed.v1',
  OWNERSHIP_STARTED: 'ownership.started.v1',
  OWNERSHIP_ENDED: 'ownership.ended.v1',
  OWNERSHIP_TRANSFERRED: 'ownership.transferred.v1',
  TENANCY_CREATED: 'tenancy.created.v1',
  TENANCY_ACTIVATED: 'tenancy.activated.v1',
  TENANCY_ENDED: 'tenancy.ended.v1',
  OCCUPANCY_STARTED: 'occupancy.started.v1',
  OCCUPANCY_ENDED: 'occupancy.ended.v1',
  UNIT_MOVE_IN_COMPLETED: 'unit.move_in_completed.v1',
  UNIT_MOVE_OUT_COMPLETED: 'unit.move_out_completed.v1',

  // IAM Events
  USER_CREATED: 'user.created.v1',
  USER_UPDATED: 'user.updated.v1',
  USER_STATUS_CHANGED: 'user.status_changed.v1',
  SESSION_CREATED: 'session.created.v1',
  SESSION_REVOKED: 'session.revoked.v1',
  MEMBERSHIP_CREATED: 'membership.created.v1',
  MEMBERSHIP_STATUS_CHANGED: 'membership.status_changed.v1',
  ROLE_CREATED: 'role.created.v1',
  ROLE_UPDATED: 'role.updated.v1',
  ROLE_ASSIGNMENT_CREATED: 'role_assignment.created.v1',
  ROLE_ASSIGNMENT_REVOKED: 'role_assignment.revoked.v1',

  // Audit Events (Phase 5)
  AUDIT_RECORDED: 'audit.recorded.v1',

  // Notification Events (Phase 5)
  NOTIFICATION_CREATED: 'notification.created.v1',
  NOTIFICATION_QUEUED: 'notification.queued.v1',
  NOTIFICATION_SENT: 'notification.sent.v1',
  NOTIFICATION_DELIVERED: 'notification.delivered.v1',
  NOTIFICATION_DELIVERY_FAILED: 'notification.delivery_failed.v1',
  NOTIFICATION_READ: 'notification.read.v1',

  // Document Events (Phase 5)
  DOCUMENT_CREATED: 'document.created.v1',
  DOCUMENT_VERSION_UPLOADED: 'document.version_uploaded.v1',
  DOCUMENT_ACTIVATED: 'document.activated.v1',
  DOCUMENT_ARCHIVED: 'document.archived.v1',
  DOCUMENT_LINKED: 'document.linked.v1',
  DOCUMENT_UNLINKED: 'document.unlinked.v1',
  DOCUMENT_QUARANTINED: 'document.quarantined.v1',

  // Configuration & Extensibility Events (Phase 6)
  CONFIGURATION_OVERRIDE_CREATED: 'configuration.override_created.v1',
  CONFIGURATION_OVERRIDE_UPDATED: 'configuration.override_updated.v1',
  CONFIGURATION_OVERRIDE_REMOVED: 'configuration.override_removed.v1',
  FEATURE_OVERRIDE_CHANGED: 'feature.override_changed.v1',
  CUSTOM_FIELD_CREATED: 'custom_field.created.v1',
  CUSTOM_FIELD_UPDATED: 'custom_field.updated.v1',
  CUSTOM_FIELD_ARCHIVED: 'custom_field.archived.v1',
  CUSTOM_FIELD_VALUE_UPDATED: 'custom_field.value_updated.v1',
  DISPLAY_SETTING_CHANGED: 'display_setting.changed.v1',

  // Workflow, Rules, Approval, SLA Events (Phase 7)
  WORKFLOW_DEFINITION_PUBLISHED: 'workflow.definition.published.v1',
  WORKFLOW_STARTED: 'workflow.started.v1',
  WORKFLOW_TRANSITIONED: 'workflow.transitioned.v1',
  WORKFLOW_COMPLETED: 'workflow.completed.v1',
  WORKFLOW_CANCELLED: 'workflow.cancelled.v1',
  WORKFLOW_OVERRIDDEN: 'workflow.overridden.v1',

  RULE_PUBLISHED: 'rule.published.v1',

  APPROVAL_POLICY_PUBLISHED: 'approval.policy.published.v1',
  APPROVAL_STARTED: 'approval.started.v1',
  APPROVAL_STEP_OPENED: 'approval.step_opened.v1',
  APPROVAL_DECISION_RECORDED: 'approval.decision_recorded.v1',
  APPROVAL_STEP_COMPLETED: 'approval.step_completed.v1',
  APPROVAL_APPROVED: 'approval.approved.v1',
  APPROVAL_REJECTED: 'approval.rejected.v1',

  SLA_STARTED: 'sla.started.v1',
  SLA_WARNING: 'sla.warning.v1',
  SLA_PAUSED: 'sla.paused.v1',
  SLA_RESUMED: 'sla.resumed.v1',
  SLA_COMPLETED: 'sla.completed.v1',
  SLA_BREACHED: 'sla.breached.v1',

  // Helpdesk & Complaint Events (Phase 8)
  TICKET_CREATED: 'ticket.created.v1',
  TICKET_ASSIGNED: 'ticket.assigned.v1',
  TICKET_CLAIMED: 'ticket.claimed.v1',
  TICKET_TRANSITIONED: 'ticket.transitioned.v1',
  TICKET_PRIORITY_CHANGED: 'ticket.priority_changed.v1',
  TICKET_RESOLVED: 'ticket.resolved.v1',
  TICKET_CLOSED: 'ticket.closed.v1',
  TICKET_REOPENED: 'ticket.reopened.v1',
  TICKET_CANCELLED: 'ticket.cancelled.v1',
  TICKET_COMMENT_ADDED: 'ticket.comment_added.v1',
  TICKET_INTERNAL_NOTE_ADDED: 'ticket.internal_note_added.v1',
  TICKET_FEEDBACK_SUBMITTED: 'ticket.feedback_submitted.v1',

  // Facility Management & Work Orders (Phase 9)
  WORK_ORDER_CREATED: 'work_order.created.v1',
  WORK_ORDER_GENERATED: 'work_order.generated.v1',
  WORK_ORDER_LINKED_TO_TICKET: 'work_order.linked_to_ticket.v1',
  WORK_ORDER_ASSIGNED: 'work_order.assigned.v1',
  WORK_ORDER_REASSIGNED: 'work_order.reassigned.v1',
  WORK_ORDER_ACCEPTED: 'work_order.accepted.v1',
  WORK_ORDER_STARTED: 'work_order.started.v1',
  WORK_ORDER_PAUSED: 'work_order.paused.v1',
  WORK_ORDER_BLOCKED: 'work_order.blocked.v1',
  WORK_ORDER_RESUMED: 'work_order.resumed.v1',
  WORK_ORDER_TASK_COMPLETED: 'work_order.task_completed.v1',
  WORK_ORDER_CHECKLIST_SUBMITTED: 'work_order.checklist_submitted.v1',
  WORK_ORDER_EVIDENCE_ATTACHED: 'work_order.evidence_attached.v1',
  WORK_ORDER_WORK_COMPLETED: 'work_order.work_completed.v1',
  WORK_ORDER_REWORK_REQUESTED: 'work_order.rework_requested.v1',
  WORK_ORDER_COMPLETED: 'work_order.completed.v1',
  WORK_ORDER_CANCELLED: 'work_order.cancelled.v1',
  WORK_ORDER_OVERDUE: 'work_order.overdue.v1',
  MAINTENANCE_PLAN_CREATED: 'maintenance_plan.created.v1',
  MAINTENANCE_PLAN_ACTIVATED: 'maintenance_plan.activated.v1',
  MAINTENANCE_PLAN_PAUSED: 'maintenance_plan.paused.v1',
  MAINTENANCE_PLAN_WORK_ORDER_GENERATED: 'maintenance_plan.work_order_generated.v1',

  TICKET_SLA_BREACHED: 'ticket.sla_breached.v1',

  // Enterprise Asset Management (Phase 10)
  ASSET_CREATED: 'asset.created.v1',
  ASSET_UPDATED: 'asset.updated.v1',
  ASSET_LOCATION_CHANGED: 'asset.location_changed.v1',
  ASSET_COMMISSIONED: 'asset.commissioned.v1',
  ASSET_CONDITION_CHANGED: 'asset.condition_changed.v1',
  ASSET_OPERATIONAL_STATUS_CHANGED: 'asset.operational_status_changed.v1',
  ASSET_BREAKDOWN_REPORTED: 'asset.breakdown_reported.v1',
  ASSET_RESTORED: 'asset.restored.v1',
  ASSET_DECOMMISSIONED: 'asset.decommissioned.v1',
  ASSET_DISPOSED: 'asset.disposed.v1',
  ASSET_REPLACED: 'asset.replaced.v1',
  ASSET_WARRANTY_ADDED: 'asset.warranty_added.v1',
  ASSET_WARRANTY_EXPIRING: 'asset.warranty_expiring.v1',
  ASSET_WARRANTY_EXPIRED: 'asset.warranty_expired.v1',
  ASSET_CONTRACT_LINKED: 'asset.contract_linked.v1',
  ASSET_CONTRACT_EXPIRING: 'asset.contract_expiring.v1',
  ASSET_CONTRACT_EXPIRED: 'asset.contract_expired.v1',
  ASSET_METER_READING_RECORDED: 'asset.meter_reading_recorded.v1',
  ASSET_QR_REGENERATED: 'asset.qr_regenerated.v1',

  // Enterprise Inventory & Stores (Phase 11)
  INVENTORY_ITEM_CREATED: 'inventory.item.created.v1',
  INVENTORY_ITEM_UPDATED: 'inventory.item.updated.v1',
  INVENTORY_RECEIPT_POSTED: 'inventory.receipt.posted.v1',
  INVENTORY_RECEIPT_REVERSED: 'inventory.receipt.reversed.v1',
  INVENTORY_STOCK_ISSUED: 'inventory.stock.issued.v1',
  INVENTORY_STOCK_RETURNED: 'inventory.stock.returned.v1',
  INVENTORY_STOCK_TRANSFERRED: 'inventory.stock.transferred.v1',
  INVENTORY_STOCK_ADJUSTED: 'inventory.stock.adjusted.v1',
  INVENTORY_STOCK_REVERSED: 'inventory.stock.reversed.v1',
  INVENTORY_RESERVATION_CREATED: 'inventory.reservation.created.v1',
  INVENTORY_RESERVATION_RELEASED: 'inventory.reservation.released.v1',
  INVENTORY_MATERIAL_CONSUMED: 'inventory.material.consumed.v1',
  INVENTORY_LOW_STOCK: 'inventory.low_stock.v1',
  INVENTORY_OUT_OF_STOCK: 'inventory.out_of_stock.v1',
  INVENTORY_STOCK_RECOVERED: 'inventory.stock.recovered.v1',
  INVENTORY_BATCH_EXPIRING: 'inventory.batch_expiring.v1',
  INVENTORY_BATCH_EXPIRED: 'inventory.batch_expired.v1',
  INVENTORY_STOCK_COUNT_POSTED: 'inventory.stock_count.posted.v1',
  WORK_ORDER_MATERIAL_REQUESTED: 'work_order.material.requested.v1',
  WORK_ORDER_MATERIAL_ISSUED: 'work_order.material.issued.v1',
  WORK_ORDER_MATERIAL_CONSUMED: 'work_order.material.consumed.v1',
  WORK_ORDER_MATERIAL_RETURNED: 'work_order.material.returned.v1',

  // ==========================================
  // Phase 14: Resident Maintenance Billing & AR
  // ==========================================
  BILLING_RUN_STARTED: 'billing.run.started.v1',
  BILLING_RUN_COMPLETED: 'billing.run.completed.v1',
  BILLING_INVOICE_GENERATED: 'billing.invoice.generated.v1',
  BILLING_INVOICE_ISSUED: 'billing.invoice.issued.v1',
  BILLING_INVOICE_CANCELLED: 'billing.invoice.cancelled.v1',
  BILLING_PAYMENT_RECEIVED: 'billing.payment.received.v1',
  BILLING_PAYMENT_REVERSED: 'billing.payment.reversed.v1',
  BILLING_RECEIPT_GENERATED: 'billing.receipt.generated.v1',
  BILLING_PAYMENT_ALLOCATED: 'billing.payment.allocated.v1',
  BILLING_WAIVER_REQUESTED: 'billing.waiver.requested.v1',
  BILLING_WAIVER_APPROVED: 'billing.waiver.approved.v1',
  BILLING_CREDITNOTE_ISSUED: 'billing.creditnote.issued.v1',
  BILLING_PENALTY_GENERATED: 'billing.penalty.generated.v1',
  BILLING_INTEREST_GENERATED: 'billing.interest.generated.v1',
  BILLING_INVOICE_OVERDUE: 'billing.invoice.overdue.v1',
  BILLING_COLLECTION_UPDATED: 'billing.collection.updated.v1',
  BILLING_AGING_UPDATED: 'billing.aging.updated.v1',
  BILLING_OPENING_BALANCE_IMPORTED: 'billing.opening_balance.imported.v1',

  // ==========================================
  // Phase 15: Accounts Payable & Treasury
  // ==========================================
  AP_SUPPLIER_INVOICE_CREATED: 'ap.supplier_invoice.created.v1',
  AP_SUPPLIER_INVOICE_SUBMITTED: 'ap.supplier_invoice.submitted.v1',
  AP_INVOICE_MATCHED: 'ap.invoice.matched.v1',
  AP_INVOICE_MATCH_EXCEPTION: 'ap.invoice.match_exception.v1',
  AP_INVOICE_APPROVED: 'ap.invoice.approved.v1',
  AP_INVOICE_POSTED: 'ap.invoice.posted.v1',
  AP_INVOICE_HELD: 'ap.invoice.held.v1',
  AP_INVOICE_RELEASED: 'ap.invoice.released.v1',
  AP_INVOICE_REVERSED: 'ap.invoice.reversed.v1',
  AP_CREDIT_NOTE_POSTED: 'ap.credit_note.posted.v1',
  AP_PAYMENT_PROPOSAL_CREATED: 'ap.payment_proposal.created.v1',
  AP_PAYMENT_RUN_APPROVED: 'ap.payment_run.approved.v1',
  AP_VENDOR_PAYMENT_CREATED: 'ap.vendor_payment.created.v1',
  AP_VENDOR_PAYMENT_SUCCEEDED: 'ap.vendor_payment.succeeded.v1',
  AP_VENDOR_PAYMENT_FAILED: 'ap.vendor_payment.failed.v1',
  AP_VENDOR_PAYMENT_REVERSED: 'ap.vendor_payment.reversed.v1',
  AP_VENDOR_ADVANCE_CREATED: 'ap.vendor_advance.created.v1',
  AP_VENDOR_ADVANCE_ALLOCATED: 'ap.vendor_advance.allocated.v1',
  TREASURY_BANK_STATEMENT_IMPORTED: 'treasury.bank_statement.imported.v1',
  TREASURY_BANK_TRANSACTION_MATCHED: 'treasury.bank_transaction.matched.v1',
  TREASURY_RECONCILIATION_COMPLETED: 'treasury.reconciliation.completed.v1',
  TREASURY_RECONCILIATION_REOPENED: 'treasury.reconciliation.reopened.v1',
  // ==========================================
  // Phase 16: Enterprise Budgeting & Planning
  // ==========================================
  BUDGET_CREATED: 'budget.created.v1',
  BUDGET_SUBMITTED: 'budget.submitted.v1',
  BUDGET_APPROVED: 'budget.approved.v1',
  BUDGET_ACTIVATED: 'budget.activated.v1',
  BUDGET_CLOSED: 'budget.closed.v1',
  BUDGET_AMENDED: 'budget.amended.v1',
  BUDGET_TRANSFER_APPROVED: 'budget.transfer_approved.v1',
  BUDGET_RESERVATION_CREATED: 'budget.reservation_created.v1',
  BUDGET_RESERVATION_RELEASED: 'budget.reservation_released.v1',
  BUDGET_COMMITMENT_CREATED: 'budget.commitment_created.v1',
  BUDGET_COMMITMENT_ADJUSTED: 'budget.commitment_adjusted.v1',
  BUDGET_COMMITMENT_CONSUMED: 'budget.commitment_consumed.v1',
  BUDGET_THRESHOLD_CROSSED: 'budget.threshold_crossed.v1',
  BUDGET_CONTROL_BLOCKED: 'budget.control_blocked.v1',
  BUDGET_OVERRIDE_APPROVED: 'budget.override_approved.v1',
  BUDGET_MATERIAL_VARIANCE_DETECTED: 'budget.material_variance_detected.v1',
  BUDGET_FORECAST_CREATED: 'budget.forecast_created.v1',
  BUDGET_FORECAST_APPROVED: 'budget.forecast_approved.v1',
  BUDGET_CAPEX_APPROVED: 'budget.capex_approved.v1',
  BUDGET_FUND_DEFICIT_PROJECTED: 'budget.fund_deficit_projected.v1',
  // ==========================================
  // Phase 17: Enterprise Projects & CAPEX Execution
  // ==========================================
  PROJECT_CREATED: 'project.created.v1',
  PROJECT_APPROVED: 'project.approved.v1',
  PROJECT_STARTED: 'project.started.v1',
  PROJECT_PROGRESS_UPDATED: 'project.progress_updated.v1',
  PROJECT_MILESTONE_COMPLETED: 'project.milestone.completed.v1',
  PROJECT_MILESTONE_DELAYED: 'project.milestone.delayed.v1',
  PROJECT_BOQ_APPROVED: 'project.boq.approved.v1',
  PROJECT_MEASUREMENT_SUBMITTED: 'project.measurement.submitted.v1',
  PROJECT_MEASUREMENT_VERIFIED: 'project.measurement.verified.v1',
  PROJECT_CERTIFICATE_APPROVED: 'project.certificate.approved.v1',
  PROJECT_VARIATION_SUBMITTED: 'project.variation.submitted.v1',
  PROJECT_VARIATION_APPROVED: 'project.variation.approved.v1',
  PROJECT_BUDGET_RISK_DETECTED: 'project.budget_risk_detected.v1',
  PROJECT_SNAG_CREATED: 'project.snag.created.v1',
  PROJECT_SNAG_CLOSED: 'project.snag.closed.v1',
  PROJECT_HANDOVER_STARTED: 'project.handover.started.v1',
  PROJECT_HANDOVER_COMPLETED: 'project.handover.completed.v1',
  PROJECT_ASSET_HANDOVER_COMPLETED: 'project.asset_handover.completed.v1',
  PROJECT_COMPLETED: 'project.completed.v1',
  PROJECT_CLOSED: 'project.closed.v1',
  // ==========================================
  // Phase 18: Enterprise Security, Gate & Visitor Management
  // ==========================================
  SECURITY_VISIT_INVITED: 'security.visit.invited.v1',
  SECURITY_VISIT_ARRIVED: 'security.visit.arrived.v1',
  SECURITY_VISIT_APPROVAL_REQUESTED: 'security.visit.approval_requested.v1',
  SECURITY_VISIT_APPROVED: 'security.visit.approved.v1',
  SECURITY_VISIT_DENIED: 'security.visit.denied.v1',
  SECURITY_VISIT_CHECKED_IN: 'security.visit.checked_in.v1',
  SECURITY_VISIT_CHECKED_OUT: 'security.visit.checked_out.v1',
  SECURITY_VISIT_OVERSTAY_DETECTED: 'security.visit.overstay_detected.v1',
  SECURITY_PASS_ISSUED: 'security.pass.issued.v1',
  SECURITY_PASS_REVOKED: 'security.pass.revoked.v1',
  SECURITY_DELIVERY_ARRIVED: 'security.delivery.arrived.v1',
  SECURITY_CONTRACTOR_CHECKED_IN: 'security.contractor.checked_in.v1',
  SECURITY_CONTRACTOR_CHECKED_OUT: 'security.contractor.checked_out.v1',
  SECURITY_VEHICLE_ENTERED: 'security.vehicle.entered.v1',
  SECURITY_VEHICLE_EXITED: 'security.vehicle.exited.v1',
  SECURITY_WATCHLIST_MATCHED: 'security.watchlist.matched.v1',
  SECURITY_OVERRIDE_PERFORMED: 'security.override.performed.v1',
  SECURITY_SHIFT_HANDOVER_COMPLETED: 'security.shift.handover_completed.v1',
  // Phase 19: Parking & Vehicle Management
  PARKING_VEHICLE_REGISTERED: 'parking.vehicle.registered.v1',
  PARKING_VEHICLE_VERIFIED: 'parking.vehicle.verified.v1',
  PARKING_VEHICLE_SUSPENDED: 'parking.vehicle.suspended.v1',
  PARKING_RIGHT_CREATED: 'parking.right.created.v1',
  PARKING_ALLOCATION_CREATED: 'parking.allocation.created.v1',
  PARKING_ALLOCATION_ENDED: 'parking.allocation.ended.v1',
  PARKING_PERMIT_ISSUED: 'parking.permit.issued.v1',
  PARKING_PERMIT_REVOKED: 'parking.permit.revoked.v1',
  PARKING_VISITOR_SESSION_STARTED: 'parking.visitor_session.started.v1',
  PARKING_VISITOR_SESSION_ENDED: 'parking.visitor_session.ended.v1',
  PARKING_OCCUPANCY_STARTED: 'parking.occupancy.started.v1',
  PARKING_OCCUPANCY_ENDED: 'parking.occupancy.ended.v1',
  PARKING_SLOT_BLOCKED: 'parking.slot.blocked.v1',
  PARKING_VIOLATION_CREATED: 'parking.violation.created.v1',
  PARKING_VIOLATION_CONFIRMED: 'parking.violation.confirmed.v1',
  PARKING_VIOLATION_RESOLVED: 'parking.violation.resolved.v1',
  PARKING_PENALTY_APPROVED: 'parking.penalty.approved.v1',
  PARKING_EV_SESSION_COMPLETED: 'parking.ev_session.completed.v1',
  // ==========================================
  // Phase 21: Enterprise Staff & Workforce Management
  // ==========================================
  WORKFORCE_WORKER_CREATED: 'workforce.worker.created.v1',
  WORKFORCE_WORKER_VERIFIED: 'workforce.worker.verified.v1',
  WORKFORCE_WORKER_ACTIVATED: 'workforce.worker.activated.v1',
  WORKFORCE_WORKER_SUSPENDED: 'workforce.worker.suspended.v1',
  WORKFORCE_WORKER_OFFBOARDED: 'workforce.worker.offboarded.v1',
  WORKFORCE_ENGAGEMENT_STARTED: 'workforce.engagement.started.v1',
  WORKFORCE_ENGAGEMENT_ENDED: 'workforce.engagement.ended.v1',
  WORKFORCE_DEPLOYMENT_STARTED: 'workforce.deployment.started.v1',
  WORKFORCE_DEPLOYMENT_ENDED: 'workforce.deployment.ended.v1',
  WORKFORCE_ROSTER_PUBLISHED: 'workforce.roster.published.v1',
  WORKFORCE_SHIFT_ASSIGNED: 'workforce.shift.assigned.v1',
  WORKFORCE_SHIFT_UNCOVERED: 'workforce.shift.uncovered.v1',
  WORKFORCE_SHIFT_SWAP_APPROVED: 'workforce.shift.swap_approved.v1',
  WORKFORCE_ATTENDANCE_CHECKED_IN: 'workforce.attendance.checked_in.v1',
  WORKFORCE_ATTENDANCE_CHECKED_OUT: 'workforce.attendance.checked_out.v1',
  WORKFORCE_ATTENDANCE_LATE: 'workforce.attendance.late.v1',
  WORKFORCE_ATTENDANCE_MISSING_CHECKOUT: 'workforce.attendance.missing_checkout.v1',
  WORKFORCE_ATTENDANCE_CORRECTED: 'workforce.attendance.corrected.v1',
  WORKFORCE_LEAVE_APPROVED: 'workforce.leave.approved.v1',
  WORKFORCE_OVERTIME_APPROVED: 'workforce.overtime.approved.v1',
  WORKFORCE_CERTIFICATION_EXPIRING: 'workforce.certification.expiring.v1',
  WORKFORCE_CONTRACT_EXPIRING: 'workforce.contract.expiring.v1',
  WORKFORCE_TASK_COMPLETED: 'workforce.task.completed.v1',
  // ==========================================
  // Phase 22: Enterprise Governance & Meetings
  // ==========================================
  GOVERNANCE_COMMITTEE_CREATED: 'governance.committee.created.v1',
  GOVERNANCE_COMMITTEE_MEMBER_ADDED: 'governance.committee.member_added.v1',
  GOVERNANCE_MEETING_CREATED: 'governance.meeting.created.v1',
  GOVERNANCE_MEETING_NOTICE_PUBLISHED: 'governance.meeting.notice_published.v1',
  GOVERNANCE_MEETING_AGENDA_PUBLISHED: 'governance.meeting.agenda_published.v1',
  GOVERNANCE_MEETING_STARTED: 'governance.meeting.started.v1',
  GOVERNANCE_MEETING_QUORUM_MET: 'governance.meeting.quorum_met.v1',
  GOVERNANCE_MEETING_COMPLETED: 'governance.meeting.completed.v1',
  GOVERNANCE_MOTION_PROPOSED: 'governance.motion.proposed.v1',
  GOVERNANCE_VOTE_OPENED: 'governance.vote.opened.v1',
  GOVERNANCE_VOTE_CAST: 'governance.vote.cast.v1',
  GOVERNANCE_VOTE_CLOSED: 'governance.vote.closed.v1',
  GOVERNANCE_VOTE_RESULT_PUBLISHED: 'governance.vote.result_published.v1',
  GOVERNANCE_RESOLUTION_ADOPTED: 'governance.resolution.adopted.v1',
  GOVERNANCE_MINUTES_APPROVED: 'governance.minutes.approved.v1',
  GOVERNANCE_MINUTES_PUBLISHED: 'governance.minutes.published.v1',
  GOVERNANCE_ACTION_CREATED: 'governance.action.created.v1',
  GOVERNANCE_ACTION_OVERDUE: 'governance.action.overdue.v1',
  GOVERNANCE_ACTION_COMPLETED: 'governance.action.completed.v1',
  GOVERNANCE_NOTICE_PUBLISHED: 'governance.notice.published.v1',
  GOVERNANCE_NOTICE_ACKNOWLEDGED: 'governance.notice.acknowledged.v1',
  GOVERNANCE_POLICY_PUBLISHED: 'governance.policy.published.v1',
  GOVERNANCE_POLICY_EFFECTIVE: 'governance.policy.effective.v1',
  GOVERNANCE_POLICY_ACKNOWLEDGED: 'governance.policy.acknowledged.v1',
} as const;

export const DOMAIN_EVENTS = DOMAIN_EVENT_NAMES;

export interface OrganizationCreatedEventPayload {
  organizationId: string;
  name: string;
  slug: string;
  defaultCurrency: string;
  defaultTimezone: string;
}

export interface OrganizationUpdatedEventPayload {
  organizationId: string;
  name?: string;
  legalName?: string | null;
  defaultCurrency?: string;
  defaultTimezone?: string;
  defaultLocale?: string;
}

export interface OrganizationStatusChangedEventPayload {
  organizationId: string;
  previousStatus: EntityStatus;
  newStatus: EntityStatus;
}

export interface CommunityCreatedEventPayload {
  communityId: string;
  organizationId: string;
  name: string;
  code: string;
  slug: string;
  city: string;
  countryCode: string;
}

export interface CommunityUpdatedEventPayload {
  communityId: string;
  organizationId: string;
  name?: string;
  status?: EntityStatus;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
}

export interface CommunityStatusChangedEventPayload {
  communityId: string;
  organizationId: string;
  previousStatus: EntityStatus;
  newStatus: EntityStatus;
}

export interface PortfolioCreatedEventPayload {
  portfolioId: string;
  organizationId: string;
  name: string;
  code: string;
  slug: string;
}

export interface PortfolioUpdatedEventPayload {
  portfolioId: string;
  organizationId: string;
  name?: string;
  status?: EntityStatus;
}

export interface SectionCreatedEventPayload {
  sectionId: string;
  organizationId: string;
  communityId: string;
  name: string;
  code: string;
}

export interface BuildingCreatedEventPayload {
  buildingId: string;
  organizationId: string;
  communityId: string;
  sectionId?: string | null;
  name: string;
  code: string;
  buildingType: BuildingType;
}

export interface BuildingUpdatedEventPayload {
  buildingId: string;
  organizationId: string;
  communityId: string;
  name?: string;
  status?: BuildingStatus;
}

export interface FloorCreatedEventPayload {
  floorId: string;
  organizationId: string;
  communityId: string;
  buildingId: string;
  label: string;
  sortOrder: number;
}

export interface UnitCreatedEventPayload {
  unitId: string;
  organizationId: string;
  communityId: string;
  buildingId?: string | null;
  floorId?: string | null;
  unitNumber: string;
  unitType: UnitType;
}

export interface UnitUpdatedEventPayload {
  unitId: string;
  organizationId: string;
  communityId: string;
  unitNumber?: string;
  carpetArea?: number | null;
  areaUnit?: AreaUnit;
}

export interface UnitStatusChangedEventPayload {
  unitId: string;
  organizationId: string;
  communityId: string;
  previousStatus: UnitStatus;
  newStatus: UnitStatus;
}

export interface PropertyImportCompletedEventPayload {
  jobId: string;
  organizationId: string;
  communityId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
}

// --- PHASE 4 EVENT PAYLOADS ---
export interface ResidentCreatedEventPayload {
  residentId: string;
  organizationId: string;
  communityId: string;
  displayName: string;
  status: ResidentStatus;
}

export interface ResidentUpdatedEventPayload {
  residentId: string;
  organizationId: string;
  communityId: string;
  displayName?: string;
  status?: ResidentStatus;
}

export interface ResidentUserLinkedEventPayload {
  residentId: string;
  userId: string;
  organizationId: string;
  communityId: string;
}

export interface ResidentInvitedEventPayload {
  residentId: string;
  organizationId: string;
  communityId: string;
  email: string;
}

export interface HouseholdCreatedEventPayload {
  householdId: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  name?: string | null;
  status: HouseholdStatus;
}

export interface HouseholdMemberAddedEventPayload {
  householdId: string;
  residentId: string;
  relationshipType: HouseholdRelationshipType;
  isPrimaryContact: boolean;
}

export interface HouseholdMemberRemovedEventPayload {
  householdId: string;
  residentId: string;
}

export interface OwnershipStartedEventPayload {
  ownershipId: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  residentId: string;
  ownershipType: OwnershipType;
  ownershipShare?: number | null;
}

export interface OwnershipEndedEventPayload {
  ownershipId: string;
  unitId: string;
  residentId: string;
  endDate: string;
}

export interface OwnershipTransferredEventPayload {
  unitId: string;
  organizationId: string;
  communityId: string;
  previousOwnerIds: string[];
  newOwnerIds: string[];
  transferDate: string;
}

export interface TenancyCreatedEventPayload {
  tenancyId: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  householdId: string;
  startDate: string;
  status: TenancyStatus;
}

export interface TenancyActivatedEventPayload {
  tenancyId: string;
  unitId: string;
  householdId: string;
}

export interface TenancyEndedEventPayload {
  tenancyId: string;
  unitId: string;
  householdId: string;
  endDate: string;
}

export interface OccupancyStartedEventPayload {
  occupancyId: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  householdId: string;
  occupancyType: OccupancyType;
  startDate: string;
}

export interface OccupancyEndedEventPayload {
  occupancyId: string;
  unitId: string;
  householdId: string;
  endDate: string;
}

export interface UnitMoveInCompletedEventPayload {
  unitId: string;
  organizationId: string;
  communityId: string;
  householdId: string;
  primaryResidentId: string;
  occupancyType: OccupancyType;
  effectiveDate: string;
}

export interface UnitMoveOutCompletedEventPayload {
  unitId: string;
  organizationId: string;
  communityId: string;
  householdId: string;
  occupancyId: string;
  effectiveDate: string;
  reason?: string | null;
}

// --- IAM EVENT PAYLOADS ---
export interface UserCreatedEventPayload {
  userId: string;
  email: string;
  displayName: string;
  status: UserStatus;
}

export interface UserUpdatedEventPayload {
  userId: string;
  displayName?: string;
  version: number;
}

export interface UserStatusChangedEventPayload {
  userId: string;
  previousStatus: UserStatus;
  newStatus: UserStatus;
  version: number;
}

export interface SessionCreatedEventPayload {
  sessionId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionRevokedEventPayload {
  sessionId: string;
  userId: string;
}

export interface MembershipCreatedEventPayload {
  membershipId: string;
  userId: string;
  organizationId: string;
  communityId?: string | null;
  status: MembershipStatus;
}

export interface MembershipStatusChangedEventPayload {
  membershipId: string;
  userId: string;
  organizationId: string;
  communityId?: string | null;
  previousStatus: MembershipStatus;
  newStatus: MembershipStatus;
}

export interface RoleCreatedEventPayload {
  roleId: string;
  code: string;
  name: string;
  organizationId?: string | null;
}

export interface RoleUpdatedEventPayload {
  roleId: string;
  code: string;
  name: string;
  organizationId?: string | null;
}

export interface RoleAssignmentCreatedEventPayload {
  assignmentId: string;
  userId: string;
  roleId: string;
  scopeType: ScopeType;
  scopeId?: string | null;
  status: AssignmentStatus;
}

export interface RoleAssignmentRevokedEventPayload {
  assignmentId: string;
  userId: string;
  roleId: string;
}

// --- PHASE 7 EVENT PAYLOADS ---

export interface WorkflowDefinitionPublishedEventPayload {
  workflowDefinitionId: string;
  key: string;
  version: number;
  entityType: string;
  organizationId?: string | null;
  communityId?: string | null;
}

export interface WorkflowStartedEventPayload {
  workflowInstanceId: string;
  workflowDefinitionKey: string;
  workflowVersion: number;
  resourceType: string;
  resourceId: string;
  organizationId?: string | null;
  communityId?: string | null;
  initialState: string;
}

export interface WorkflowTransitionedEventPayload {
  workflowInstanceId: string;
  workflowDefinitionKey: string;
  workflowVersion: number;
  resourceType: string;
  resourceId: string;
  organizationId?: string | null;
  communityId?: string | null;
  fromState: string;
  toState: string;
  action: string;
  actorId?: string | null;
}

export interface WorkflowCompletedEventPayload {
  workflowInstanceId: string;
  workflowDefinitionKey: string;
  resourceType: string;
  resourceId: string;
  finalState: string;
}

export interface WorkflowCancelledEventPayload {
  workflowInstanceId: string;
  resourceType: string;
  resourceId: string;
  reason?: string;
}

export interface WorkflowOverriddenEventPayload {
  workflowInstanceId: string;
  resourceType: string;
  resourceId: string;
  previousState: string;
  targetState: string;
  reason: string;
  actorId: string;
}

export interface RulePublishedEventPayload {
  ruleDefinitionId: string;
  key: string;
  version: number;
  resourceType: string;
  organizationId?: string | null;
  communityId?: string | null;
}

export interface ApprovalPolicyPublishedEventPayload {
  approvalPolicyId: string;
  key: string;
  version: number;
  organizationId?: string | null;
  communityId?: string | null;
}

export interface ApprovalStartedEventPayload {
  approvalInstanceId: string;
  policyKey: string;
  policyVersion: number;
  resourceType: string;
  resourceId: string;
  workflowInstanceId?: string | null;
  organizationId?: string | null;
  communityId?: string | null;
  requesterId?: string | null;
}

export interface ApprovalStepOpenedEventPayload {
  approvalInstanceId: string;
  stepInstanceId: string;
  stepOrder: number;
  stepName: string;
  eligibleApproverIds: string[];
}

export interface ApprovalDecisionRecordedEventPayload {
  approvalInstanceId: string;
  stepInstanceId: string;
  actorId: string;
  decision: string;
  comment?: string | null;
}

export interface ApprovalStepCompletedEventPayload {
  approvalInstanceId: string;
  stepInstanceId: string;
  stepOrder: number;
  status: string;
}

export interface ApprovalApprovedEventPayload {
  approvalInstanceId: string;
  policyKey: string;
  resourceType: string;
  resourceId: string;
  workflowInstanceId?: string | null;
}

export interface ApprovalRejectedEventPayload {
  approvalInstanceId: string;
  policyKey: string;
  resourceType: string;
  resourceId: string;
  workflowInstanceId?: string | null;
  rejectionBehavior: string;
}

export interface SlaStartedEventPayload {
  slaInstanceId: string;
  policyKey: string;
  resourceType: string;
  resourceId: string;
  dueAt: string;
  warningAt?: string | null;
}

export interface SlaWarningEventPayload {
  slaInstanceId: string;
  policyKey: string;
  resourceType: string;
  resourceId: string;
  dueAt: string;
}

export interface SlaPausedEventPayload {
  slaInstanceId: string;
  resourceType: string;
  resourceId: string;
  pausedAt: string;
}

export interface SlaResumedEventPayload {
  slaInstanceId: string;
  resourceType: string;
  resourceId: string;
  newDueAt: string;
}

export interface SlaCompletedEventPayload {
  slaInstanceId: string;
  resourceType: string;
  resourceId: string;
  completedAt: string;
}

export interface SlaBreachedEventPayload {
  slaInstanceId: string;
  policyKey: string;
  resourceType: string;
  resourceId: string;
  breachedAt: string;
}

// Helpdesk Event Payloads (Phase 8)
export interface TicketCreatedEventPayload {
  ticketId: string;
  ticketNumber: string;
  organizationId: string;
  communityId: string;
  title: string;
  categoryId: string;
  priority: string;
  reportedByResidentId?: string | null;
  reportedByUserId?: string | null;
  assignedTeamId?: string | null;
  assignedUserId?: string | null;
}

export interface TicketAssignedEventPayload {
  ticketId: string;
  ticketNumber: string;
  organizationId: string;
  communityId: string;
  assignedTeamId?: string | null;
  assignedUserId?: string | null;
  assignedById: string;
  reason?: string | null;
}

export interface TicketTransitionedEventPayload {
  ticketId: string;
  ticketNumber: string;
  fromState: string;
  toState: string;
  action: string;
  actorId?: string | null;
  reason?: string | null;
}

export interface TicketResolvedEventPayload {
  ticketId: string;
  ticketNumber: string;
  organizationId: string;
  communityId: string;
  resolutionCode: string;
  resolutionSummary: string;
  resolvedById: string;
  resolvedAt: string;
}

export interface TicketClosedEventPayload {
  ticketId: string;
  ticketNumber: string;
  closedById?: string | null;
  closedAt: string;
}

export interface TicketReopenedEventPayload {
  ticketId: string;
  ticketNumber: string;
  reopenedById: string;
  reopenCount: number;
  reason: string;
  reopenedAt: string;
}

export interface TicketCancelledEventPayload {
  ticketId: string;
  ticketNumber: string;
  cancelledById: string;
  reason: string;
  cancelledAt: string;
}

export interface TicketCommentAddedEventPayload {
  ticketId: string;
  ticketNumber: string;
  commentId: string;
  type: string;
  authorUserId?: string | null;
  authorResidentId?: string | null;
}

export interface TicketFeedbackSubmittedEventPayload {
  ticketId: string;
  ticketNumber: string;
  userId: string;
  residentId?: string | null;
  rating: number;
  comment?: string | null;
}

// =============================================================================
// ASSET MANAGEMENT EVENT PAYLOADS (Phase 10)
// =============================================================================

export interface AssetCreatedEventPayload {
  assetId: string;
  assetCode: string;
  name: string;
  organizationId: string;
  communityId: string;
  categoryId: string;
  criticality: string;
  locationType: string;
}

export interface AssetLocationChangedEventPayload {
  assetId: string;
  assetCode: string;
  organizationId: string;
  communityId: string;
  fromLocationType: string;
  toLocationType: string;
  toBuildingId?: string | null;
  toUnitId?: string | null;
  movedById: string;
  reason: string;
}

export interface AssetCommissionedEventPayload {
  assetId: string;
  assetCode: string;
  organizationId: string;
  communityId: string;
  commissionedAt: string;
  commissionedById: string;
}

export interface AssetConditionChangedEventPayload {
  assetId: string;
  assetCode: string;
  organizationId: string;
  communityId: string;
  fromCondition: string;
  toCondition: string;
  operationalStatus?: string;
  updatedById: string;
}

export interface AssetBreakdownReportedEventPayload {
  assetId: string;
  assetCode: string;
  organizationId: string;
  communityId: string;
  downtimeId: string;
  reason: string;
  impactLevel: string;
  workOrderId?: string | null;
  reportedById: string;
}

export interface AssetRestoredEventPayload {
  assetId: string;
  assetCode: string;
  organizationId: string;
  communityId: string;
  downtimeId: string;
  durationMinutes?: number | null;
  restoredById: string;
}

export interface AssetDecommissionedEventPayload {
  assetId: string;
  assetCode: string;
  organizationId: string;
  communityId: string;
  reason: string;
  replacementAssetId?: string | null;
  decommissionedById: string;
}

export interface AssetWarrantyExpiringEventPayload {
  warrantyId: string;
  assetId: string;
  assetCode: string;
  organizationId: string;
  communityId: string;
  providerName: string;
  endDate: string;
  daysRemaining: number;
}

export interface AssetContractExpiringEventPayload {
  contractId: string;
  contractNumber: string;
  organizationId: string;
  communityId: string;
  serviceProviderName: string;
  endDate: string;
  daysRemaining: number;
}

export interface AssetMeterReadingRecordedEventPayload {
  readingId: string;
  meterId: string;
  assetId: string;
  assetCode: string;
  reading: number;
  delta?: number | null;
  source: string;
  recordedById?: string | null;
}

// =============================================================================
// INVENTORY EVENT PAYLOADS (PHASE 11)
// =============================================================================

export interface InventoryItemCreatedEventPayload {
  organizationId: string;
  communityId?: string | null;
  itemId: string;
  itemCode: string;
  name: string;
  categoryId: string;
  itemType: string;
  baseUomId: string;
}

export interface InventoryReceiptPostedEventPayload {
  organizationId: string;
  communityId?: string | null;
  receiptId: string;
  receiptNumber: string;
  storeId: string;
  lineCount: number;
  totalQuantity: number;
}

export interface InventoryStockIssuedEventPayload {
  organizationId: string;
  communityId?: string | null;
  issueId: string;
  issueNumber: string;
  storeId: string;
  workOrderId?: string | null;
  issuedToUserId?: string | null;
  lineCount: number;
}

export interface InventoryStockReturnedEventPayload {
  organizationId: string;
  communityId?: string | null;
  returnId: string;
  returnNumber: string;
  storeId: string;
  workOrderId?: string | null;
  lineCount: number;
}

export interface InventoryStockTransferredEventPayload {
  organizationId: string;
  communityId?: string | null;
  transferId: string;
  transferNumber: string;
  sourceStoreId: string;
  destinationStoreId: string;
  status: string;
}

export interface InventoryStockAdjustedEventPayload {
  organizationId: string;
  communityId?: string | null;
  adjustmentId: string;
  adjustmentNumber: string;
  storeId: string;
  reason: string;
}

export interface InventoryReservationCreatedEventPayload {
  reservationId: string;
  storeId: string;
  itemId: string;
  workOrderId: string;
  quantity: number;
}

export interface InventoryMaterialConsumedEventPayload {
  consumptionId: string;
  workOrderId: string;
  itemId: string;
  assetId?: string | null;
  quantity: number;
}

export interface InventoryLowStockEventPayload {
  organizationId: string;
  communityId?: string | null;
  storeId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  availableQuantity: number;
  reorderLevel: number;
}

export interface InventoryBatchExpiringEventPayload {
  batchId: string;
  itemId: string;
  batchNumber: string;
  expiryAt: string;
  daysRemaining: number;
}

export interface InventoryStockCountPostedEventPayload {
  organizationId: string;
  communityId?: string | null;
  countId: string;
  countNumber: string;
  storeId: string;
  totalLines: number;
  reconciledLines: number;
}

export interface WorkOrderMaterialRequestedEventPayload {
  requirementId: string;
  workOrderId: string;
  itemId: string;
  requiredQty: number;
}
