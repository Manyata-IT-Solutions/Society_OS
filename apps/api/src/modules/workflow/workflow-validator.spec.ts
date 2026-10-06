import { WorkflowValidator } from './workflow-validator.js';
import { BadRequestException } from '@nestjs/common';
import type { WorkflowStateDescriptor, WorkflowTransitionDescriptor } from '@community-os/types';

describe('WorkflowValidator', () => {
  let validator: WorkflowValidator;

  beforeEach(() => {
    validator = new WorkflowValidator();
  });

  const validStates: WorkflowStateDescriptor[] = [
    { key: 'DRAFT', label: 'Draft', type: 'START', isTerminal: false, displayOrder: 1 },
    { key: 'IN_REVIEW', label: 'In Review', type: 'ACTIVE', isTerminal: false, displayOrder: 2 },
    { key: 'COMPLETED', label: 'Completed', type: 'COMPLETED', isTerminal: true, displayOrder: 3 },
  ];

  const validTransitions: WorkflowTransitionDescriptor[] = [
    { key: 'tr_submit', fromState: 'DRAFT', toState: 'IN_REVIEW', action: 'submit' },
    { key: 'tr_complete', fromState: 'IN_REVIEW', toState: 'COMPLETED', action: 'complete' },
  ];

  it('should validate a correct workflow graph without errors', () => {
    expect(() => {
      validator.validateGraph('DRAFT', validStates, validTransitions);
    }).not.toThrow();
  });

  it('should throw when initialStateKey does not exist in states list', () => {
    expect(() => {
      validator.validateGraph('NON_EXISTENT', validStates, validTransitions);
    }).toThrow(BadRequestException);
  });

  it('should throw when duplicate state keys exist', () => {
    const duplicateStates: WorkflowStateDescriptor[] = [
      ...validStates,
      { key: 'DRAFT', label: 'Draft 2', type: 'ACTIVE', isTerminal: false, displayOrder: 4 },
    ];
    expect(() => {
      validator.validateGraph('DRAFT', duplicateStates, validTransitions);
    }).toThrow(BadRequestException);
  });

  it('should throw when a transition has outgoing arrow from a terminal state', () => {
    const invalidTransitions: WorkflowTransitionDescriptor[] = [
      ...validTransitions,
      { key: 'tr_reopen', fromState: 'COMPLETED', toState: 'DRAFT', action: 'reopen' },
    ];
    expect(() => {
      validator.validateGraph('DRAFT', validStates, invalidTransitions);
    }).toThrow(BadRequestException);
  });

  it('should throw when duplicate actions exist from the same fromState', () => {
    const duplicateActionTransitions: WorkflowTransitionDescriptor[] = [
      ...validTransitions,
      { key: 'tr_submit_dup', fromState: 'DRAFT', toState: 'COMPLETED', action: 'submit' },
    ];
    expect(() => {
      validator.validateGraph('DRAFT', validStates, duplicateActionTransitions);
    }).toThrow(BadRequestException);
  });
});
