import { Injectable, BadRequestException } from '@nestjs/common';
import type { WorkflowStateDescriptor, WorkflowTransitionDescriptor } from '@community-os/types';

@Injectable()
export class WorkflowValidator {
  private readonly MAX_STATES = 30;
  private readonly MAX_TRANSITIONS = 100;

  validateGraph(
    initialStateKey: string,
    states: WorkflowStateDescriptor[],
    transitions: WorkflowTransitionDescriptor[],
  ): void {
    if (states.length > this.MAX_STATES) {
      throw new BadRequestException(`Workflow exceeds maximum limit of ${this.MAX_STATES} states`);
    }
    if (transitions.length > this.MAX_TRANSITIONS) {
      throw new BadRequestException(
        `Workflow exceeds maximum limit of ${this.MAX_TRANSITIONS} transitions`,
      );
    }

    // 1. Verify unique state keys
    const stateKeySet = new Set<string>();
    const terminalStateKeys = new Set<string>();

    for (const state of states) {
      if (stateKeySet.has(state.key)) {
        throw new BadRequestException(`Duplicate state key "${state.key}" in workflow definition`);
      }
      stateKeySet.add(state.key);

      if (
        state.isTerminal ||
        state.type === 'COMPLETED' ||
        state.type === 'CANCELLED' ||
        state.type === 'FAILED'
      ) {
        terminalStateKeys.add(state.key);
      }
    }

    // 2. Verify initial state exists
    if (!stateKeySet.has(initialStateKey)) {
      throw new BadRequestException(
        `Initial state "${initialStateKey}" is not declared in states list`,
      );
    }

    // 3. Verify transitions
    const actionByFromState = new Set<string>();

    for (const tr of transitions) {
      if (!stateKeySet.has(tr.fromState)) {
        throw new BadRequestException(
          `Transition "${tr.key}" references undefined fromState "${tr.fromState}"`,
        );
      }
      if (!stateKeySet.has(tr.toState)) {
        throw new BadRequestException(
          `Transition "${tr.key}" references undefined toState "${tr.toState}"`,
        );
      }

      if (terminalStateKeys.has(tr.fromState)) {
        throw new BadRequestException(
          `Terminal state "${tr.fromState}" cannot have outgoing transitions`,
        );
      }

      const actionKey = `${tr.fromState}::${tr.action}`;
      if (actionByFromState.has(actionKey)) {
        throw new BadRequestException(
          `Duplicate action "${tr.action}" from state "${tr.fromState}". Each action must be unique per state.`,
        );
      }
      actionByFromState.add(actionKey);
    }
  }
}
