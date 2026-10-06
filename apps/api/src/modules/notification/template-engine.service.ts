import { Injectable, HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { NotificationTemplate } from '@community-os/types';

@Injectable()
export class TemplateEngineService {
  /**
   * Render template string by substituting variables safely using double curly braces: {{varName}}.
   */
  renderString(
    templateStr: string,
    variables: Record<string, unknown>,
    declaredVariables?: string[],
  ): string {
    if (!templateStr) return '';

    // Validate that all declared variables exist
    if (declaredVariables && declaredVariables.length > 0) {
      const missing = declaredVariables.filter(
        (v) => variables[v] === undefined || variables[v] === null,
      );
      if (missing.length > 0) {
        throw new DomainException(
          'MISSING_TEMPLATE_VARIABLES',
          `Required template variables are missing: ${missing.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Safe regex substitution - matches {{ alphanumeric_identifiers }}
    return templateStr.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, varName) => {
      const value = variables[varName];
      if (value === undefined || value === null) {
        return match; // Keep placeholder if variable is not provided
      }
      return String(value);
    });
  }

  /**
   * Render both subject and body of a NotificationTemplate.
   */
  renderTemplate(
    template: NotificationTemplate,
    variables: Record<string, unknown>,
  ): { title: string; body: string } {
    const title = template.subjectTemplate
      ? this.renderString(template.subjectTemplate, variables, template.variables)
      : template.name;

    const body = this.renderString(template.bodyTemplate, variables, template.variables);

    return { title, body };
  }
}
