import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AIPlatformService } from './ai-platform.service.js';
import {
  AIAssistantQueryDto,
  DocumentQAQueryDto,
  SubmitAIFeedbackDto,
} from '@community-os/contracts';

@Controller('ai')
@UseGuards(AuthGuard)
export class AIController {
  constructor(private readonly aiService: AIPlatformService) {}

  @Post('assistant/query')
  async assistantQuery(@Body() dto: AIAssistantQueryDto, @Req() req: any) {
    return this.aiService.processAssistantQuery(dto, req?.user?.id);
  }

  @Post('documents/query')
  async documentQA(@Body() dto: DocumentQAQueryDto, @Req() req: any) {
    return this.aiService.processDocumentQA(dto, req?.user?.id);
  }

  @Post('feedback')
  async submitFeedback(@Body() dto: SubmitAIFeedbackDto, @Req() req: any) {
    return this.aiService.submitFeedback(dto, req?.user?.id);
  }
}
