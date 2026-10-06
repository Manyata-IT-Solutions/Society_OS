import { TemplateEngineService } from './template-engine.service.js';
import type { NotificationTemplate } from '@community-os/types';

describe('TemplateEngineService (Unit)', () => {
  let service: TemplateEngineService;

  beforeEach(() => {
    service = new TemplateEngineService();
  });

  describe('renderString', () => {
    it('should correctly substitute single and multiple variables', () => {
      const template =
        'Hello {{residentName}}, your unit {{unitNumber}} is ready in {{communityName}}.';
      const variables = {
        residentName: 'Alice Smith',
        unitNumber: '101',
        communityName: 'Green Valley',
      };

      const result = service.renderString(template, variables);
      expect(result).toBe('Hello Alice Smith, your unit 101 is ready in Green Valley.');
    });

    it('should throw DomainException if required declared variables are missing', () => {
      const template = 'Hello {{residentName}}, your code is {{code}}.';
      const declared = ['residentName', 'code'];
      const variables = { residentName: 'Alice' };

      expect(() => service.renderString(template, variables, declared)).toThrow(
        /Required template variables are missing: code/,
      );
    });

    it('should safely handle whitespace within curly braces {{ varName }}', () => {
      const template = 'Welcome {{   userName   }}!';
      const result = service.renderString(template, { userName: 'Bob' });
      expect(result).toBe('Welcome Bob!');
    });
  });

  describe('renderTemplate', () => {
    it('should render both subject and body', () => {
      const mockTemplate: NotificationTemplate = {
        id: 'tmpl-1',
        code: 'TEST_TMPL',
        name: 'Test Template',
        category: 'SYSTEM',
        channel: 'IN_APP',
        locale: 'en',
        subjectTemplate: 'Notice: {{topic}}',
        bodyTemplate: 'Detailed content about {{topic}} for {{communityName}}.',
        variables: ['topic', 'communityName'],
        isSystem: false,
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { title, body } = service.renderTemplate(mockTemplate, {
        topic: 'Annual Maintenance',
        communityName: 'Palm Grove',
      });

      expect(title).toBe('Notice: Annual Maintenance');
      expect(body).toBe('Detailed content about Annual Maintenance for Palm Grove.');
    });
  });
});
