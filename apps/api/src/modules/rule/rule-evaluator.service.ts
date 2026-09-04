import { Injectable, BadRequestException } from '@nestjs/common';
import type {
  ConditionNode,
  SimpleCondition,
  RuleEvaluationResult,
  RuleEvaluationTrace,
  RuleOperator,
} from '@community-os/types';
import { FactRegistry } from './fact-registry.js';

@Injectable()
export class RuleEvaluatorService {
  private readonly MAX_DEPTH = 10;
  private readonly MAX_NODES = 50;

  constructor(private readonly factRegistry: FactRegistry) {}

  /**
   * Evaluates a condition tree against a facts object deterministically.
   */
  evaluate(
    ruleKey: string,
    version: number,
    conditionTree: ConditionNode,
    facts: Record<string, unknown>,
    outputEffect?: Record<string, unknown> | null,
    evaluationTime: Date = new Date(),
  ): RuleEvaluationResult {
    let nodeCount = 0;

    const evaluateNode = (node: ConditionNode, depth: number): RuleEvaluationTrace => {
      if (depth > this.MAX_DEPTH) {
        throw new BadRequestException(
          `Condition tree exceeded maximum recursion depth of ${this.MAX_DEPTH}`,
        );
      }
      nodeCount++;
      if (nodeCount > this.MAX_NODES) {
        throw new BadRequestException(
          `Condition tree exceeded maximum node count of ${this.MAX_NODES}`,
        );
      }

      // Simple condition
      if (node.simple) {
        return this.evaluateSimpleCondition(node.simple, facts, evaluationTime);
      }

      // AND compound condition
      if (node.and && Array.isArray(node.and)) {
        const childTraces = node.and.map((child) => evaluateNode(child, depth + 1));
        const passed = childTraces.every((t) => t.passed);
        return {
          nodeType: 'and',
          passed,
          children: childTraces,
        };
      }

      // OR compound condition
      if (node.or && Array.isArray(node.or)) {
        const childTraces = node.or.map((child) => evaluateNode(child, depth + 1));
        const passed = childTraces.some((t) => t.passed);
        return {
          nodeType: 'or',
          passed,
          children: childTraces,
        };
      }

      // NOT condition
      if (node.not) {
        const childTrace = evaluateNode(node.not, depth + 1);
        return {
          nodeType: 'not',
          passed: !childTrace.passed,
          children: [childTrace],
        };
      }

      // Default empty node evaluates to true
      return {
        nodeType: 'and',
        passed: true,
        children: [],
      };
    };

    const rootTrace = evaluateNode(conditionTree, 1);

    return {
      ruleKey,
      version,
      passed: rootTrace.passed,
      outputEffect: rootTrace.passed ? outputEffect : null,
      trace: rootTrace,
      evaluatedAt: evaluationTime,
    };
  }

  private evaluateSimpleCondition(
    cond: SimpleCondition,
    facts: Record<string, unknown>,
    evaluationTime: Date,
  ): RuleEvaluationTrace {
    const actualValue = this.resolveFactValue(cond.field, facts);
    const passed = this.compareValues(cond.operator, actualValue, cond.value, evaluationTime);

    return {
      nodeType: 'simple',
      field: cond.field,
      operator: cond.operator,
      expectedValue: cond.value,
      actualValue: actualValue ?? null,
      passed,
    };
  }

  private resolveFactValue(path: string, facts: Record<string, unknown>): unknown {
    if (path in facts) {
      return facts[path];
    }
    const parts = path.split('.');
    let current: unknown = facts;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private compareValues(
    operator: RuleOperator,
    actual: unknown,
    expected: unknown,
    _evaluationTime: Date,
  ): boolean {
    switch (operator) {
      case 'EQUALS':
        return actual === expected;
      case 'NOT_EQUALS':
        return actual !== expected;
      case 'GREATER_THAN':
        if (typeof actual === 'number' && typeof expected === 'number') {
          return actual > expected;
        }
        return false;
      case 'GREATER_THAN_OR_EQUAL':
        if (typeof actual === 'number' && typeof expected === 'number') {
          return actual >= expected;
        }
        return false;
      case 'LESS_THAN':
        if (typeof actual === 'number' && typeof expected === 'number') {
          return actual < expected;
        }
        return false;
      case 'LESS_THAN_OR_EQUAL':
        if (typeof actual === 'number' && typeof expected === 'number') {
          return actual <= expected;
        }
        return false;
      case 'IN':
        if (Array.isArray(expected)) {
          return expected.includes(actual);
        }
        return false;
      case 'NOT_IN':
        if (Array.isArray(expected)) {
          return !expected.includes(actual);
        }
        return true;
      case 'CONTAINS':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.includes(expected);
        }
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        return false;
      case 'IS_EMPTY':
        if (actual === null || actual === undefined) return true;
        if (typeof actual === 'string' || Array.isArray(actual)) return actual.length === 0;
        if (typeof actual === 'object') return Object.keys(actual as object).length === 0;
        return false;
      case 'IS_NOT_EMPTY':
        if (actual === null || actual === undefined) return false;
        if (typeof actual === 'string' || Array.isArray(actual)) return actual.length > 0;
        if (typeof actual === 'object') return Object.keys(actual as object).length > 0;
        return true;
      case 'DATE_BEFORE': {
        const actualDate = this.toDate(actual);
        const expectedDate = this.toDate(expected);
        if (!actualDate || !expectedDate) return false;
        return actualDate.getTime() < expectedDate.getTime();
      }
      case 'DATE_AFTER': {
        const actualDate = this.toDate(actual);
        const expectedDate = this.toDate(expected);
        if (!actualDate || !expectedDate) return false;
        return actualDate.getTime() > expectedDate.getTime();
      }
      default:
        return false;
    }
  }

  private toDate(val: unknown): Date | null {
    if (val instanceof Date) return val;
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }
}
