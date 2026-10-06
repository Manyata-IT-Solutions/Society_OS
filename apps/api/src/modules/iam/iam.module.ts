import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository.js';
import { MembershipRepository } from './membership.repository.js';
import { RoleRepository } from './role.repository.js';
import { RoleAssignmentRepository } from './role-assignment.repository.js';
import { PermissionRepository } from './permission.repository.js';
import { UsersService } from './users.service.js';
import { MembershipsService } from './memberships.service.js';
import { RolesService } from './roles.service.js';
import { RoleAssignmentsService } from './role-assignments.service.js';
import { UsersController } from './users.controller.js';
import { MembershipsController } from './memberships.controller.js';
import { RolesController } from './roles.controller.js';
import { RoleAssignmentsController } from './role-assignments.controller.js';
import { CryptoService } from '../auth/crypto.service.js';
import { OrganizationModule } from '../organization/organization.module.js';

@Module({
  imports: [OrganizationModule],
  controllers: [UsersController, MembershipsController, RolesController, RoleAssignmentsController],
  providers: [
    UserRepository,
    MembershipRepository,
    RoleRepository,
    RoleAssignmentRepository,
    PermissionRepository,
    UsersService,
    MembershipsService,
    RolesService,
    RoleAssignmentsService,
    CryptoService,
  ],
  exports: [
    UserRepository,
    MembershipRepository,
    RoleRepository,
    RoleAssignmentRepository,
    PermissionRepository,
    UsersService,
    MembershipsService,
    RolesService,
    RoleAssignmentsService,
    CryptoService,
  ],
})
export class IamModule {}
