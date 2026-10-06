import { Module } from '@nestjs/common';
import { TerminologyService } from './terminology.service.js';
import { TerminologyController } from './terminology.controller.js';
import { ConfigurationModule } from '../configuration/configuration.module.js';

@Module({
  imports: [ConfigurationModule],
  controllers: [TerminologyController],
  providers: [TerminologyService],
  exports: [TerminologyService],
})
export class TerminologyModule {}
