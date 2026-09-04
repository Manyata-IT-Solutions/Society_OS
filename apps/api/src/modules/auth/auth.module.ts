import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CryptoService } from './crypto.service.js';
import { JwtTokenService } from './jwt.service.js';
import { SessionRepository } from './session.repository.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { IamModule } from '../iam/iam.module.js';

@Global()
@Module({
  imports: [IamModule],
  controllers: [AuthController],
  providers: [AuthService, CryptoService, JwtTokenService, SessionRepository, AuthGuard],
  exports: [AuthService, CryptoService, JwtTokenService, SessionRepository, AuthGuard],
})
export class AuthModule {}
