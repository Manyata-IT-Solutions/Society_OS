import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { FactRegistry } from './fact-registry.js';
import { RuleEvaluatorService } from './rule-evaluator.service.js';
import { RuleDefinitionRepository } from './rule-definition.repository.js';
import { RuleService } from './rule.service.js';
import { RulesController } from './rules.controller.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuthModule, AuthorizationModule],
  controllers: [RulesController],
  providers: [FactRegistry, RuleEvaluatorService, RuleDefinitionRepository, RuleService],
  exports: [FactRegistry, RuleEvaluatorService, RuleService, RuleDefinitionRepository],
})
export class RuleModule {}
