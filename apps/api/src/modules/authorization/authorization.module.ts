import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { IamModule } from '../iam/iam.module.js';

@Global()
@Module({
  imports: [IamModule],
  providers: [AuthorizationService, PermissionGuard],
  exports: [AuthorizationService, PermissionGuard],
})
export class AuthorizationModule {}
