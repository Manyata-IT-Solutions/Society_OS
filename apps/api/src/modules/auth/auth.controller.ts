import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentActor, CurrentSessionId } from '../../common/decorators/current-actor.decorator.js';
import { loginSchema, refreshTokenSchema } from '@community-os/validation';
import type { Actor } from '@community-os/types';
import type { Request } from 'express';

@ApiTags('Authentication & Sessions')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'User account suspended' })
  async login(@Body() body: unknown, @Req() req: Request) {
    const validated = loginSchema.parse(body);
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || undefined,
    };
    return this.authService.login(validated, meta);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired session' })
  async refresh(@Body() body: unknown, @Req() req: Request) {
    const validated = refreshTokenSchema.parse(body);
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || undefined,
    };
    return this.authService.refresh(validated, meta);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentSessionId() sessionId: string) {
    await this.authService.logout(sessionId);
    return { success: true, message: 'Session revoked successfully.' };
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all active sessions for current user' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  async logoutAll(@CurrentActor() actor: Actor) {
    await this.authService.logoutAll(actor.id);
    return { success: true, message: 'All active sessions revoked.' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile and permissions of authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMe(@CurrentActor() actor: Actor, @CurrentSessionId() sessionId: string) {
    return this.authService.getMe(actor.id, sessionId);
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active login sessions for current user' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  async getSessions(@CurrentActor() actor: Actor, @CurrentSessionId() sessionId: string) {
    return this.authService.getUserSessions(actor.id, sessionId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 403, description: 'Cannot revoke another user session' })
  async revokeSession(@Param('sessionId') sessionIdToRevoke: string, @CurrentActor() actor: Actor) {
    await this.authService.revokeSession(actor.id, sessionIdToRevoke, actor.isPlatformAdmin);
    return { success: true, message: 'Session revoked.' };
  }
}
