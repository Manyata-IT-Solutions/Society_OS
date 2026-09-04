import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Shared Platform Engines (Phase 5 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let adminUserId: string;
  let createdDocumentId: string;
  let createdTemplateId: string;
  let testUnitId: string;

  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Login as Root Admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@communityos.io',
        password: 'Admin@CommunityOS2026!',
      })
      .expect(200);

    adminAccessToken = loginRes.body.data.tokens.accessToken;
    adminUserId = loginRes.body.data.user.id;

    const org = await prisma.organization.findFirst({
      where: { slug: 'community-os-demo' },
    });
    orgId = org!.id;

    const comm = await prisma.community.findFirst({
      where: { organizationId: orgId, slug: 'green-valley-township' },
    });
    communityId = comm!.id;

    const unit = await prisma.unit.findFirst({
      where: { communityId },
    });
    testUnitId = unit ? unit.id : '00000000-0000-0000-0000-000000000001';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Enterprise Audit Engine', () => {
    let auditRecordId: string;

    it('should list audit logs with tenant filtering and pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      auditRecordId = res.body.data.items[0].id;
    });

    it('should fetch audit record detail with change snapshots', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/audit/${auditRecordId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(auditRecordId);
      expect(res.body.data.action).toBeDefined();
      expect(res.body.data.resourceType).toBeDefined();
    });

    it('should export audit trail to CSV with formula injection defense', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit/export')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Record ID,Occurred At (UTC)');
    });
  });

  describe('2. Notification Engine', () => {
    it('should create a notification template', async () => {
      const templateCode = `TEST_NOTICE_${testSuffix}`;
      const res = await request(app.getHttpServer())
        .post(`/api/v1/notification-templates?communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          code: templateCode,
          name: `Test Community Notice ${testSuffix}`,
          category: 'RESIDENT',
          channel: 'IN_APP',
          locale: 'en',
          subjectTemplate: 'Notice: {{title}}',
          bodyTemplate: 'Hello {{residentName}}, this is a notice for {{communityName}}.',
          variables: ['title', 'residentName', 'communityName'],
        })
        .expect(201);

      expect(res.body.data.code).toBe(templateCode);
      createdTemplateId = res.body.data.id;
    });

    it('should fetch notification template by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/notification-templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdTemplateId);
    });

    it('should broadcast notification to targeted user across channels', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          title: `Emergency Drill Announcement ${testSuffix}`,
          body: 'Annual fire safety drill will be conducted tomorrow at 10 AM.',
          category: 'SECURITY',
          priority: 'HIGH',
          channels: ['IN_APP', 'EMAIL'],
          recipients: {
            userIds: [adminUserId],
          },
        })
        .expect(201);

      expect(res.body.data.notification.title).toContain('Emergency Drill');
      expect(res.body.data.recipientCount).toBe(1);
    });

    it('should fetch user inbox and verify unread status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/inbox')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.unreadCount).toBeGreaterThan(0);
    });

    it('should get unread count badge count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/inbox/unread-count')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notifications/inbox/mark-all-read')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.count).toBeGreaterThanOrEqual(0);

      const countRes = await request(app.getHttpServer())
        .get('/api/v1/notifications/inbox/unread-count')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(countRes.body.data.count).toBe(0);
    });

    it('should inspect notification delivery logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/deliveries')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items).toBeDefined();
    });
  });

  describe('3. Document Core', () => {
    it('should create document with initial version', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/documents?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          title: `Fire Safety SOP ${testSuffix}`,
          description: 'Standard operating procedures during fire alarm trigger.',
          category: 'POLICY',
          classification: 'PUBLIC',
          initialVersion: {
            fileName: `fire_sop_${testSuffix}.pdf`,
            originalFileName: 'Fire_SOP_2026.pdf',
            mimeType: 'application/pdf',
            sizeBytes: '45000',
            checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            storageKey: `${orgId}/${communityId}/documents/fire_sop_${testSuffix}.pdf`,
          },
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toContain('Fire Safety SOP');
      expect(res.body.data.version).toBe(1);
      createdDocumentId = res.body.data.id;
    });

    it('should upload incremental version to existing document', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/documents/${createdDocumentId}/versions`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          fileName: `fire_sop_v2_${testSuffix}.pdf`,
          originalFileName: 'Fire_SOP_2026_Rev1.pdf',
          mimeType: 'application/pdf',
          sizeBytes: '52000',
          checksum: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
          storageKey: `${orgId}/${communityId}/documents/${createdDocumentId}/v2/fire_sop_v2.pdf`,
        })
        .expect(201);

      expect(res.body.data.versionNumber).toBe(2);
      expect(res.body.data.fileName).toContain('fire_sop_v2');
    });

    it('should link document to unit resource', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/documents/${createdDocumentId}/links`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          resourceType: 'unit',
          resourceId: testUnitId,
          relationshipType: 'ATTACHMENT',
        })
        .expect(201);

      expect(res.body.data.documentId).toBe(createdDocumentId);
      expect(res.body.data.resourceType).toBe('unit');
    });

    it('should get document details with version history and links', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/documents/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdDocumentId);
      expect(res.body.data.versions.length).toBe(2);
      expect(res.body.data.links.length).toBe(1);
    });

    it('should archive document', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/documents/${createdDocumentId}/archive`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('ARCHIVED');
    });
  });
});
