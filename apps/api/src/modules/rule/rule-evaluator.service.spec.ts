import { RuleEvaluatorService } from './rule-evaluator.service.js';
import { FactRegistry } from './fact-registry.js';
import type { ConditionNode } from '@community-os/types';

describe('RuleEvaluatorService', () => {
  let evaluator: RuleEvaluatorService;
  let factRegistry: FactRegistry;

  beforeEach(() => {
    factRegistry = new FactRegistry();
    evaluator = new RuleEvaluatorService(factRegistry);
  });

  describe('Simple Condition Evaluation', () => {
    it('should evaluate numeric comparisons accurately', () => {
      const tree: ConditionNode = {
        simple: {
          field: 'resource.amount',
          operator: 'LESS_THAN_OR_EQUAL',
          value: 50000,
        },
      };

      const resultPass = evaluator.evaluate('test.rule', 1, tree, { resource: { amount: 35000 } });
      expect(resultPass.passed).toBe(true);

      const resultFail = evaluator.evaluate('test.rule', 1, tree, { resource: { amount: 65000 } });
      expect(resultFail.passed).toBe(false);
    });

    it('should evaluate IN and NOT_IN array conditions', () => {
      const tree: ConditionNode = {
        simple: {
          field: 'resource.category',
          operator: 'IN',
          value: ['PLUMBING', 'ELECTRICAL', 'CARPENTRY'],
        },
      };

      const pass = evaluator.evaluate('test.rule', 1, tree, { resource: { category: 'PLUMBING' } });
      expect(pass.passed).toBe(true);

      const fail = evaluator.evaluate('test.rule', 1, tree, {
        resource: { category: 'LANDSCAPING' },
      });
      expect(fail.passed).toBe(false);
    });
  });

  describe('Recursive AST Evaluation (AND / OR / NOT)', () => {
    it('should evaluate compound AND condition', () => {
      const tree: ConditionNode = {
        and: [
          { simple: { field: 'resource.amount', operator: 'GREATER_THAN', value: 1000 } },
          { simple: { field: 'resource.status', operator: 'EQUALS', value: 'ACTIVE' } },
        ],
      };

      const pass = evaluator.evaluate('test.rule', 1, tree, {
        resource: { amount: 2500, status: 'ACTIVE' },
      });
      expect(pass.passed).toBe(true);

      const fail = evaluator.evaluate('test.rule', 1, tree, {
        resource: { amount: 500, status: 'ACTIVE' },
      });
      expect(fail.passed).toBe(false);
    });

    it('should evaluate nested NOT condition', () => {
      const tree: ConditionNode = {
        not: {
          simple: { field: 'actor.isPlatformAdmin', operator: 'EQUALS', value: true },
        },
      };

      const pass = evaluator.evaluate('test.rule', 1, tree, {
        actor: { isPlatformAdmin: false },
      });
      expect(pass.passed).toBe(true);

      const fail = evaluator.evaluate('test.rule', 1, tree, {
        actor: { isPlatformAdmin: true },
      });
      expect(fail.passed).toBe(false);
    });
  });
});
