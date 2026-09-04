import * as crypto from 'node:crypto';
import { db } from './client.js';
import {
  ALL_SYSTEM_PERMISSIONS,
  SYSTEM_ROLES,
  type SystemRoleDefinition,
} from '@community-os/auth';
import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync('Admin@CommunityOS2026!', 12);

async function seed() {
  // eslint-disable-next-line no-console
  console.info('🌱 Seeding platform baseline & Phase 3 Property Master...');

  try {
    // 1. Seed System Permissions Registry
    // eslint-disable-next-line no-console
    console.info('🔑 Seeding permissions registry...');
    for (const perm of ALL_SYSTEM_PERMISSIONS) {
      await db.permission.upsert({
        where: { code: perm.code },
        update: {
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
        },
        create: {
          code: perm.code,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
        },
      });
    }

    const allDbPerms = await db.permission.findMany();
    const permMap = new Map<string, string>(allDbPerms.map((p) => [p.code, p.id]));

    // 2. Seed System Roles and Role-Permissions
    // eslint-disable-next-line no-console
    console.info('🛡️ Seeding system roles...');
    for (const roleDef of Object.values(SYSTEM_ROLES) as SystemRoleDefinition[]) {
      let role = await db.role.findFirst({
        where: { code: roleDef.code, organizationId: null },
      });

      if (role) {
        role = await db.role.update({
          where: { id: role.id },
          data: {
            name: roleDef.name,
            description: roleDef.description,
            scopeType: roleDef.scopeType,
            isSystem: true,
          },
        });
      } else {
        role = await db.role.create({
          data: {
            name: roleDef.name,
            code: roleDef.code,
            description: roleDef.description,
            scopeType: roleDef.scopeType,
            isSystem: true,
            version: 1,
          },
        });
      }

      // Clear and re-link permissions for system role
      await db.rolePermission.deleteMany({ where: { roleId: role.id } });
      const rolePermData = roleDef.permissions
        .map((pCode: string) => permMap.get(pCode))
        .filter((pId): pId is string => Boolean(pId))
        .map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
        }));

      if (rolePermData.length > 0) {
        await db.rolePermission.createMany({
          data: rolePermData,
          skipDuplicates: true,
        });
      }
    }

    // 3. Seed Organizations & Portfolios
    const org = await db.organization.upsert({
      where: { slug: 'community-os-demo' },
      update: {},
      create: {
        name: 'Community OS Demo Management Corp',
        slug: 'community-os-demo',
        legalName: 'Community OS Demo Management Corporation Inc.',
        status: 'ACTIVE',
        defaultTimezone: 'Asia/Kolkata',
        defaultLocale: 'en-IN',
        defaultCurrency: 'INR',
        version: 1,
        settings: {
          supportEmail: 'support@communityos-demo.com',
          portalTheme: 'default',
        },
      },
    });

    const portfolio = await db.portfolio.upsert({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: 'south-india-residential',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        name: 'South India Residential Portfolio',
        code: 'SIRP-01',
        slug: 'south-india-residential',
        description: 'Premium residential properties in Bengaluru and Hyderabad',
        status: 'ACTIVE',
        version: 1,
      },
    });

    const community1 = await db.community.upsert({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: 'green-valley-township',
        },
      },
      update: {
        portfolioId: portfolio.id,
      },
      create: {
        organizationId: org.id,
        portfolioId: portfolio.id,
        name: 'Green Valley Township',
        code: 'GVT-01',
        slug: 'green-valley-township',
        status: 'ACTIVE',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        currency: 'INR',
        addressLine1: 'Survey No. 45/2, Sarjapur Main Road',
        addressLine2: 'Near Wipro Corporate Campus',
        locality: 'Sarjapur',
        city: 'Bengaluru',
        region: 'Karnataka',
        postalCode: '560035',
        countryCode: 'IN',
        version: 1,
        settings: {
          visitorPreApprovalRequired: true,
          gateCount: 4,
        },
      },
    });

    const _community2 = await db.community.upsert({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: 'palm-heights-residences',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        name: 'Palm Heights Residences',
        code: 'PHR-02',
        slug: 'palm-heights-residences',
        status: 'ACTIVE',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        currency: 'INR',
        addressLine1: 'Plot 18, Financial District',
        locality: 'Gachibowli',
        city: 'Hyderabad',
        region: 'Telangana',
        postalCode: '500032',
        countryCode: 'IN',
        version: 1,
        settings: {
          visitorPreApprovalRequired: false,
          gateCount: 2,
        },
      },
    });

    // 4. Seed Property Hierarchy (Sections, Buildings, Floors, Units)
    // Section (Phase 1)
    const section1 = await db.communitySection.upsert({
      where: {
        communityId_slug: {
          communityId: community1.id,
          slug: 'phase-1-lakeview',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        name: 'Phase 1 - Lakeview Sector',
        code: 'SEC-P1',
        slug: 'phase-1-lakeview',
        description: 'Lakeview residential tower zone and club facility',
        status: 'ACTIVE',
        sortOrder: 1,
        version: 1,
      },
    });

    // Building: Tower A
    const towerA = await db.building.upsert({
      where: {
        communityId_code: {
          communityId: community1.id,
          code: 'TWR-A',
        },
      },
      update: {
        sectionId: section1.id,
      },
      create: {
        organizationId: org.id,
        communityId: community1.id,
        sectionId: section1.id,
        name: 'Tower A - Alpine',
        code: 'TWR-A',
        buildingType: 'TOWER',
        status: 'ACTIVE',
        numberOfFloors: 14,
        sortOrder: 1,
        version: 1,
      },
    });

    // Building: Tower B
    const towerB = await db.building.upsert({
      where: {
        communityId_code: {
          communityId: community1.id,
          code: 'TWR-B',
        },
      },
      update: {
        sectionId: section1.id,
      },
      create: {
        organizationId: org.id,
        communityId: community1.id,
        sectionId: section1.id,
        name: 'Tower B - Birch',
        code: 'TWR-B',
        buildingType: 'TOWER',
        status: 'ACTIVE',
        numberOfFloors: 14,
        sortOrder: 2,
        version: 1,
      },
    });

    // Floors for Tower A
    const _floorG = await db.floor.upsert({
      where: {
        buildingId_label: {
          buildingId: towerA.id,
          label: 'G',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        buildingId: towerA.id,
        label: 'G',
        levelNumber: 0,
        sortOrder: 0,
        status: 'ACTIVE',
        version: 1,
      },
    });

    const floor1 = await db.floor.upsert({
      where: {
        buildingId_label: {
          buildingId: towerA.id,
          label: '1',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        buildingId: towerA.id,
        label: '1',
        levelNumber: 1,
        sortOrder: 1,
        status: 'ACTIVE',
        version: 1,
      },
    });

    // Units on Floor 1 of Tower A
    const unit101 = await db.unit.upsert({
      where: {
        communityId_buildingId_unitNumber: {
          communityId: community1.id,
          buildingId: towerA.id,
          unitNumber: '101',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        sectionId: section1.id,
        buildingId: towerA.id,
        floorId: floor1.id,
        unitNumber: '101',
        displayName: 'Tower A - Unit 101 (3BHK)',
        unitType: 'APARTMENT',
        status: 'ACTIVE',
        carpetArea: 1450.5,
        builtUpArea: 1720.0,
        superBuiltUpArea: 1980.0,
        areaUnit: 'SQFT',
        bedroomCount: 3,
        bathroomCount: 3,
        version: 1,
      },
    });

    const unit102 = await db.unit.upsert({
      where: {
        communityId_buildingId_unitNumber: {
          communityId: community1.id,
          buildingId: towerA.id,
          unitNumber: '102',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        sectionId: section1.id,
        buildingId: towerA.id,
        floorId: floor1.id,
        unitNumber: '102',
        displayName: 'Tower A - Unit 102 (2BHK)',
        unitType: 'APARTMENT',
        status: 'ACTIVE',
        carpetArea: 1120.0,
        builtUpArea: 1340.0,
        superBuiltUpArea: 1520.0,
        areaUnit: 'SQFT',
        bedroomCount: 2,
        bathroomCount: 2,
        version: 1,
      },
    });

    // Direct Villa Unit (No Building, directly under Community Section)
    const villa01 = await db.unit
      .upsert({
        where: {
          communityId_buildingId_unitNumber: {
            communityId: community1.id,
            buildingId: towerA.id, // using null if allowed or direct
            unitNumber: 'VILLA-01',
          },
        },
        update: {},
        create: {
          organizationId: org.id,
          communityId: community1.id,
          sectionId: section1.id,
          buildingId: null,
          floorId: null,
          unitNumber: 'VILLA-01',
          displayName: 'Lakeview Luxury Villa 01',
          unitType: 'VILLA',
          status: 'ACTIVE',
          carpetArea: 3200.0,
          builtUpArea: 3850.0,
          superBuiltUpArea: 4400.0,
          areaUnit: 'SQFT',
          bedroomCount: 4,
          bathroomCount: 5,
          version: 1,
        },
      })
      .catch(async () => {
        // If composite key has null buildingId, find or create directly
        const existing = await db.unit.findFirst({
          where: { communityId: community1.id, unitNumber: 'VILLA-01' },
        });
        if (!existing) {
          return db.unit.create({
            data: {
              organizationId: org.id,
              communityId: community1.id,
              sectionId: section1.id,
              buildingId: null,
              floorId: null,
              unitNumber: 'VILLA-01',
              displayName: 'Lakeview Luxury Villa 01',
              unitType: 'VILLA',
              status: 'ACTIVE',
              carpetArea: 3200.0,
              builtUpArea: 3850.0,
              superBuiltUpArea: 4400.0,
              areaUnit: 'SQFT',
              bedroomCount: 4,
              bathroomCount: 5,
              version: 1,
            },
          });
        }
        return existing;
      });

    // 5. Seed Root Platform Admin User
    const platformAdminRole = await db.role.findFirst({
      where: { code: 'PLATFORM_ADMIN', organizationId: null },
    });
    const orgAdminRole = await db.role.findFirst({
      where: { code: 'ORG_ADMIN', organizationId: null },
    });

    const adminUser = await db.user.upsert({
      where: { email: 'admin@communityos.io' },
      update: {
        passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
        status: 'ACTIVE',
      },
      create: {
        email: 'admin@communityos.io',
        phone: '+18005550199',
        displayName: 'Platform Admin',
        passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
        status: 'ACTIVE',
        preferredLocale: 'en-US',
        timezone: 'UTC',
        version: 1,
      },
    });

    // Root Platform Admin Role Assignment (PLATFORM scope)
    if (platformAdminRole) {
      const existingAssignment = await db.roleAssignment.findFirst({
        where: {
          userId: adminUser.id,
          roleId: platformAdminRole.id,
          scopeType: 'PLATFORM',
        },
      });

      if (!existingAssignment) {
        await db.roleAssignment.create({
          data: {
            userId: adminUser.id,
            roleId: platformAdminRole.id,
            scopeType: 'PLATFORM',
            status: 'ACTIVE',
          },
        });
      }
    }

    // 6. Seed Organization Admin User
    const orgAdminUser = await db.user.upsert({
      where: { email: 'orgadmin@communityos.io' },
      update: {
        passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
        status: 'ACTIVE',
      },
      create: {
        email: 'orgadmin@communityos.io',
        phone: '+919876543210',
        displayName: 'Demo Org Administrator',
        passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
        status: 'ACTIVE',
        preferredLocale: 'en-IN',
        timezone: 'Asia/Kolkata',
        version: 1,
      },
    });

    // Organization Membership & Scoped Role Assignment
    const existingMembership = await db.tenantMembership.findFirst({
      where: {
        userId: orgAdminUser.id,
        organizationId: org.id,
        communityId: null,
      },
    });

    if (!existingMembership) {
      await db.tenantMembership.create({
        data: {
          userId: orgAdminUser.id,
          organizationId: org.id,
          communityId: null,
          status: 'ACTIVE',
        },
      });
    }

    if (orgAdminRole) {
      const existingOrgAssignment = await db.roleAssignment.findFirst({
        where: {
          userId: orgAdminUser.id,
          roleId: orgAdminRole.id,
          scopeType: 'ORGANIZATION',
          scopeId: org.id,
        },
      });

      if (!existingOrgAssignment) {
        await db.roleAssignment.create({
          data: {
            userId: orgAdminUser.id,
            roleId: orgAdminRole.id,
            scopeType: 'ORGANIZATION',
            scopeId: org.id,
            status: 'ACTIVE',
          },
        });
      }
    }

    // 9. Phase 4: Seed Residents, Households, Ownerships, Tenancies, Occupancies
    // eslint-disable-next-line no-console
    console.info('👥 Seeding Phase 4 Residents & Households...');

    // Resident 1: John Doe (Owner-Occupant of Unit 101)
    let johnResident = await db.resident.findFirst({
      where: { communityId: community1.id, email: 'john.doe@example.com' },
    });
    if (!johnResident) {
      johnResident = await db.resident.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+12025550101',
          gender: 'MALE',
          status: 'ACTIVE',
          version: 1,
        },
      });
    }

    // Resident 2: Jane Doe (Spouse of John Doe)
    let janeResident = await db.resident.findFirst({
      where: { communityId: community1.id, email: 'jane.doe@example.com' },
    });
    if (!janeResident) {
      janeResident = await db.resident.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          firstName: 'Jane',
          lastName: 'Doe',
          displayName: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '+12025550102',
          gender: 'FEMALE',
          status: 'ACTIVE',
          version: 1,
        },
      });
    }

    // Resident 3: Alice Smith (Tenant of Unit 102)
    let aliceResident = await db.resident.findFirst({
      where: { communityId: community1.id, email: 'alice.smith@example.com' },
    });
    if (!aliceResident) {
      aliceResident = await db.resident.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          firstName: 'Alice',
          lastName: 'Smith',
          displayName: 'Alice Smith',
          email: 'alice.smith@example.com',
          phone: '+12025550103',
          gender: 'FEMALE',
          status: 'ACTIVE',
          version: 1,
        },
      });
    }

    // Seed Ownership for Unit 101 (Sole Owner: John Doe)
    const existingOwnership101 = await db.unitOwnership.findFirst({
      where: { unitId: unit101.id, residentId: johnResident.id },
    });
    if (!existingOwnership101) {
      await db.unitOwnership.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          unitId: unit101.id,
          residentId: johnResident.id,
          ownershipType: 'SOLE',
          ownershipShare: 100.0,
          isPrimaryOwner: true,
          startDate: new Date('2024-01-01'),
          status: 'ACTIVE',
          version: 1,
        },
      });
    }

    // Seed Household for Unit 101 (Doe Family)
    let doeHousehold = await db.household.findFirst({
      where: { unitId: unit101.id, status: 'ACTIVE' },
    });
    if (!doeHousehold) {
      doeHousehold = await db.household.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          unitId: unit101.id,
          name: 'Doe Household',
          primaryContactResidentId: johnResident.id,
          startDate: new Date('2024-01-01'),
          status: 'ACTIVE',
          version: 1,
        },
      });

      // Add John Doe (Primary)
      await db.householdMember.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          householdId: doeHousehold.id,
          residentId: johnResident.id,
          relationshipType: 'SELF',
          isPrimaryContact: true,
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-01'),
          version: 1,
        },
      });

      // Add Jane Doe (Spouse)
      await db.householdMember.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          householdId: doeHousehold.id,
          residentId: janeResident.id,
          relationshipType: 'SPOUSE',
          isPrimaryContact: false,
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-01'),
          version: 1,
        },
      });

      // Add Occupancy for Unit 101
      await db.unitOccupancy.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          unitId: unit101.id,
          householdId: doeHousehold.id,
          occupancyType: 'OWNER_OCCUPIED',
          startDate: new Date('2024-01-01'),
          status: 'ACTIVE',
          version: 1,
        },
      });
    }

    // Seed Tenancy & Tenant Occupancy for Unit 102 (Alice Smith)
    let aliceHousehold = await db.household.findFirst({
      where: { unitId: unit102.id, status: 'ACTIVE' },
    });
    if (!aliceHousehold) {
      aliceHousehold = await db.household.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          unitId: unit102.id,
          name: 'Smith Rental Household',
          primaryContactResidentId: aliceResident.id,
          startDate: new Date('2024-06-01'),
          status: 'ACTIVE',
          version: 1,
        },
      });

      await db.householdMember.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          householdId: aliceHousehold.id,
          residentId: aliceResident.id,
          relationshipType: 'SELF',
          isPrimaryContact: true,
          status: 'ACTIVE',
          joinedAt: new Date('2024-06-01'),
          version: 1,
        },
      });

      await db.unitTenancy.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          unitId: unit102.id,
          householdId: aliceHousehold.id,
          startDate: new Date('2024-06-01'),
          endDate: new Date('2026-05-31'),
          status: 'ACTIVE',
          agreementReference: 'LEASE-2024-A102',
          version: 1,
        },
      });

      await db.unitOccupancy.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          unitId: unit102.id,
          householdId: aliceHousehold.id,
          occupancyType: 'TENANT_OCCUPIED',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2026-05-31'),
          status: 'ACTIVE',
          version: 1,
        },
      });
    }

    // 8. Phase 5 Seed: Notification Templates
    // eslint-disable-next-line no-console
    console.info('📬 Seeding notification templates...');
    await db.notificationTemplate.upsert({
      where: {
        communityId_code_channel_locale: {
          communityId: community1.id,
          code: 'RESIDENT_INVITATION',
          channel: 'IN_APP',
          locale: 'en',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'RESIDENT_INVITATION',
        name: 'Resident Portal Invitation',
        category: 'ACCOUNT',
        channel: 'IN_APP',
        locale: 'en',
        subjectTemplate: 'Welcome to {{communityName}} - Activate Your Account',
        bodyTemplate:
          'Hello {{residentName}},\n\nYou have been registered as a resident in {{communityName}} (Unit: {{unitName}}).\nPlease access your community dashboard to view notices and community updates.',
        variables: ['residentName', 'communityName', 'unitName', 'invitationLink'],
        isSystem: true,
        isActive: true,
        version: 1,
      },
    });

    await db.notificationTemplate.upsert({
      where: {
        communityId_code_channel_locale: {
          communityId: community1.id,
          code: 'MOVE_IN_CONFIRMATION',
          channel: 'IN_APP',
          locale: 'en',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'MOVE_IN_CONFIRMATION',
        name: 'Move-In Confirmation',
        category: 'RESIDENT',
        channel: 'IN_APP',
        locale: 'en',
        subjectTemplate: 'Move-In Confirmed for Unit {{unitNumber}}',
        bodyTemplate:
          'Dear {{residentName}},\n\nYour move-in for Unit {{unitNumber}} in {{communityName}} has been officially confirmed effective {{effectiveDate}}.\nWelcome to the community!',
        variables: ['residentName', 'communityName', 'unitNumber', 'effectiveDate'],
        isSystem: true,
        isActive: true,
        version: 1,
      },
    });

    await db.notificationTemplate.upsert({
      where: {
        communityId_code_channel_locale: {
          communityId: community1.id,
          code: 'DOCUMENT_SHARED',
          channel: 'IN_APP',
          locale: 'en',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'DOCUMENT_SHARED',
        name: 'New Document Published',
        category: 'GOVERNANCE',
        channel: 'IN_APP',
        locale: 'en',
        subjectTemplate: 'New Document: {{documentTitle}}',
        bodyTemplate:
          'A new document "{{documentTitle}}" has been published in category {{documentCategory}} for {{communityName}}.',
        variables: ['documentTitle', 'documentCategory', 'communityName', 'documentUrl'],
        isSystem: true,
        isActive: true,
        version: 1,
      },
    });

    // 9. Phase 5 Seed: Documents & Versions
    // eslint-disable-next-line no-console
    console.info('📄 Seeding documents & version repository...');
    let bylawsDoc = await db.document.findFirst({
      where: { communityId: community1.id, title: 'Community Bylaws & Resident Handbook 2026' },
    });

    if (!bylawsDoc) {
      bylawsDoc = await db.document.create({
        data: {
          organizationId: org.id,
          communityId: community1.id,
          title: 'Community Bylaws & Resident Handbook 2026',
          description:
            'Official society rules, parking regulations, and community code of conduct.',
          category: 'POLICY',
          classification: 'PUBLIC',
          status: 'ACTIVE',
          createdById: adminUser.id,
          version: 1,
        },
      });

      const v1 = await db.documentVersion.create({
        data: {
          documentId: bylawsDoc.id,
          versionNumber: 1,
          storageKey: `${org.id}/${community1.id}/documents/${bylawsDoc.id}/v1/bylaws-2026-v1.pdf`,
          fileName: 'bylaws-2026-v1.pdf',
          originalFileName: 'GreenValley_Bylaws_2026.pdf',
          mimeType: 'application/pdf',
          sizeBytes: BigInt(245800),
          checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          status: 'ACTIVE',
          uploadedById: adminUser.id,
        },
      });

      await db.document.update({
        where: { id: bylawsDoc.id },
        data: { currentVersionId: v1.id },
      });
    }

    // 10. Phase 5 Seed: Audit Records
    // eslint-disable-next-line no-console
    console.info('🔍 Seeding audit trail baseline...');
    const auditCount = await db.auditRecord.count();
    if (auditCount === 0) {
      await db.auditRecord.createMany({
        data: [
          {
            organizationId: org.id,
            communityId: null,
            actorType: 'USER',
            actorId: adminUser.id,
            action: 'organization.create',
            resourceType: 'organization',
            resourceId: org.id,
            resourceScope: 'ORGANIZATION',
            result: 'SUCCESS',
            source: 'seed',
            metadata: { name: org.name, slug: org.slug },
            classification: 'INTERNAL',
            retentionCategory: 'GOVERNANCE',
          },
          {
            organizationId: org.id,
            communityId: community1.id,
            actorType: 'USER',
            actorId: adminUser.id,
            action: 'community.create',
            resourceType: 'community',
            resourceId: community1.id,
            resourceScope: 'COMMUNITY',
            result: 'SUCCESS',
            source: 'seed',
            metadata: { name: community1.name, code: community1.code },
            classification: 'INTERNAL',
            retentionCategory: 'GOVERNANCE',
          },
          {
            organizationId: org.id,
            communityId: community1.id,
            actorType: 'USER',
            actorId: adminUser.id,
            action: 'occupancy.move_in',
            resourceType: 'occupancy',
            resourceId: unit101.id,
            resourceScope: 'COMMUNITY',
            result: 'SUCCESS',
            source: 'seed',
            metadata: { unitNumber: unit101.unitNumber, occupant: 'John Doe' },
            classification: 'INTERNAL',
            retentionCategory: 'OPERATIONAL',
          },
        ],
      });
    }

    // ---------------------------------------------------------------------------
    // Phase 6: Seed Configuration Overrides, Custom Fields & Feature Flags
    // ---------------------------------------------------------------------------
    await db.configurationOverride.upsert({
      where: {
        key_scopeType_scopeId: {
          key: 'community.display.buildingLabel',
          scopeType: 'COMMUNITY',
          scopeId: community1.id,
        },
      },
      update: {},
      create: {
        key: 'community.display.buildingLabel',
        scopeType: 'COMMUNITY',
        scopeId: community1.id,
        organizationId: org.id,
        communityId: community1.id,
        value: 'Tower',
        version: 1,
        status: 'ACTIVE',
        changeReason: 'Initial community setup',
        createdById: adminUser.id,
      },
    });

    const unitHandoverField = await db.customFieldDefinition.upsert({
      where: {
        organizationId_communityId_entityType_key: {
          organizationId: org.id,
          communityId: community1.id,
          entityType: 'UNIT',
          key: 'handoverDate',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        entityType: 'UNIT',
        key: 'handoverDate',
        label: 'Handover Date',
        description: 'Physical possession / keys handover date for this unit',
        fieldType: 'DATE',
        required: false,
        searchable: true,
        filterable: true,
        status: 'ACTIVE',
        visibility: 'TENANT_INTERNAL',
        displayOrder: 1,
        createdById: adminUser.id,
      },
    });

    const residentBloodGroupField = await db.customFieldDefinition.upsert({
      where: {
        organizationId_communityId_entityType_key: {
          organizationId: org.id,
          communityId: community1.id,
          entityType: 'RESIDENT',
          key: 'bloodGroup',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        entityType: 'RESIDENT',
        key: 'bloodGroup',
        label: 'Blood Group',
        description: 'Emergency blood group for medical response',
        fieldType: 'SELECT',
        required: false,
        searchable: false,
        filterable: true,
        status: 'ACTIVE',
        visibility: 'TENANT_INTERNAL',
        options: [
          { key: 'A_POS', label: 'A+', isActive: true },
          { key: 'A_NEG', label: 'A-', isActive: true },
          { key: 'B_POS', label: 'B+', isActive: true },
          { key: 'B_NEG', label: 'B-', isActive: true },
          { key: 'O_POS', label: 'O+', isActive: true },
          { key: 'O_NEG', label: 'O-', isActive: true },
          { key: 'AB_POS', label: 'AB+', isActive: true },
          { key: 'AB_NEG', label: 'AB-', isActive: true },
        ],
        displayOrder: 2,
        createdById: adminUser.id,
      },
    });

    // Populate sample custom field value on unit101
    await db.customFieldValue.upsert({
      where: {
        definitionId_entityId: {
          definitionId: unitHandoverField.id,
          entityId: unit101.id,
        },
      },
      update: {},
      create: {
        definitionId: unitHandoverField.id,
        organizationId: org.id,
        communityId: community1.id,
        entityType: 'UNIT',
        entityId: unit101.id,
        value: '2026-01-15T00:00:00.000Z',
        createdById: adminUser.id,
      },
    });

    // Populate sample custom field value on johnResident
    await db.customFieldValue.upsert({
      where: {
        definitionId_entityId: {
          definitionId: residentBloodGroupField.id,
          entityId: johnResident.id,
        },
      },
      update: {},
      create: {
        definitionId: residentBloodGroupField.id,
        organizationId: org.id,
        communityId: community1.id,
        entityType: 'RESIDENT',
        entityId: johnResident.id,
        value: 'O_POS',
        createdById: adminUser.id,
      },
    });

    // =========================================================================
    // PHASE 7 SEED: WORKFLOW, RULES, APPROVAL, SLA, CALENDAR
    // =========================================================================

    // 1. Business Calendar
    const defaultCalendar = await db.businessCalendar.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'calendar.standard',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        key: 'calendar.standard',
        name: 'Standard Working Calendar',
        description: 'Standard Monday-Friday 9AM-5PM working calendar',
        timezone: 'UTC',
        workingDays: [1, 2, 3, 4, 5],
        workingHours: { start: '09:00', end: '17:00' },
        holidays: ['2026-01-01', '2026-12-25'],
        exceptions: [],
        isDefault: true,
        createdById: adminUser.id,
      },
    });

    // 2. SLA Policy
    const _standardSla = await db.slaPolicyDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'sla.review.standard',
          version: 1,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        key: 'sla.review.standard',
        name: 'Standard Review SLA',
        description: '24-hour review SLA policy for requests',
        version: 1,
        status: 'PUBLISHED',
        metricType: 'TIME_TO_RESOLUTION',
        durationMinutes: 1440, // 24 hours
        useBusinessHours: true,
        calendarId: defaultCalendar.id,
        warningThresholdPercent: 80,
        startTriggerState: 'IN_REVIEW',
        pauseStates: ['WAITING_INFO'],
        stopStates: ['COMPLETED', 'REJECTED'],
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    // 3. Rule Definition
    const _amountGuardRule = await db.ruleDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'rule.amount.standard_guard',
          version: 1,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        key: 'rule.amount.standard_guard',
        name: 'Standard Amount Threshold Guard',
        description: 'Verifies item amount is within standard limit <= 50,000',
        version: 1,
        status: 'PUBLISHED',
        resourceType: 'TEST_RESOURCE',
        inputSchema: {
          'resource.amount': { type: 'NUMBER', required: true },
        },
        conditionTree: {
          simple: {
            field: 'resource.amount',
            operator: 'LESS_THAN_OR_EQUAL',
            value: 50000,
          },
        },
        outputEffect: { maxThresholdApproved: true },
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    // 4. Approval Policy Definition
    const _standardApprovalPolicy = await db.approvalPolicyDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'approval.standard_single_step',
          version: 1,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        key: 'approval.standard_single_step',
        name: 'Standard Community Single-Step Approval',
        description: 'Single-step manager approval with maker-checker protection',
        version: 1,
        status: 'PUBLISHED',
        steps: [
          {
            order: 1,
            name: 'Manager Review & Approval',
            approverType: 'ROLE',
            approverValue: 'COMMUNITY_ADMIN',
            quorumMode: 'ANY_ONE',
            minCount: 1,
            allowSelfApproval: false,
            rejectionBehavior: 'RETURN_TO_PREVIOUS_STATE',
            slaPolicyKey: 'sla.review.standard',
          },
        ],
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    // 5. Workflow Definition
    await db.workflowDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'workflow.test_resource.review',
          version: 1,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        key: 'workflow.test_resource.review',
        name: 'Standard Item Review & Approval Workflow',
        description: 'Standard end-to-end review lifecycle with rule guards and approval steps',
        version: 1,
        status: 'PUBLISHED',
        entityType: 'TEST_RESOURCE',
        initialStateKey: 'DRAFT',
        states: [
          { key: 'DRAFT', label: 'Draft', type: 'START', isTerminal: false, displayOrder: 1 },
          {
            key: 'IN_REVIEW',
            label: 'In Review',
            type: 'ACTIVE',
            isTerminal: false,
            displayOrder: 2,
          },
          {
            key: 'PENDING_APPROVAL',
            label: 'Pending Approval',
            type: 'APPROVAL',
            isTerminal: false,
            displayOrder: 3,
          },
          {
            key: 'APPROVED',
            label: 'Approved',
            type: 'ACTIVE',
            isTerminal: false,
            displayOrder: 4,
          },
          {
            key: 'COMPLETED',
            label: 'Completed',
            type: 'COMPLETED',
            isTerminal: true,
            displayOrder: 5,
          },
          {
            key: 'REJECTED',
            label: 'Rejected',
            type: 'CANCELLED',
            isTerminal: true,
            displayOrder: 6,
          },
        ],
        transitions: [
          {
            key: 'tr_submit',
            fromState: 'DRAFT',
            toState: 'IN_REVIEW',
            action: 'submit',
            actionLabel: 'Submit for Review',
            guardRuleKey: 'rule.amount.standard_guard',
            guardRuleVersion: 1,
            sideEffects: [{ type: 'START_SLA', targetKey: 'sla.review.standard' }],
          },
          {
            key: 'tr_request_approval',
            fromState: 'IN_REVIEW',
            toState: 'PENDING_APPROVAL',
            action: 'request_approval',
            actionLabel: 'Request Approval',
            approvalPolicyKey: 'approval.standard_single_step',
            approvalPolicyVersion: 1,
            sideEffects: [{ type: 'START_APPROVAL', targetKey: 'approval.standard_single_step' }],
          },
          {
            key: 'tr_approve',
            fromState: 'PENDING_APPROVAL',
            toState: 'APPROVED',
            action: 'approve',
            actionLabel: 'Approve',
            requiredPermission: 'approval.decision',
          },
          {
            key: 'tr_reject',
            fromState: 'PENDING_APPROVAL',
            toState: 'IN_REVIEW',
            action: 'reject',
            actionLabel: 'Send Back for Changes',
            reasonRequired: true,
          },
          {
            key: 'tr_complete',
            fromState: 'APPROVED',
            toState: 'COMPLETED',
            action: 'complete',
            actionLabel: 'Mark Completed',
            sideEffects: [{ type: 'COMPLETE_SLA', targetKey: 'sla.review.standard' }],
          },
        ],
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    // 12. Seed Phase 8 Helpdesk Workflows, SLAs, Teams & Categories
    // eslint-disable-next-line no-console
    console.info('🎫 Seeding Phase 8 Helpdesk platform automation...');

    // 12.1 Standard Helpdesk SLA Policies
    const standardTicketSla = await db.slaPolicyDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'sla.ticket.resolution.standard',
          version: 1,
        },
      },
      update: {},
      create: {
        key: 'sla.ticket.resolution.standard',
        name: 'Standard Ticket Resolution (24h)',
        description: 'Standard helpdesk resolution policy within 24 business working hours',
        version: 1,
        scopeType: 'COMMUNITY',
        organizationId: org.id,
        communityId: community1.id,
        status: 'PUBLISHED',
        metricType: 'TIME_TO_RESOLUTION',
        durationMinutes: 1440,
        useBusinessHours: true,
        calendarId: defaultCalendar.id,
        warningThresholdPercent: 80,
        pauseStates: ['WAITING_FOR_RESIDENT', 'WAITING_FOR_VENDOR'],
        stopStates: ['RESOLVED', 'CLOSED', 'CANCELLED'],
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    const emergencyTicketSla = await db.slaPolicyDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'sla.ticket.emergency',
          version: 1,
        },
      },
      update: {},
      create: {
        key: 'sla.ticket.emergency',
        name: 'Emergency Ticket Resolution (2h)',
        description: 'High-urgency emergency ticket resolution within 2 hours (24x7)',
        version: 1,
        scopeType: 'COMMUNITY',
        organizationId: org.id,
        communityId: community1.id,
        status: 'PUBLISHED',
        metricType: 'TIME_TO_RESOLUTION',
        durationMinutes: 120,
        useBusinessHours: false,
        warningThresholdPercent: 75,
        stopStates: ['RESOLVED', 'CLOSED', 'CANCELLED'],
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    // 12.2 Standard Helpdesk Workflow Definition
    const ticketWorkflow = await db.workflowDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'workflow.ticket.standard',
          version: 1,
        },
      },
      update: {},
      create: {
        key: 'workflow.ticket.standard',
        name: 'Standard Helpdesk Ticket Lifecycle',
        description:
          'Standard 10-state helpdesk ticket workflow with SLA integration and pause/resume triggers',
        version: 1,
        scopeType: 'COMMUNITY',
        organizationId: org.id,
        communityId: community1.id,
        status: 'PUBLISHED',
        entityType: 'TICKET',
        initialStateKey: 'NEW',
        states: [
          { key: 'NEW', label: 'New', type: 'START', isInitial: true, displayOrder: 1 },
          { key: 'TRIAGED', label: 'Triaged', type: 'ACTIVE', displayOrder: 2 },
          { key: 'ASSIGNED', label: 'Assigned', type: 'ACTIVE', displayOrder: 3 },
          { key: 'IN_PROGRESS', label: 'In Progress', type: 'ACTIVE', displayOrder: 4 },
          {
            key: 'WAITING_FOR_RESIDENT',
            label: 'Waiting for Resident',
            type: 'WAITING',
            displayOrder: 5,
          },
          {
            key: 'WAITING_FOR_VENDOR',
            label: 'Waiting for Vendor',
            type: 'WAITING',
            displayOrder: 6,
          },
          { key: 'RESOLVED', label: 'Resolved', type: 'ACTIVE', displayOrder: 7 },
          { key: 'CLOSED', label: 'Closed', type: 'COMPLETED', isTerminal: true, displayOrder: 8 },
          { key: 'REOPENED', label: 'Reopened', type: 'ACTIVE', displayOrder: 9 },
          {
            key: 'CANCELLED',
            label: 'Cancelled',
            type: 'CANCELLED',
            isTerminal: true,
            displayOrder: 10,
          },
        ],
        transitions: [
          {
            key: 'tr_triage',
            fromState: 'NEW',
            toState: 'TRIAGED',
            action: 'triage',
            actionLabel: 'Triage Ticket',
          },
          {
            key: 'tr_assign_new',
            fromState: 'NEW',
            toState: 'ASSIGNED',
            action: 'assign',
            actionLabel: 'Assign to Team/Technician',
          },
          {
            key: 'tr_assign_triaged',
            fromState: 'TRIAGED',
            toState: 'ASSIGNED',
            action: 'assign',
            actionLabel: 'Assign to Team/Technician',
          },
          {
            key: 'tr_start_work',
            fromState: 'ASSIGNED',
            toState: 'IN_PROGRESS',
            action: 'start_work',
            actionLabel: 'Start Work',
          },
          {
            key: 'tr_request_info',
            fromState: 'IN_PROGRESS',
            toState: 'WAITING_FOR_RESIDENT',
            action: 'request_info',
            actionLabel: 'Request Info from Resident',
            sideEffects: [{ type: 'PAUSE_SLA', targetKey: 'sla.ticket.resolution.standard' }],
          },
          {
            key: 'tr_receive_info',
            fromState: 'WAITING_FOR_RESIDENT',
            toState: 'IN_PROGRESS',
            action: 'resume_work',
            actionLabel: 'Resume Work',
            sideEffects: [{ type: 'RESUME_SLA', targetKey: 'sla.ticket.resolution.standard' }],
          },
          {
            key: 'tr_escalate_vendor',
            fromState: 'IN_PROGRESS',
            toState: 'WAITING_FOR_VENDOR',
            action: 'escalate_vendor',
            actionLabel: 'Escalate to Vendor',
          },
          {
            key: 'tr_resume_from_vendor',
            fromState: 'WAITING_FOR_VENDOR',
            toState: 'IN_PROGRESS',
            action: 'resume_work',
            actionLabel: 'Resume Work',
          },
          {
            key: 'tr_resolve',
            fromState: 'IN_PROGRESS',
            toState: 'RESOLVED',
            action: 'resolve',
            actionLabel: 'Mark as Resolved',
            sideEffects: [{ type: 'COMPLETE_SLA', targetKey: 'sla.ticket.resolution.standard' }],
          },
          {
            key: 'tr_resolve_from_assigned',
            fromState: 'ASSIGNED',
            toState: 'RESOLVED',
            action: 'resolve',
            actionLabel: 'Mark as Resolved',
            sideEffects: [{ type: 'COMPLETE_SLA', targetKey: 'sla.ticket.resolution.standard' }],
          },
          {
            key: 'tr_close',
            fromState: 'RESOLVED',
            toState: 'CLOSED',
            action: 'close',
            actionLabel: 'Close Ticket',
          },
          {
            key: 'tr_reopen',
            fromState: 'RESOLVED',
            toState: 'REOPENED',
            action: 'reopen',
            actionLabel: 'Reopen Complaint',
            sideEffects: [{ type: 'START_SLA', targetKey: 'sla.ticket.resolution.standard' }],
          },
          {
            key: 'tr_reopen_resume',
            fromState: 'REOPENED',
            toState: 'IN_PROGRESS',
            action: 'start_work',
            actionLabel: 'Resume Work',
          },
          {
            key: 'tr_cancel_new',
            fromState: 'NEW',
            toState: 'CANCELLED',
            action: 'cancel',
            actionLabel: 'Cancel Ticket',
            sideEffects: [{ type: 'COMPLETE_SLA', targetKey: 'sla.ticket.resolution.standard' }],
          },
          {
            key: 'tr_cancel_triaged',
            fromState: 'TRIAGED',
            toState: 'CANCELLED',
            action: 'cancel',
            actionLabel: 'Cancel Ticket',
            sideEffects: [{ type: 'COMPLETE_SLA', targetKey: 'sla.ticket.resolution.standard' }],
          },
        ],
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    // 12.3 Helpdesk Operational Teams
    const facilityDeskTeam = await db.helpdeskTeam.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'team.facility_desk',
        },
      },
      update: {},
      create: {
        key: 'team.facility_desk',
        name: 'Facility Helpdesk',
        description: 'General support desk for triaging and facility concerns',
        status: 'ACTIVE',
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    const electricalTeam = await db.helpdeskTeam.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'team.electrical',
        },
      },
      update: {},
      create: {
        key: 'team.electrical',
        name: 'Electrical Maintenance Team',
        description: 'Specialist electricians for common-area and unit electrical maintenance',
        status: 'ACTIVE',
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    const plumbingTeam = await db.helpdeskTeam.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'team.plumbing',
        },
      },
      update: {},
      create: {
        key: 'team.plumbing',
        name: 'Plumbing Maintenance Team',
        description: 'Plumbers handling water supply, leakages, and sanitary maintenance',
        status: 'ACTIVE',
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    // Link team members
    await db.helpdeskTeamMember.upsert({
      where: { teamId_userId: { teamId: facilityDeskTeam.id, userId: orgAdminUser.id } },
      update: { isActive: true },
      create: {
        teamId: facilityDeskTeam.id,
        userId: orgAdminUser.id,
        roleInTeam: 'LEAD',
        isActive: true,
      },
    });
    await db.helpdeskTeamMember.upsert({
      where: { teamId_userId: { teamId: electricalTeam.id, userId: adminUser.id } },
      update: { isActive: true },
      create: {
        teamId: electricalTeam.id,
        userId: adminUser.id,
        roleInTeam: 'TECHNICIAN',
        isActive: true,
      },
    });
    await db.helpdeskTeamMember.upsert({
      where: { teamId_userId: { teamId: plumbingTeam.id, userId: adminUser.id } },
      update: { isActive: true },
      create: {
        teamId: plumbingTeam.id,
        userId: adminUser.id,
        roleInTeam: 'TECHNICIAN',
        isActive: true,
      },
    });

    // 12.4 Helpdesk Ticket Categories & Subcategories
    const electricalCat = await db.ticketCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'cat.electrical',
        },
      },
      update: {},
      create: {
        key: 'cat.electrical',
        name: 'Electrical',
        description: 'Power outages, circuit issues, wiring, and lighting fixtures',
        status: 'ACTIVE',
        defaultPriority: 'NORMAL',
        defaultSlaPolicyId: standardTicketSla.id,
        defaultTeamId: electricalTeam.id,
        workflowDefinitionId: ticketWorkflow.id,
        residentVisible: true,
        isSensitive: false,
        allowAttachments: true,
        displayOrder: 1,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    await db.ticketCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'cat.electrical.power_outage',
        },
      },
      update: {},
      create: {
        parentId: electricalCat.id,
        key: 'cat.electrical.power_outage',
        name: 'Power Outage / MCB Trip',
        description: 'Unit or floor sudden power loss',
        status: 'ACTIVE',
        defaultPriority: 'HIGH',
        defaultSlaPolicyId: standardTicketSla.id,
        defaultTeamId: electricalTeam.id,
        workflowDefinitionId: ticketWorkflow.id,
        residentVisible: true,
        isSensitive: false,
        displayOrder: 1,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    const plumbingCat = await db.ticketCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'cat.plumbing',
        },
      },
      update: {},
      create: {
        key: 'cat.plumbing',
        name: 'Plumbing',
        description: 'Pipe leaks, taps, drainage, and sanitary maintenance',
        status: 'ACTIVE',
        defaultPriority: 'NORMAL',
        defaultSlaPolicyId: standardTicketSla.id,
        defaultTeamId: plumbingTeam.id,
        workflowDefinitionId: ticketWorkflow.id,
        residentVisible: true,
        isSensitive: false,
        allowAttachments: true,
        displayOrder: 2,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    await db.ticketCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'cat.plumbing.leakage',
        },
      },
      update: {},
      create: {
        parentId: plumbingCat.id,
        key: 'cat.plumbing.leakage',
        name: 'Water Leakage / Seepage',
        description: 'Active water leak from pipe, ceiling, or bathroom fixture',
        status: 'ACTIVE',
        defaultPriority: 'HIGH',
        defaultSlaPolicyId: standardTicketSla.id,
        defaultTeamId: plumbingTeam.id,
        workflowDefinitionId: ticketWorkflow.id,
        residentVisible: true,
        isSensitive: false,
        displayOrder: 1,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    await db.ticketCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'cat.lift',
        },
      },
      update: {},
      create: {
        key: 'cat.lift',
        name: 'Lift / Elevator Emergency',
        description: 'Elevator breakdown, stoppage, or entrapment emergency',
        status: 'ACTIVE',
        defaultPriority: 'CRITICAL',
        defaultSlaPolicyId: emergencyTicketSla.id,
        defaultTeamId: facilityDeskTeam.id,
        workflowDefinitionId: ticketWorkflow.id,
        residentVisible: true,
        isSensitive: false,
        allowAttachments: true,
        displayOrder: 3,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    await db.ticketCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'cat.security',
        },
      },
      update: {},
      create: {
        key: 'cat.security',
        name: 'Security & Confidential Incident',
        description: 'Security concern, visitor dispute, or confidential complaint',
        status: 'ACTIVE',
        defaultPriority: 'HIGH',
        defaultSlaPolicyId: standardTicketSla.id,
        defaultTeamId: facilityDeskTeam.id,
        workflowDefinitionId: ticketWorkflow.id,
        residentVisible: true,
        isSensitive: true,
        allowAttachments: true,
        displayOrder: 4,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    // =========================================================================
    // PHASE 9: FACILITY MANAGEMENT & WORK ORDERS SEEDS
    // =========================================================================

    // 1. Work Order Standard Workflow Definition
    const workOrderWorkflow = await db.workflowDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'workflow.work_order.standard',
          version: 1,
        },
      },
      update: {},
      create: {
        key: 'workflow.work_order.standard',
        name: 'Standard Work Order Execution Workflow',
        description:
          'Operational lifecycle for work orders from drafting to technician execution, supervisor review, and completion',
        version: 1,
        status: 'PUBLISHED',
        scopeType: 'COMMUNITY',
        scopeId: community1.id,
        entityType: 'WORK_ORDER',
        initialStateKey: 'DRAFT',
        states: [
          { key: 'DRAFT', label: 'Draft', type: 'INITIAL' },
          { key: 'PLANNED', label: 'Planned / Scheduled', type: 'INTERMEDIATE' },
          { key: 'ASSIGNED', label: 'Assigned to Team/Tech', type: 'INTERMEDIATE' },
          { key: 'ACCEPTED', label: 'Accepted by Technician', type: 'INTERMEDIATE' },
          { key: 'IN_PROGRESS', label: 'In Progress / Active Work', type: 'INTERMEDIATE' },
          { key: 'PAUSED', label: 'Temporarily Paused', type: 'INTERMEDIATE' },
          { key: 'BLOCKED', label: 'Blocked by Dependency', type: 'INTERMEDIATE' },
          {
            key: 'SUPERVISOR_REVIEW',
            label: 'Pending Supervisor Verification',
            type: 'INTERMEDIATE',
          },
          { key: 'REWORK_REQUIRED', label: 'Rework Requested', type: 'INTERMEDIATE' },
          { key: 'COMPLETED', label: 'Verified & Completed', type: 'TERMINAL' },
          { key: 'CANCELLED', label: 'Cancelled', type: 'TERMINAL' },
        ],
        transitions: [
          {
            action: 'PLAN',
            fromState: 'DRAFT',
            toState: 'PLANNED',
            actionLabel: 'Schedule & Plan',
          },
          { action: 'ASSIGN', fromState: 'DRAFT', toState: 'ASSIGNED', actionLabel: 'Assign' },
          { action: 'ASSIGN', fromState: 'PLANNED', toState: 'ASSIGNED', actionLabel: 'Assign' },
          {
            action: 'ACCEPT',
            fromState: 'ASSIGNED',
            toState: 'ACCEPTED',
            actionLabel: 'Accept Work',
          },
          {
            action: 'START',
            fromState: 'ACCEPTED',
            toState: 'IN_PROGRESS',
            actionLabel: 'Start Work',
          },
          {
            action: 'START',
            fromState: 'ASSIGNED',
            toState: 'IN_PROGRESS',
            actionLabel: 'Start Work Directly',
          },
          {
            action: 'PAUSE',
            fromState: 'IN_PROGRESS',
            toState: 'PAUSED',
            actionLabel: 'Pause Work',
          },
          {
            action: 'RESUME',
            fromState: 'PAUSED',
            toState: 'IN_PROGRESS',
            actionLabel: 'Resume Work',
          },
          {
            action: 'BLOCK',
            fromState: 'IN_PROGRESS',
            toState: 'BLOCKED',
            actionLabel: 'Block Work',
          },
          {
            action: 'UNBLOCK',
            fromState: 'BLOCKED',
            toState: 'IN_PROGRESS',
            actionLabel: 'Unblock Work',
          },
          {
            action: 'SUBMIT_COMPLETION',
            fromState: 'IN_PROGRESS',
            toState: 'SUPERVISOR_REVIEW',
            actionLabel: 'Submit for Review',
          },
          {
            action: 'APPROVE',
            fromState: 'SUPERVISOR_REVIEW',
            toState: 'COMPLETED',
            actionLabel: 'Approve & Close',
          },
          {
            action: 'REQUEST_REWORK',
            fromState: 'SUPERVISOR_REVIEW',
            toState: 'REWORK_REQUIRED',
            actionLabel: 'Request Rework',
          },
          {
            action: 'RESTART_WORK',
            fromState: 'REWORK_REQUIRED',
            toState: 'IN_PROGRESS',
            actionLabel: 'Restart Work',
          },
          {
            action: 'CANCEL',
            fromState: 'DRAFT',
            toState: 'CANCELLED',
            actionLabel: 'Cancel Work Order',
          },
          {
            action: 'CANCEL',
            fromState: 'PLANNED',
            toState: 'CANCELLED',
            actionLabel: 'Cancel Work Order',
          },
          {
            action: 'CANCEL',
            fromState: 'ASSIGNED',
            toState: 'CANCELLED',
            actionLabel: 'Cancel Work Order',
          },
          {
            action: 'CANCEL',
            fromState: 'ACCEPTED',
            toState: 'CANCELLED',
            actionLabel: 'Cancel Work Order',
          },
          {
            action: 'CANCEL',
            fromState: 'PAUSED',
            toState: 'CANCELLED',
            actionLabel: 'Cancel Work Order',
          },
          {
            action: 'CANCEL',
            fromState: 'BLOCKED',
            toState: 'CANCELLED',
            actionLabel: 'Cancel Work Order',
          },
          {
            action: 'CANCEL',
            fromState: 'REWORK_REQUIRED',
            toState: 'CANCELLED',
            actionLabel: 'Cancel Work Order',
          },
        ],
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    // 2. Work Order SLA Policies
    const standardWorkOrderSla = await db.slaPolicyDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'sla.work_order.standard',
          version: 1,
        },
      },
      update: {},
      create: {
        key: 'sla.work_order.standard',
        name: 'Standard Work Order SLA (24h)',
        description: 'Standard 24h operational completion window',
        version: 1,
        scopeType: 'COMMUNITY',
        organizationId: org.id,
        communityId: community1.id,
        status: 'PUBLISHED',
        metricType: 'TIME_TO_RESOLUTION',
        durationMinutes: 1440,
        useBusinessHours: true,
        calendarId: defaultCalendar.id,
        warningThresholdPercent: 75,
        stopStates: ['COMPLETED', 'CANCELLED'],
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    const emergencyWorkOrderSla = await db.slaPolicyDefinition.upsert({
      where: {
        organizationId_communityId_key_version: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'sla.work_order.emergency',
          version: 1,
        },
      },
      update: {},
      create: {
        key: 'sla.work_order.emergency',
        name: 'Emergency Work Order SLA (4h)',
        description: 'Critical facility emergency 4h resolution window',
        version: 1,
        scopeType: 'COMMUNITY',
        organizationId: org.id,
        communityId: community1.id,
        status: 'PUBLISHED',
        metricType: 'TIME_TO_RESOLUTION',
        durationMinutes: 240,
        useBusinessHours: false,
        warningThresholdPercent: 50,
        stopStates: ['COMPLETED', 'CANCELLED'],
        createdById: adminUser.id,
        publishedAt: new Date(),
      },
    });

    // 3. Facility Work Categories
    const _elevatorCategory = await db.facilityWorkCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'ELEVATOR_MAINTENANCE',
        },
      },
      update: {},
      create: {
        key: 'ELEVATOR_MAINTENANCE',
        name: 'Elevator & Lift Maintenance',
        description:
          'Periodic inspection, emergency repair, and preventive servicing for passenger and service elevators',
        status: 'ACTIVE',
        defaultPriority: 'HIGH',
        defaultSlaPolicyId: emergencyWorkOrderSla.id,
        defaultTeamId: facilityDeskTeam.id,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    const electricalHvacCategory = await db.facilityWorkCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'ELECTRICAL_HVAC',
        },
      },
      update: {},
      create: {
        key: 'ELECTRICAL_HVAC',
        name: 'Electrical & HVAC',
        description: 'Power distribution, generator servicing, lighting, and HVAC maintenance',
        status: 'ACTIVE',
        defaultPriority: 'NORMAL',
        defaultSlaPolicyId: standardWorkOrderSla.id,
        defaultTeamId: facilityDeskTeam.id,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    const _plumbingCategory = await db.facilityWorkCategory.upsert({
      where: {
        organizationId_communityId_key: {
          organizationId: org.id,
          communityId: community1.id,
          key: 'PLUMBING_WATER',
        },
      },
      update: {},
      create: {
        key: 'PLUMBING_WATER',
        name: 'Plumbing & Water Supply',
        description:
          'Water filtration, overhead tanks, pump room maintenance, and pipeline repairs',
        status: 'ACTIVE',
        defaultPriority: 'NORMAL',
        defaultSlaPolicyId: standardWorkOrderSla.id,
        defaultTeamId: facilityDeskTeam.id,
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    // 4. Facility Checklist Templates
    const generatorChecklist = await db.facilityChecklistTemplate.upsert({
      where: {
        organizationId_communityId_code_version: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'GEN-MONTHLY-CHK',
          version: 1,
        },
      },
      update: {},
      create: {
        code: 'GEN-MONTHLY-CHK',
        name: 'Diesel Generator Monthly Servicing Checklist',
        version: 1,
        status: 'PUBLISHED',
        categoryId: electricalHvacCategory.id,
        items: [
          {
            id: 'item-fuel-level',
            label: 'Diesel Fuel Tank Level (%)',
            description: 'Check fuel level on visual gauge',
            itemType: 'NUMBER',
            isRequired: true,
            minValue: 0,
            maxValue: 100,
            unitLabel: '%',
          },
          {
            id: 'item-battery-voltage',
            label: 'Starter Battery Voltage (V)',
            description: 'Measure DC voltage across terminals',
            itemType: 'DECIMAL',
            isRequired: true,
            minValue: 10,
            maxValue: 30,
            unitLabel: 'V',
          },
          {
            id: 'item-oil-pressure',
            label: 'Lube Oil Pressure (PSI)',
            description: 'Record operating oil pressure',
            itemType: 'DECIMAL',
            isRequired: true,
            unitLabel: 'PSI',
          },
          {
            id: 'item-coolant-temp',
            label: 'Coolant Temperature Normal',
            description: 'Verify coolant level and temperature within safe limits',
            itemType: 'PASS_FAIL',
            isRequired: true,
            failureRequiresComment: true,
          },
          {
            id: 'item-emergency-stop',
            label: 'Emergency Stop Switch Tested',
            description: 'Simulate emergency trip button actuation',
            itemType: 'BOOLEAN',
            isRequired: true,
          },
          {
            id: 'item-engine-photo',
            label: 'Engine Bay Overall Photo',
            description: 'Take clear photo of engine block and control panel',
            itemType: 'PHOTO_REQUIRED',
            isRequired: true,
            failureRequiresPhoto: true,
          },
        ],
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    // 5. Preventive Maintenance Plan
    await db.maintenancePlan.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'PM-GEN-001',
        },
      },
      update: {},
      create: {
        code: 'PM-GEN-001',
        name: 'Monthly Main Generator Preventive Servicing',
        description:
          'Comprehensive monthly inspection and load test for primary 500kVA backup diesel generator in Tower A Basement',
        status: 'ACTIVE',
        workCategoryId: electricalHvacCategory.id,
        workType: 'PREVENTIVE',
        scheduleType: 'MONTHLY',
        scheduleDefinition: {
          dayOfMonth: 1,
          timeOfDay: '09:00',
          interval: 1,
        },
        timezone: 'Asia/Kolkata',
        defaultPriority: 'NORMAL',
        defaultTeamId: facilityDeskTeam.id,
        workflowDefinitionId: workOrderWorkflow.id,
        checklistTemplateId: generatorChecklist.id,
        estimatedDurationMinutes: 120,
        generationPolicy: 'SKIP_MISSED',
        leadTimeDays: 2,
        targetLocationType: 'BUILDING',
        targetBuildingId: towerA.id,
        targetLocationDescription: 'Basement Generator Room 01',
        nextRunAt: new Date(Date.now() + 86400000 * 5),
        organizationId: org.id,
        communityId: community1.id,
        createdById: adminUser.id,
      },
    });

    // eslint-disable-next-line no-console
    console.info('✅ Seeded Phase 9 Work Order Workflow & Categories & PM Plans');

    // ==========================================
    // PHASE 10: ENTERPRISE ASSET MANAGEMENT SEEDS
    // ==========================================
    // eslint-disable-next-line no-console
    console.info('🏭 Seeding Phase 10 Enterprise Asset Management...');

    // 1. Asset Categories
    const catElec = await db.assetCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'ELEC',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'ELEC',
        name: 'Electrical & Power Systems',
        description:
          'Transformers, DG sets, HT/LT panels, UPS, capacitor banks, and power distribution',
        icon: 'zap',
        defaultCriticality: 'CRITICAL',
        defaultExpectedLifeYears: 15,
        createdById: adminUser.id,
      },
    });

    const catHvac = await db.assetCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'HVAC',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'HVAC',
        name: 'HVAC & Climate Control',
        description: 'Central chillers, cooling towers, AHUs, FCUs, VRV systems, and exhaust fans',
        icon: 'fan',
        defaultCriticality: 'HIGH',
        defaultExpectedLifeYears: 12,
        createdById: adminUser.id,
      },
    });

    const _catPlumb = await db.assetCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'PLUMB',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'PLUMB',
        name: 'Plumbing & Water Management',
        description:
          'Hydro-pneumatic pumps, borewells, STPs, WTPs, rainwater harvesting, overhead tanks',
        icon: 'droplets',
        defaultCriticality: 'HIGH',
        defaultExpectedLifeYears: 10,
        createdById: adminUser.id,
      },
    });

    const catFire = await db.assetCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'FIRE',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'FIRE',
        name: 'Fire & Life Safety',
        description:
          'Main hydrant pumps, diesel engine pumps, jockey pumps, sprinkler systems, alarm panels',
        icon: 'shield-alert',
        defaultCriticality: 'CRITICAL',
        defaultExpectedLifeYears: 15,
        createdById: adminUser.id,
      },
    });

    const catElev = await db.assetCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'ELEV',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'ELEV',
        name: 'Elevators & Vertical Transport',
        description: 'Passenger elevators, service lifts, escalators, dumbwaiters',
        icon: 'arrow-up-down',
        defaultCriticality: 'HIGH',
        defaultExpectedLifeYears: 20,
        createdById: adminUser.id,
      },
    });

    // 2. Asset Models
    const modelDg = await db.assetModel.upsert({
      where: {
        organizationId_communityId_manufacturer_modelNumber: {
          organizationId: org.id,
          communityId: community1.id,
          manufacturer: 'Cummins India Ltd',
          modelNumber: 'C500D5P',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        categoryId: catElec.id,
        modelName: 'Cummins 500kVA Diesel Generator Set',
        manufacturer: 'Cummins India Ltd',
        modelNumber: 'C500D5P',
        description: 'Heavy duty turbo-charged diesel generator with PowerCommand controller',
        specifications: {
          capacityKVA: 500,
          voltage: '415V 3-Phase',
          rpm: 1500,
          fuelTankCapacityLitres: 990,
          governorType: 'Electronic',
        },
        expectedLifeYears: 15,
        createdById: adminUser.id,
      },
    });

    const modelChiller = await db.assetModel.upsert({
      where: {
        organizationId_communityId_manufacturer_modelNumber: {
          organizationId: org.id,
          communityId: community1.id,
          manufacturer: 'Daikin Industries',
          modelNumber: 'WSC100',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        categoryId: catHvac.id,
        modelName: 'Daikin Water-Cooled Centrifugal Chiller 100TR',
        manufacturer: 'Daikin Industries',
        modelNumber: 'WSC100',
        description: 'High efficiency VFD centrifugal water chiller with R-134a refrigerant',
        specifications: {
          coolingCapacityTR: 100,
          powerInputKW: 68,
          refrigerant: 'R-134a',
          evaporatorFlowGPM: 240,
        },
        expectedLifeYears: 12,
        createdById: adminUser.id,
      },
    });

    const modelPump = await db.assetModel.upsert({
      where: {
        organizationId_communityId_manufacturer_modelNumber: {
          organizationId: org.id,
          communityId: community1.id,
          manufacturer: 'Grundfos Pumps',
          modelNumber: 'CME-PLUS-150',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        categoryId: catFire.id,
        modelName: 'Grundfos Hydro Multi-E Fire Hydrant Pump',
        manufacturer: 'Grundfos Pumps',
        modelNumber: 'CME-PLUS-150',
        description: 'Multi-stage centrifugal pressure booster fire pump system',
        specifications: {
          flowRateM3Hr: 150,
          headMeters: 80,
          motorPowerKW: 45,
        },
        expectedLifeYears: 15,
        createdById: adminUser.id,
      },
    });

    const modelElevator = await db.assetModel.upsert({
      where: {
        organizationId_communityId_manufacturer_modelNumber: {
          organizationId: org.id,
          communityId: community1.id,
          manufacturer: 'OTIS Elevator Co',
          modelNumber: 'GEN2-PREMIER-13P',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        categoryId: catElev.id,
        modelName: 'OTIS Gen2 High-Speed Passenger Elevator',
        manufacturer: 'OTIS Elevator Co',
        modelNumber: 'GEN2-PREMIER-13P',
        description: 'Machine-roomless regenerative drive passenger lift with Pulse monitoring',
        specifications: {
          capacityPersons: 13,
          payloadKG: 884,
          speedMPS: 1.75,
          driveType: 'Regen ReGen',
        },
        expectedLifeYears: 20,
        createdById: adminUser.id,
      },
    });

    // 3. Physical Assets
    const assetDg1 = await db.asset.upsert({
      where: {
        organizationId_communityId_assetCode: {
          organizationId: org.id,
          communityId: community1.id,
          assetCode: 'AST-2026-000001',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        assetCode: 'AST-2026-000001',
        name: 'Primary Backup Diesel Generator (DG-01)',
        description: 'Primary 500kVA emergency power backup for Tower A & Common Services',
        assetCategoryId: catElec.id,
        assetModelId: modelDg.id,
        manufacturer: 'Cummins India Ltd',
        modelNumber: 'C500D5P',
        serialNumber: 'CUM-2024-DG500-0194',
        criticality: 'CRITICAL',
        lifecycleState: 'ACTIVE',
        operationalStatus: 'OPERATIONAL',
        condition: 'GOOD',
        qrIdentifier: 'ast_qr_dg01cummins500',
        barcodeIdentifier: 'BC-AST-000001',
        locationType: 'BUILDING',
        buildingId: towerA.id,
        locationDescription: 'Tower A Basement 1 — Heavy Engineering Room 01',
        purchaseDate: new Date('2024-03-15'),
        installationDate: new Date('2024-04-01'),
        commissionedAt: new Date('2024-04-10'),
        createdById: adminUser.id,
      },
    });

    const assetChiller1 = await db.asset.upsert({
      where: {
        organizationId_communityId_assetCode: {
          organizationId: org.id,
          communityId: community1.id,
          assetCode: 'AST-2026-000002',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        assetCode: 'AST-2026-000002',
        name: 'Central Water-Cooled Chiller Unit 01',
        description:
          'Main central air conditioning chiller for Clubhouse and Tower A common lobbies',
        assetCategoryId: catHvac.id,
        assetModelId: modelChiller.id,
        manufacturer: 'Daikin Industries',
        modelNumber: 'WSC100',
        serialNumber: 'DKN-2024-WSC100-7732',
        criticality: 'HIGH',
        lifecycleState: 'ACTIVE',
        operationalStatus: 'OPERATIONAL',
        condition: 'GOOD',
        qrIdentifier: 'ast_qr_chiller01daikin',
        barcodeIdentifier: 'BC-AST-000002',
        locationType: 'BUILDING',
        buildingId: towerA.id,
        locationDescription: 'Tower A Rooftop HVAC Mechanical Deck',
        purchaseDate: new Date('2024-05-10'),
        installationDate: new Date('2024-06-01'),
        commissionedAt: new Date('2024-06-15'),
        createdById: adminUser.id,
      },
    });

    const _assetFirePump1 = await db.asset.upsert({
      where: {
        organizationId_communityId_assetCode: {
          organizationId: org.id,
          communityId: community1.id,
          assetCode: 'AST-2026-000003',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        assetCode: 'AST-2026-000003',
        name: 'Main Fire Hydrant Booster Pump 01',
        description: 'Primary electric fire suppression water pump connecting all wet risers',
        assetCategoryId: catFire.id,
        assetModelId: modelPump.id,
        manufacturer: 'Grundfos Pumps',
        modelNumber: 'CME-PLUS-150',
        serialNumber: 'GRN-2024-FP150-3321',
        criticality: 'CRITICAL',
        lifecycleState: 'ACTIVE',
        operationalStatus: 'OPERATIONAL',
        condition: 'GOOD',
        qrIdentifier: 'ast_qr_firepump01grundfos',
        barcodeIdentifier: 'BC-AST-000003',
        locationType: 'BUILDING',
        buildingId: towerB.id,
        locationDescription: 'Tower B Basement Pump Room',
        purchaseDate: new Date('2024-02-20'),
        installationDate: new Date('2024-03-05'),
        commissionedAt: new Date('2024-03-15'),
        createdById: adminUser.id,
      },
    });

    const assetElevator1 = await db.asset.upsert({
      where: {
        organizationId_communityId_assetCode: {
          organizationId: org.id,
          communityId: community1.id,
          assetCode: 'AST-2026-000004',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        assetCode: 'AST-2026-000004',
        name: 'Tower A Passenger Elevator (Lift-1)',
        description: '13-passenger main high speed lift serving Tower A Floors G through 24',
        assetCategoryId: catElev.id,
        assetModelId: modelElevator.id,
        manufacturer: 'OTIS Elevator Co',
        modelNumber: 'GEN2-PREMIER-13P',
        serialNumber: 'OTIS-2024-LIFT01-A',
        criticality: 'HIGH',
        lifecycleState: 'ACTIVE',
        operationalStatus: 'OPERATIONAL',
        condition: 'GOOD',
        qrIdentifier: 'ast_qr_elevatoraotis',
        barcodeIdentifier: 'BC-AST-000004',
        locationType: 'BUILDING',
        buildingId: towerA.id,
        locationDescription: 'Tower A Elevator Shaft 01 (Left Lobby)',
        purchaseDate: new Date('2024-01-10'),
        installationDate: new Date('2024-02-15'),
        commissionedAt: new Date('2024-03-01'),
        createdById: adminUser.id,
      },
    });

    const assetDg2 = await db.asset.upsert({
      where: {
        organizationId_communityId_assetCode: {
          organizationId: org.id,
          communityId: community1.id,
          assetCode: 'AST-2026-000005',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        assetCode: 'AST-2026-000005',
        name: 'Secondary Standby Diesel Generator (DG-02)',
        description: '500kVA automatic synchronized standby generator',
        assetCategoryId: catElec.id,
        assetModelId: modelDg.id,
        manufacturer: 'Cummins India Ltd',
        modelNumber: 'C500D5P',
        serialNumber: 'CUM-2024-DG500-0195',
        criticality: 'HIGH',
        lifecycleState: 'COMMISSIONED',
        operationalStatus: 'OPERATIONAL',
        condition: 'GOOD',
        qrIdentifier: 'ast_qr_dg02cummins500',
        barcodeIdentifier: 'BC-AST-000005',
        locationType: 'BUILDING',
        buildingId: towerB.id,
        locationDescription: 'Tower B Basement 1 — Engineering Room 02',
        purchaseDate: new Date('2024-03-15'),
        installationDate: new Date('2024-04-01'),
        commissionedAt: new Date('2024-04-10'),
        createdById: adminUser.id,
      },
    });

    // 4. Asset Warranties
    await db.assetWarranty.upsert({
      where: { id: '00000000-0000-0000-0000-000000000a01' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000a01',
        assetId: assetDg1.id,
        warrantyType: 'MANUFACTURER',
        providerName: 'Cummins India Limited',
        referenceNumber: 'CUM-WR-2024-001',
        startDate: new Date('2024-04-10'),
        endDate: new Date('2027-04-09'),
        coverageSummary:
          'Comprehensive 36-month OEM warranty covering engine block, alternator, turbocharger, and ECM',
        status: 'ACTIVE',
        createdById: adminUser.id,
      },
    });

    await db.assetWarranty.upsert({
      where: { id: '00000000-0000-0000-0000-000000000a02' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000a02',
        assetId: assetChiller1.id,
        warrantyType: 'MANUFACTURER',
        providerName: 'Daikin Airconditioning India Pvt Ltd',
        referenceNumber: 'DKN-WR-2024-002',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2027-06-14'),
        coverageSummary:
          'Complete compressor and electronic expansion valve warranty with 4-hour critical response SLA',
        status: 'ACTIVE',
        createdById: adminUser.id,
      },
    });

    // 5. AMC Service Contracts
    const amcGenerator = await db.assetServiceContract.upsert({
      where: {
        organizationId_communityId_contractNumber: {
          organizationId: org.id,
          communityId: community1.id,
          contractNumber: 'AMC-2026-CUMMINS-01',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        contractNumber: 'AMC-2026-CUMMINS-01',
        name: 'Comprehensive AMC for 2x 500kVA Cummins Diesel Generators',
        serviceProviderName: 'Cummins Power Care Authorized Service',
        contactEmail: 'amc.sales@cumminspowercare.in',
        contactPhone: '+91-98450-11223',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        contractType: 'CMC',
        coverageSummary:
          '24/7 breakdown support, scheduled B & C preventive checks, consumables, oil testing',
        preventiveVisitsPerYear: 4,
        includesParts: true,
        includesLabor: true,
        slaResponseHours: 2,
        status: 'ACTIVE',
        createdById: adminUser.id,
      },
    });

    // Link DG-01 and DG-02 to the AMC Contract
    await db.assetServiceContractLink.upsert({
      where: {
        contractId_assetId: {
          contractId: amcGenerator.id,
          assetId: assetDg1.id,
        },
      },
      update: {},
      create: {
        contractId: amcGenerator.id,
        assetId: assetDg1.id,
        notes: 'Primary DG unit coverage including monthly fluid analysis',
      },
    });

    await db.assetServiceContractLink.upsert({
      where: {
        contractId_assetId: {
          contractId: amcGenerator.id,
          assetId: assetDg2.id,
        },
      },
      update: {},
      create: {
        contractId: amcGenerator.id,
        assetId: assetDg2.id,
        notes: 'Secondary standby DG unit coverage',
      },
    });

    const amcOtis = await db.assetServiceContract.upsert({
      where: {
        organizationId_communityId_contractNumber: {
          organizationId: org.id,
          communityId: community1.id,
          contractNumber: 'AMC-2026-OTIS-LIFTS',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        contractNumber: 'AMC-2026-OTIS-LIFTS',
        name: 'Full Maintenance AMC for Passenger & Service Elevators',
        serviceProviderName: 'OTIS Elevator Company (India) Ltd',
        contactEmail: 'otiscalldesk.india@otis.com',
        contactPhone: '+91-1800-102-6847',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        contractType: 'CMC',
        coverageSummary:
          'Monthly statutory safety inspections, rope maintenance, 24/7 entrapment emergency response',
        preventiveVisitsPerYear: 12,
        includesParts: true,
        includesLabor: true,
        slaResponseHours: 1,
        status: 'ACTIVE',
        createdById: adminUser.id,
      },
    });

    await db.assetServiceContractLink.upsert({
      where: {
        contractId_assetId: {
          contractId: amcOtis.id,
          assetId: assetElevator1.id,
        },
      },
      update: {},
      create: {
        contractId: amcOtis.id,
        assetId: assetElevator1.id,
        notes: 'Tower A Lift 1 Full 24/7 coverage with Pulse remote telemetry',
      },
    });

    // 6. Meters & Readings
    const meterDgRunHours = await db.assetMeter.upsert({
      where: {
        assetId_name: {
          assetId: assetDg1.id,
          name: 'Engine Operating Run Hours',
        },
      },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000b01',
        assetId: assetDg1.id,
        name: 'Engine Operating Run Hours',
        meterType: 'RUN_HOURS',
        unit: 'hrs',
        currentReading: 1420.5,
        lastRecordedAt: new Date(),
        allowsReset: false,
      },
    });

    await db.assetMeterReading.upsert({
      where: { id: '00000000-0000-0000-0000-000000000c01' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000c01',
        meterId: meterDgRunHours.id,
        reading: 1420.5,
        delta: 24.5,
        recordedAt: new Date(),
        recordedById: adminUser.id,
        source: 'MANUAL',
        notes: 'Monthly preventive maintenance routine log reading',
      },
    });

    const meterChillerEnergy = await db.assetMeter.upsert({
      where: {
        assetId_name: {
          assetId: assetChiller1.id,
          name: 'Chiller Power Consumption Meter',
        },
      },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000b02',
        assetId: assetChiller1.id,
        name: 'Chiller Power Consumption Meter',
        meterType: 'KWH',
        unit: 'kWh',
        currentReading: 125840.0,
        lastRecordedAt: new Date(),
        allowsReset: false,
      },
    });

    await db.assetMeterReading.upsert({
      where: { id: '00000000-0000-0000-0000-000000000c02' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000c02',
        meterId: meterChillerEnergy.id,
        reading: 125840.0,
        delta: 420.0,
        recordedAt: new Date(),
        recordedById: adminUser.id,
        source: 'MANUAL',
        notes: 'Daily morning energy audit logging',
      },
    });

    // 7. WorkOrder-Asset Link
    await db.maintenancePlan.updateMany({
      where: { name: 'Monthly Generator Routine & Load Testing' },
      data: {
        targetAssetId: assetDg1.id,
      },
    });

    // eslint-disable-next-line no-console
    console.info(
      '✅ Seeded Phase 10 Physical Assets (DG-01, Chiller-01, Fire Pump-01, Elevator-A, DG-02), Warranties, AMCs & Meters',
    );

    // =========================================================================
    // PHASE 11: ENTERPRISE INVENTORY, STORES, SPARE PARTS & STOCK LEDGER SEEDING
    // =========================================================================

    // 1. Units of Measure
    const uomPcs = await db.unitOfMeasure.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'PCS' } },
      update: {},
      create: {
        organizationId: org.id,
        code: 'PCS',
        name: 'Pieces',
        symbol: 'pcs',
        precision: 0,
        isBase: true,
        conversionFactor: 1,
      },
    });

    const _uomMtr = await db.unitOfMeasure.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'MTR' } },
      update: {},
      create: {
        organizationId: org.id,
        code: 'MTR',
        name: 'Meters',
        symbol: 'm',
        precision: 2,
        isBase: true,
        conversionFactor: 1,
      },
    });

    const _uomLtr = await db.unitOfMeasure.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'LTR' } },
      update: {},
      create: {
        organizationId: org.id,
        code: 'LTR',
        name: 'Liters',
        symbol: 'L',
        precision: 2,
        isBase: true,
        conversionFactor: 1,
      },
    });

    const _uomBox = await db.unitOfMeasure.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'BOX' } },
      update: {},
      create: {
        organizationId: org.id,
        code: 'BOX',
        name: 'Box of 10',
        symbol: 'box',
        precision: 0,
        isBase: false,
        baseUomId: uomPcs.id,
        conversionFactor: 10,
      },
    });

    // 2. Inventory Categories
    const catElecSpares = await db.inventoryCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'ELEC_SPARES',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'ELEC_SPARES',
        name: 'Electrical Spares & Switchgear',
        description: 'Breakers, relays, cables, drivers, bulbs, contactors',
      },
    });

    const catPlumbSpares = await db.inventoryCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'PLUMB_SPARES',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'PLUMB_SPARES',
        name: 'Plumbing & Hydraulic Spares',
        description: 'Valves, pipes, seals, pump impellers, flanges',
      },
    });

    const catGenSpares = await db.inventoryCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'GEN_SPARES',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'GEN_SPARES',
        name: 'DG & Power Plant Spares',
        description: 'Filters, belts, gaskets, AVRs, starters',
      },
    });

    const _catSafetyCons = await db.inventoryCategory.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'SAFETY_CONS',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'SAFETY_CONS',
        name: 'Safety & PPE Consumables',
        description: 'Gloves, helmets, masks, lubricants, tapes',
      },
    });

    // 3. Stores / Warehouses & Bins
    const storeCentral = await db.inventoryStore.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'WH-CENTRAL',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'WH-CENTRAL',
        name: 'Central Engineering Warehouse',
        storeType: 'CENTRAL',
        locationDescription: 'Basement 1, Engineering Maintenance Bay',
      },
    });

    const _storeClubhouse = await db.inventoryStore.upsert({
      where: {
        organizationId_communityId_code: {
          organizationId: org.id,
          communityId: community1.id,
          code: 'STORE-CLUB',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'STORE-CLUB',
        name: 'Clubhouse Maintenance Sub-Store',
        storeType: 'MAINTENANCE',
        locationDescription: 'Clubhouse Level 0, Facilities Room',
      },
    });

    const binElec1 = await db.stockBin.upsert({
      where: { storeId_code: { storeId: storeCentral.id, code: 'WH-ELEC-01' } },
      update: {},
      create: {
        storeId: storeCentral.id,
        code: 'WH-ELEC-01',
        name: 'Aisle 1 Electrical Rack',
        rack: 'R1',
        shelf: 'S1',
        bin: 'B1',
      },
    });

    const binPlumb1 = await db.stockBin.upsert({
      where: { storeId_code: { storeId: storeCentral.id, code: 'WH-PLUMB-01' } },
      update: {},
      create: {
        storeId: storeCentral.id,
        code: 'WH-PLUMB-01',
        name: 'Aisle 2 Plumbing Rack',
        rack: 'R1',
        shelf: 'S1',
        bin: 'B1',
      },
    });

    const binGen1 = await db.stockBin.upsert({
      where: { storeId_code: { storeId: storeCentral.id, code: 'WH-GEN-01' } },
      update: {},
      create: {
        storeId: storeCentral.id,
        code: 'WH-GEN-01',
        name: 'Aisle 3 DG Spares Bin',
        rack: 'R1',
        shelf: 'S1',
        bin: 'B1',
      },
    });

    // 4. Inventory Items Master
    const itemLedBulb = await db.inventoryItem.upsert({
      where: {
        organizationId_communityId_itemCode: {
          organizationId: org.id,
          communityId: community1.id,
          itemCode: 'ITM-LED-9W',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        itemCode: 'ITM-LED-9W',
        name: 'LED Bulb 9W Cool White B22',
        description: 'Energy-saving 9W LED retrofit lamps for corridors & staircases',
        categoryId: catElecSpares.id,
        baseUomId: uomPcs.id,
        itemType: 'SPARE_PART',
        stockTrackingType: 'QUANTITY',
        minStockLevel: 20,
        reorderLevel: 50,
        maxStockLevel: 200,
        preferredStoreId: storeCentral.id,
        preferredBinId: binElec1.id,
        barcodeIdentifier: 'BC-LED9W-001',
        qrIdentifier: 'itm_qr_led9w_001',
        createdById: adminUser.id,
      },
    });

    const itemMcb16a = await db.inventoryItem.upsert({
      where: {
        organizationId_communityId_itemCode: {
          organizationId: org.id,
          communityId: community1.id,
          itemCode: 'ITM-MCB-16A',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        itemCode: 'ITM-MCB-16A',
        name: 'Schneider MCB 16A Single Pole C-Curve',
        description: 'Miniature circuit breaker for DB board circuit protection',
        categoryId: catElecSpares.id,
        baseUomId: uomPcs.id,
        itemType: 'SPARE_PART',
        stockTrackingType: 'QUANTITY',
        minStockLevel: 10,
        reorderLevel: 25,
        maxStockLevel: 100,
        preferredStoreId: storeCentral.id,
        preferredBinId: binElec1.id,
        barcodeIdentifier: 'BC-MCB16A-002',
        qrIdentifier: 'itm_qr_mcb16a_002',
        createdById: adminUser.id,
      },
    });

    const itemPumpImpeller = await db.inventoryItem.upsert({
      where: {
        organizationId_communityId_itemCode: {
          organizationId: org.id,
          communityId: community1.id,
          itemCode: 'ITM-PUMP-IMP',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        itemCode: 'ITM-PUMP-IMP',
        name: 'Bronze Hydro-Pneumatic Pump Impeller 5HP',
        description: 'Replacement precision impeller for Grundfos booster pump set',
        categoryId: catPlumbSpares.id,
        baseUomId: uomPcs.id,
        itemType: 'SPARE_PART',
        stockTrackingType: 'SERIAL',
        isSerialTracked: true,
        minStockLevel: 2,
        reorderLevel: 5,
        maxStockLevel: 15,
        preferredStoreId: storeCentral.id,
        preferredBinId: binPlumb1.id,
        barcodeIdentifier: 'BC-PUMPIMP-003',
        qrIdentifier: 'itm_qr_pumpimp_003',
        createdById: adminUser.id,
      },
    });

    const itemDgOilFilter = await db.inventoryItem.upsert({
      where: {
        organizationId_communityId_itemCode: {
          organizationId: org.id,
          communityId: community1.id,
          itemCode: 'ITM-DG-FLTR',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        itemCode: 'ITM-DG-FLTR',
        name: 'Cummins Fleetguard DG Lube Oil Filter LF9009',
        description: 'Full-flow spin-on oil filter for Cummins 500kVA Diesel Generator',
        categoryId: catGenSpares.id,
        baseUomId: uomPcs.id,
        itemType: 'SPARE_PART',
        stockTrackingType: 'BATCH',
        isBatchTracked: true,
        isExpiryTracked: true,
        minStockLevel: 4,
        reorderLevel: 8,
        maxStockLevel: 24,
        preferredStoreId: storeCentral.id,
        preferredBinId: binGen1.id,
        barcodeIdentifier: 'BC-DGFLTR-004',
        qrIdentifier: 'itm_qr_dgfltr_004',
        createdById: adminUser.id,
      },
    });

    const itemBallValve = await db.inventoryItem.upsert({
      where: {
        organizationId_communityId_itemCode: {
          organizationId: org.id,
          communityId: community1.id,
          itemCode: 'ITM-VLV-1IN',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        itemCode: 'ITM-VLV-1IN',
        name: 'PVC Ball Valve 1-Inch Threaded Brass Core',
        description: 'Quarter turn shutoff valve for residential water riser branches',
        categoryId: catPlumbSpares.id,
        baseUomId: uomPcs.id,
        itemType: 'SPARE_PART',
        minStockLevel: 15,
        reorderLevel: 30,
        maxStockLevel: 120,
        preferredStoreId: storeCentral.id,
        preferredBinId: binPlumb1.id,
        barcodeIdentifier: 'BC-VLV1IN-005',
        qrIdentifier: 'itm_qr_vlv1in_005',
        createdById: adminUser.id,
      },
    });

    // 5. Store Policies
    await db.itemStorePolicy.upsert({
      where: { itemId_storeId: { itemId: itemLedBulb.id, storeId: storeCentral.id } },
      update: {},
      create: {
        itemId: itemLedBulb.id,
        storeId: storeCentral.id,
        minQuantity: 20,
        reorderLevel: 50,
        reorderQuantity: 100,
        maxQuantity: 200,
        defaultBinId: binElec1.id,
        reorderEnabled: true,
      },
    });

    // 6. Batches & Serials
    const batchDgOil = await db.inventoryBatch.upsert({
      where: { itemId_batchNumber: { itemId: itemDgOilFilter.id, batchNumber: 'LOT-2026-Q1' } },
      update: {},
      create: {
        itemId: itemDgOilFilter.id,
        batchNumber: 'LOT-2026-Q1',
        manufacturedAt: new Date(),
        expiryAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        supplierName: 'Cummins India Parts Ltd',
        createdById: adminUser.id,
      },
    });

    await db.inventorySerial.upsert({
      where: { itemId_serialNumber: { itemId: itemPumpImpeller.id, serialNumber: 'IMP-2026-001' } },
      update: {},
      create: {
        itemId: itemPumpImpeller.id,
        serialNumber: 'IMP-2026-001',
        status: 'IN_STOCK',
        currentStoreId: storeCentral.id,
        currentBinId: binPlumb1.id,
        createdById: adminUser.id,
      },
    });

    // 7. Opening Goods Receipt
    const receipt1 = await db.inventoryReceipt.upsert({
      where: {
        organizationId_communityId_receiptNumber: {
          organizationId: org.id,
          communityId: community1.id,
          receiptNumber: 'RCP-2026-0001',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        receiptNumber: 'RCP-2026-0001',
        storeId: storeCentral.id,
        sourceType: 'OPENING',
        supplierName: 'Initial Platform Bootstrap Stock',
        status: 'POSTED',
        receivedAt: new Date(),
        receivedById: adminUser.id,
        notes: 'Initial opening stock receipt for Phase 11 inventory foundation',
      },
    });

    // 8. Stock Balances & Initial Ledger Entries
    const initialItems = [
      { item: itemLedBulb, bin: binElec1, qty: 120, unitPrice: 120, batch: null },
      { item: itemMcb16a, bin: binElec1, qty: 45, unitPrice: 350, batch: null },
      { item: itemPumpImpeller, bin: binPlumb1, qty: 6, unitPrice: 4200, batch: null },
      { item: itemDgOilFilter, bin: binGen1, qty: 18, unitPrice: 1850, batch: batchDgOil },
      { item: itemBallValve, bin: binPlumb1, qty: 60, unitPrice: 280, batch: null },
    ];

    for (const entry of initialItems) {
      const existingBal = await db.stockBalance.findFirst({
        where: {
          storeId: storeCentral.id,
          itemId: entry.item.id,
          binId: entry.bin.id,
          batchId: entry.batch ? entry.batch.id : null,
        },
      });

      if (!existingBal) {
        await db.stockBalance.create({
          data: {
            storeId: storeCentral.id,
            itemId: entry.item.id,
            binId: entry.bin.id,
            batchId: entry.batch ? entry.batch.id : null,
            quantityOnHand: entry.qty,
            quantityReserved: 0,
            quantityAvailable: entry.qty,
          },
        });
      }

      await db.stockLedgerEntry.upsert({
        where: { idempotencyKey: `seed-opening-${entry.item.id}-${storeCentral.id}` },
        update: {},
        create: {
          organizationId: org.id,
          communityId: community1.id,
          storeId: storeCentral.id,
          binId: entry.bin.id,
          itemId: entry.item.id,
          batchId: entry.batch ? entry.batch.id : null,
          transactionType: 'RECEIPT',
          quantityDelta: entry.qty,
          uom: 'PCS',
          referenceType: 'RECEIPT',
          referenceId: receipt1.id,
          idempotencyKey: `seed-opening-${entry.item.id}-${storeCentral.id}`,
          notes: `Opening Goods Receipt for ${entry.item.name}`,
          createdById: adminUser.id,
        },
      });
    }

    // 9. Item-Asset Compatibility
    const existingComp = await db.itemAssetCompatibility.findFirst({
      where: { itemId: itemDgOilFilter.id, assetId: assetDg1.id },
    });
    if (!existingComp) {
      await db.itemAssetCompatibility.create({
        data: {
          itemId: itemDgOilFilter.id,
          assetId: assetDg1.id,
          notes: 'OEM recommended lube oil filter for DG-01 engine maintenance',
        },
      });
    }

    // eslint-disable-next-line no-console
    console.info(
      '✅ Seeded Phase 11 Enterprise Inventory (UOMs, Categories, Stores, Bins, Items, Balances, Ledger & Asset Compatibility)',
    );

    // =========================================================================
    // PHASE 12: ENTERPRISE VENDOR & PROCUREMENT SEED
    // =========================================================================

    // 1. Vendors
    const vendorApex = await db.vendor.upsert({
      where: {
        organizationId_vendorCode: {
          organizationId: org.id,
          vendorCode: 'VND-ELEC-001',
        },
      },
      update: {
        status: 'ACTIVE',
        onboardingStatus: 'APPROVED',
      },
      create: {
        organizationId: org.id,
        vendorCode: 'VND-ELEC-001',
        legalName: 'Apex Electrical Solutions Private Limited',
        displayName: 'Apex Electricals',
        vendorType: 'SUPPLIER',
        status: 'ACTIVE',
        onboardingStatus: 'APPROVED',
        countryCode: 'IND',
        primaryEmail: 'orders@apexelectricals.com',
        primaryPhone: '+91 98450 11223',
        website: 'https://apexelectricals.com',
        paymentTerms: 'Net 30 Days',
        riskRating: 'LOW',
        isPreferred: true,
        createdById: adminUser.id,
        approvedById: adminUser.id,
        approvedAt: new Date(),
        contacts: {
          create: [
            {
              name: 'Rajesh Sharma',
              designation: 'Senior Key Account Manager',
              email: 'rajesh@apexelectricals.com',
              phone: '+91 98450 11224',
              contactType: 'SALES',
              isPrimary: true,
            },
          ],
        },
        addresses: {
          create: [
            {
              addressType: 'REGISTERED',
              addressLine1: 'Plot 42, Electronics City Phase 1',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560100',
              countryCode: 'IND',
              isPrimary: true,
            },
          ],
        },
        taxRegistrations: {
          create: [
            {
              countryCode: 'IND',
              registrationType: 'GSTIN',
              registrationNumber: '29AABCA1234F1Z1',
              isVerified: true,
              verifiedAt: new Date(),
            },
          ],
        },
        capabilities: {
          create: [
            {
              inventoryCategoryId: catElecSpares.id,
              description:
                'Authorized distributor for Philips, Schneider, Havells switches and lighting',
            },
          ],
        },
        communityLinks: {
          create: [{ communityId: community1.id }],
        },
      },
    });

    const vendorAqua = await db.vendor.upsert({
      where: {
        organizationId_vendorCode: {
          organizationId: org.id,
          vendorCode: 'VND-PLUMB-002',
        },
      },
      update: {
        status: 'ACTIVE',
        onboardingStatus: 'APPROVED',
      },
      create: {
        organizationId: org.id,
        vendorCode: 'VND-PLUMB-002',
        legalName: 'AquaFlow Systems & Supplies LLP',
        displayName: 'AquaFlow Supplies',
        vendorType: 'SUPPLIER',
        status: 'ACTIVE',
        onboardingStatus: 'APPROVED',
        countryCode: 'IND',
        primaryEmail: 'sales@aquaflowsupplies.com',
        primaryPhone: '+91 98450 55667',
        paymentTerms: 'Net 30 Days',
        riskRating: 'LOW',
        isPreferred: false,
        createdById: adminUser.id,
        approvedById: adminUser.id,
        approvedAt: new Date(),
        capabilities: {
          create: [
            {
              inventoryCategoryId: catPlumbSpares.id,
              description: 'Pumps, CPVC/UPVC pipes, sanitary fixtures and valves supplier',
            },
          ],
        },
      },
    });

    const _vendorCool = await db.vendor.upsert({
      where: {
        organizationId_vendorCode: {
          organizationId: org.id,
          vendorCode: 'VND-HVAC-003',
        },
      },
      update: {
        status: 'ACTIVE',
        onboardingStatus: 'APPROVED',
      },
      create: {
        organizationId: org.id,
        vendorCode: 'VND-HVAC-003',
        legalName: 'CoolTech HVAC Solutions & Engineering',
        displayName: 'CoolTech Services',
        vendorType: 'AMC_PROVIDER',
        status: 'ACTIVE',
        onboardingStatus: 'APPROVED',
        countryCode: 'IND',
        primaryEmail: 'support@cooltechsolutions.com',
        primaryPhone: '+91 98450 99887',
        riskRating: 'LOW',
        createdById: adminUser.id,
        approvedById: adminUser.id,
        approvedAt: new Date(),
      },
    });

    const _vendorSuspended = await db.vendor.upsert({
      where: {
        organizationId_vendorCode: {
          organizationId: org.id,
          vendorCode: 'VND-SUSP-004',
        },
      },
      update: {
        status: 'SUSPENDED',
      },
      create: {
        organizationId: org.id,
        vendorCode: 'VND-SUSP-004',
        legalName: 'Defaulter Spares Trading',
        displayName: 'Defaulter Spares',
        vendorType: 'SUPPLIER',
        status: 'SUSPENDED',
        onboardingStatus: 'APPROVED',
        suspensionReason: 'Audit compliance failure: repeated delivery of counterfeit relays',
        suspendedAt: new Date(),
        createdById: adminUser.id,
      },
    });

    // 2. Purchase Requisition (PR-2026-000001)
    const seedPr = await db.purchaseRequisition.upsert({
      where: {
        organizationId_requisitionNumber: {
          organizationId: org.id,
          requisitionNumber: 'PR-2026-000001',
        },
      },
      update: { status: 'APPROVED' },
      create: {
        organizationId: org.id,
        communityId: community1.id,
        requisitionNumber: 'PR-2026-000001',
        title: 'Quarterly Electrical & DG Consumables Replenishment',
        description: 'Scheduled replenishment for Club House LED panels and DG engine lube filters',
        requestType: 'GOODS',
        priority: 'HIGH',
        requestingDepartment: 'Facility Operations',
        requestedById: adminUser.id,
        sourceType: 'INVENTORY_REORDER',
        status: 'APPROVED',
        currency: 'INR',
        estimatedTotalAmount: 48000,
        justification: 'Stock below minimum threshold and pending scheduled DG maintenance',
        lines: {
          create: [
            {
              lineNumber: 1,
              lineType: 'CATALOG_ITEM',
              inventoryItemId: itemLedBulb.id,
              description: 'LED Bulb 9W Cool White B22',
              quantity: 25,
              uomId: uomPcs.id,
              uomName: 'Pieces',
              estimatedUnitPrice: 650,
              estimatedTotalPrice: 16250,
            },
            {
              lineNumber: 2,
              lineType: 'CATALOG_ITEM',
              inventoryItemId: itemDgOilFilter.id,
              description: 'Cummins Fleetguard DG Lube Oil Filter LF9009',
              quantity: 10,
              uomId: uomPcs.id,
              uomName: 'Pieces',
              estimatedUnitPrice: 3175,
              estimatedTotalPrice: 31750,
            },
          ],
        },
      },
      include: { lines: true },
    });

    // 3. Request For Quotation (RFQ-2026-000001)
    const seedRfq = await db.requestForQuotation.upsert({
      where: {
        organizationId_rfqNumber: {
          organizationId: org.id,
          rfqNumber: 'RFQ-2026-000001',
        },
      },
      update: { status: 'AWARDED' },
      create: {
        organizationId: org.id,
        communityId: community1.id,
        rfqNumber: 'RFQ-2026-000001',
        title: 'Competitive Sourcing: Electrical & DG Spares Q3',
        description:
          'Competitive quotation for LED panels and DG lube filters as per PR-2026-000001',
        currency: 'INR',
        submissionDeadline: new Date(Date.now() + 7 * 86400000),
        status: 'AWARDED',
        minimumQuotationsRequired: 2,
        createdById: adminUser.id,
        publishedAt: new Date(),
        lines: {
          create: [
            {
              lineNumber: 1,
              sourcePrLineId: seedPr.lines[0]?.id ?? null,
              lineType: 'CATALOG_ITEM',
              inventoryItemId: itemLedBulb.id,
              description: 'LED Bulb 9W Cool White B22',
              quantity: 25,
              uomId: uomPcs.id,
              uomName: 'Pieces',
            },
            {
              lineNumber: 2,
              sourcePrLineId: seedPr.lines[1]?.id ?? null,
              lineType: 'CATALOG_ITEM',
              inventoryItemId: itemDgOilFilter.id,
              description: 'Cummins Fleetguard DG Lube Oil Filter LF9009',
              quantity: 10,
              uomId: uomPcs.id,
              uomName: 'Pieces',
            },
          ],
        },
        invitations: {
          create: [
            {
              vendorId: vendorApex.id,
              invitedById: adminUser.id,
              status: 'RESPONDED',
              respondedAt: new Date(),
            },
            {
              vendorId: vendorAqua.id,
              invitedById: adminUser.id,
              status: 'RESPONDED',
              respondedAt: new Date(),
            },
          ],
        },
      },
      include: { lines: true },
    });

    // 4. Quotations
    const seedQuoteApex = await db.vendorQuotation.upsert({
      where: {
        rfqId_vendorId_revision: {
          rfqId: seedRfq.id,
          vendorId: vendorApex.id,
          revision: 1,
        },
      },
      update: { status: 'ACCEPTED' },
      create: {
        rfqId: seedRfq.id,
        vendorId: vendorApex.id,
        quotationNumber: 'QT-2026-000001-1',
        revision: 1,
        isCurrentRevision: true,
        currency: 'INR',
        status: 'ACCEPTED',
        subtotal: 44000,
        discountTotal: 2000,
        taxTotal: 7560,
        freightTotal: 500,
        otherCharges: 0,
        grandTotal: 50060,
        deliveryLeadTimeDays: 3,
        paymentTerms: 'Net 30 Days',
        warrantyTerms: '1 Year Manufacturer Replacement Warranty',
        technicalComplianceScore: 100,
        commercialScore: 98,
        totalScore: 99,
        createdById: adminUser.id,
        lines: {
          create: [
            {
              lineNumber: 1,
              rfqLineId: seedRfq.lines[0]?.id ?? '',
              description: 'LED Bulb 9W Cool White B22',
              offeredQuantity: 25,
              uomId: uomPcs.id,
              uomName: 'Pieces',
              unitPrice: 580,
              discountAmount: 1000,
              taxAmount: 2430,
              lineTotal: 15930,
              deliveryLeadTimeDays: 3,
              brandName: 'Philips',
              modelNumber: 'RC380B',
              technicalCompliance: 'COMPLIANT',
              isAwarded: true,
              awardedQuantity: 25,
            },
            {
              lineNumber: 2,
              rfqLineId: seedRfq.lines[1]?.id ?? '',
              description: 'Cummins Fleetguard DG Lube Oil Filter LF9009',
              offeredQuantity: 10,
              uomId: uomPcs.id,
              uomName: 'Pieces',
              unitPrice: 2950,
              discountAmount: 1000,
              taxAmount: 5130,
              freightAmount: 500,
              lineTotal: 34130,
              deliveryLeadTimeDays: 3,
              brandName: 'Fleetguard',
              modelNumber: 'LF16015',
              technicalCompliance: 'COMPLIANT',
              isAwarded: true,
              awardedQuantity: 10,
            },
          ],
        },
      },
      include: { lines: true },
    });

    // 5. Sourcing Award (AWD-2026-000001)
    const seedAward = await db.sourcingAward.upsert({
      where: {
        organizationId_awardNumber: {
          organizationId: org.id,
          awardNumber: 'AWD-2026-000001',
        },
      },
      update: { status: 'PO_CREATED' },
      create: {
        organizationId: org.id,
        communityId: community1.id,
        awardNumber: 'AWD-2026-000001',
        rfqId: seedRfq.id,
        selectedVendorId: vendorApex.id,
        status: 'PO_CREATED',
        isLowestPriceSelected: true,
        recommendationReason:
          'Lowest evaluated commercial proposal with 100% technical compliance and 3-day lead time',
        recommendedById: adminUser.id,
        recommendedAt: new Date(),
        approvedById: adminUser.id,
        approvedAt: new Date(),
        lines: {
          create: [
            {
              rfqLineId: seedRfq.lines[0]?.id ?? '',
              quotationId: seedQuoteApex.id,
              quotationLineId: seedQuoteApex.lines[0]?.id ?? '',
              vendorId: vendorApex.id,
              awardedQuantity: 25,
              uomId: uomPcs.id,
              unitPrice: 580,
              lineTotal: 15930,
            },
            {
              rfqLineId: seedRfq.lines[1]?.id ?? '',
              quotationId: seedQuoteApex.id,
              quotationLineId: seedQuoteApex.lines[1]?.id ?? '',
              vendorId: vendorApex.id,
              awardedQuantity: 10,
              uomId: uomPcs.id,
              unitPrice: 2950,
              lineTotal: 34130,
            },
          ],
        },
      },
    });

    // 6. Purchase Order (PO-2026-000001)
    const seedPo = await db.purchaseOrder.upsert({
      where: {
        organizationId_poNumber: {
          organizationId: org.id,
          poNumber: 'PO-2026-000001',
        },
      },
      update: { status: 'FULLY_RECEIVED' },
      create: {
        organizationId: org.id,
        communityId: community1.id,
        poNumber: 'PO-2026-000001',
        vendorId: vendorApex.id,
        sourceAwardId: seedAward.id,
        currency: 'INR',
        revision: 1,
        isCurrentRevision: true,
        orderDate: new Date(),
        deliveryRequiredBy: new Date(Date.now() + 5 * 86400000),
        deliveryAddress: 'Central Warehouse, Orchid Residency, Main Gate 1',
        billingAddress: 'Accounts Dept, Green Valley Community, Tower A',
        status: 'FULLY_RECEIVED',
        poType: 'GOODS',
        subtotal: 44000,
        discountTotal: 2000,
        taxTotal: 7560,
        freightTotal: 500,
        otherCharges: 0,
        grandTotal: 50060,
        paymentTerms: 'Net 30 Days',
        deliveryTerms: 'Door Delivery to Central Warehouse',
        warrantyTerms: '1 Year OEM Replacement Warranty',
        vendorAcknowledgementStatus: 'ACCEPTED',
        vendorAcknowledgedAt: new Date(),
        createdById: adminUser.id,
        approvedById: adminUser.id,
        approvedAt: new Date(),
        issuedAt: new Date(),
        lines: {
          create: [
            {
              lineNumber: 1,
              sourcePrLineId: seedPr.lines[0]?.id ?? null,
              sourceRfqLineId: seedRfq.lines[0]?.id ?? null,
              sourceQuotationLineId: seedQuoteApex.lines[0]?.id ?? null,
              lineType: 'CATALOG_ITEM',
              inventoryItemId: itemLedBulb.id,
              description: 'LED Bulb 9W Cool White B22',
              orderedQty: 25,
              uomId: uomPcs.id,
              uomName: 'Pieces',
              unitPrice: 580,
              discountAmount: 1000,
              taxAmount: 2430,
              lineTotal: 15930,
              receivedQty: 25,
              acceptedQty: 25,
              rejectedQty: 0,
              remainingQty: 0,
              targetStoreId: storeCentral.id,
            },
            {
              lineNumber: 2,
              sourcePrLineId: seedPr.lines[1]?.id ?? null,
              sourceRfqLineId: seedRfq.lines[1]?.id ?? null,
              sourceQuotationLineId: seedQuoteApex.lines[1]?.id ?? null,
              lineType: 'CATALOG_ITEM',
              inventoryItemId: itemDgOilFilter.id,
              description: 'Cummins Fleetguard DG Lube Oil Filter LF9009',
              orderedQty: 10,
              uomId: uomPcs.id,
              uomName: 'Pieces',
              unitPrice: 2950,
              discountAmount: 1000,
              taxAmount: 5130,
              lineTotal: 34130,
              receivedQty: 10,
              acceptedQty: 10,
              rejectedQty: 0,
              remainingQty: 0,
              targetStoreId: storeCentral.id,
            },
          ],
        },
      },
      include: { lines: true },
    });

    // 7. Goods Receipt Note (GRN-2026-000001)
    const _seedGrn = await db.goodsReceiptNote.upsert({
      where: {
        organizationId_grnNumber: {
          organizationId: org.id,
          grnNumber: 'GRN-2026-000001',
        },
      },
      update: { status: 'POSTED' },
      create: {
        organizationId: org.id,
        communityId: community1.id,
        grnNumber: 'GRN-2026-000001',
        purchaseOrderId: seedPo.id,
        vendorId: vendorApex.id,
        storeId: storeCentral.id,
        deliveryChallanNumber: 'DC-APEX-88991',
        vendorInvoiceReference: 'INV-APEX-4421',
        receivedAt: new Date(),
        receivedById: adminUser.id,
        status: 'POSTED',
        inspectionStatus: 'PASSED',
        inspectedById: adminUser.id,
        inspectedAt: new Date(),
        inspectionComments:
          'Physical inspection completed: items in original OEM packaging with test certificates',
        postedAt: new Date(),
        notes: 'Delivered in full against PO-2026-000001',
        lines: {
          create: [
            {
              lineNumber: 1,
              poLineId: seedPo.lines[0]?.id ?? '',
              deliveredQty: 25,
              acceptedQty: 25,
              rejectedQty: 0,
              damagedQty: 0,
              uomId: uomPcs.id,
              binId: binElec1.id,
              batchNumber: 'BATCH-LED-2026-01',
              notes: 'Passed visual & wattage test',
            },
            {
              lineNumber: 2,
              poLineId: seedPo.lines[1]?.id ?? '',
              deliveredQty: 10,
              acceptedQty: 10,
              rejectedQty: 0,
              damagedQty: 0,
              uomId: uomPcs.id,
              binId: binGen1.id,
              batchNumber: 'BATCH-DG-2026-01',
              notes: 'Fleetguard hologram verified',
            },
          ],
        },
      },
    });

    // 8. Vendor Scorecard & Ratings
    const nowMonth = new Date();
    const pStart = new Date(nowMonth.getFullYear(), nowMonth.getMonth(), 1);
    const pEnd = new Date(nowMonth.getFullYear(), nowMonth.getMonth() + 1, 0);

    await db.vendorPerformanceMetric.upsert({
      where: {
        vendorId_periodStart_periodEnd: {
          vendorId: vendorApex.id,
          periodStart: pStart,
          periodEnd: pEnd,
        },
      },
      update: { calculatedScore: 98.5 },
      create: {
        vendorId: vendorApex.id,
        periodStart: pStart,
        periodEnd: pEnd,
        totalPurchaseOrders: 1,
        completedPurchaseOrders: 1,
        onTimeDeliveryRate: 100,
        qualityAcceptanceRate: 100,
        fulfillmentRate: 100,
        quotationResponseRate: 100,
        calculatedScore: 100,
      },
    });

    await db.vendorRating.create({
      data: {
        vendorId: vendorApex.id,
        purchaseOrderId: seedPo.id,
        ratedById: adminUser.id,
        ratingCategory: 'OVERALL',
        score: 5,
        reviewComments:
          'Outstanding delivery speed and genuine OEM materials with all test certificates.',
      },
    });

    // eslint-disable-next-line no-console

    // ==========================================
    // PHASE 13: ENTERPRISE FINANCE & ACCOUNTING CORE
    // ==========================================

    // 1. Accounting Entity for Greenfield Residency
    const finEntity = await db.accountingEntity.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: 'GREENFIELD_RESIDENCY_SOC',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        code: 'GREENFIELD_RESIDENCY_SOC',
        name: 'Greenfield Residency Apartment Owners Association',
        legalName: 'Greenfield Residency Apartment Owners Association (Reg. No. BLR/2020/SOC/1243)',
        countryCode: 'IND',
        baseCurrency: 'INR',
        timezone: 'Asia/Kolkata',
        status: 'ACTIVE',
      },
    });

    // 2. Fiscal Calendar
    const fiscalCal = await db.fiscalCalendar
      .upsert({
        where: { id: finEntity.id }, // dummy fallback
        update: {},
        create: {
          accountingEntityId: finEntity.id,
          name: 'Indian Statutory Fiscal Calendar',
          fiscalStartMonth: 4,
          fiscalStartDay: 1,
          isDefault: true,
        },
      })
      .catch(async () => {
        let existing = await db.fiscalCalendar.findFirst({
          where: { accountingEntityId: finEntity.id },
        });
        if (!existing) {
          existing = await db.fiscalCalendar.create({
            data: {
              accountingEntityId: finEntity.id,
              name: 'Indian Statutory Fiscal Calendar',
              fiscalStartMonth: 4,
              fiscalStartDay: 1,
              isDefault: true,
            },
          });
        }
        return existing;
      });

    // 3. Fiscal Year 2026-27 with 12 Periods
    const fyStartDate = new Date('2026-04-01T00:00:00.000Z');
    const fyEndDate = new Date('2027-03-31T23:59:59.999Z');

    let fiscalYear26 = await db.fiscalYear.findFirst({
      where: { accountingEntityId: finEntity.id, name: 'FY 2026-27' },
      include: { periods: true },
    });

    if (!fiscalYear26) {
      const periodsToCreate: Array<{
        periodNumber: number;
        name: string;
        startDate: Date;
        endDate: Date;
        status: 'OPEN';
      }> = [];

      for (let m = 0; m < 12; m++) {
        const monthDate = new Date(2026, 3 + m, 1);
        const pStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const pEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        const pName = `${pStart.getFullYear()}-${String(pStart.getMonth() + 1).padStart(2, '0')}`;

        periodsToCreate.push({
          periodNumber: m + 1,
          name: pName,
          startDate: pStart,
          endDate: pEnd,
          status: 'OPEN',
        });
      }

      fiscalYear26 = await db.fiscalYear.create({
        data: {
          accountingEntityId: finEntity.id,
          fiscalCalendarId: fiscalCal.id,
          name: 'FY 2026-27',
          startDate: fyStartDate,
          endDate: fyEndDate,
          status: 'OPEN',
          periods: {
            create: periodsToCreate,
          },
        },
        include: { periods: true },
      });
    }

    const period1 =
      fiscalYear26.periods.find((p: any) => p.periodNumber === 1) || fiscalYear26.periods[0];

    // 4. Ring-fenced Funds
    const fundGeneral = await db.fund.upsert({
      where: { accountingEntityId_code: { accountingEntityId: finEntity.id, code: 'OPERATING' } },
      update: {},
      create: {
        accountingEntityId: finEntity.id,
        code: 'OPERATING',
        name: 'General Operating Fund',
        description: 'Unrestricted society operations and maintenance fund',
        fundType: 'OPERATING',
        restrictionType: 'UNRESTRICTED',
        status: 'ACTIVE',
      },
    });

    const fundSinking = await db.fund.upsert({
      where: { accountingEntityId_code: { accountingEntityId: finEntity.id, code: 'SINKING' } },
      update: {},
      create: {
        accountingEntityId: finEntity.id,
        code: 'SINKING',
        name: 'Sinking Fund Reserve',
        description: 'Statutory long-term capital replacement reserve',
        fundType: 'SINKING',
        restrictionType: 'RESTRICTED',
        status: 'ACTIVE',
      },
    });

    const _fundCorpus = await db.fund.upsert({
      where: { accountingEntityId_code: { accountingEntityId: finEntity.id, code: 'CORPUS' } },
      update: {},
      create: {
        accountingEntityId: finEntity.id,
        code: 'CORPUS',
        name: 'Builder Handover Corpus Fund',
        description: 'Permanent capital endowment',
        fundType: 'CORPUS',
        restrictionType: 'DESIGNATED',
        status: 'ACTIVE',
      },
    });

    // 5. Cost Centers
    const _ccAdmin = await db.costCenter.upsert({
      where: { accountingEntityId_code: { accountingEntityId: finEntity.id, code: 'CC_ADMIN' } },
      update: {},
      create: {
        accountingEntityId: finEntity.id,
        code: 'CC_ADMIN',
        name: 'Estate Administration & Office',
        description: 'General office and administrative cost center',
        status: 'ACTIVE',
      },
    });

    const _ccSecurity = await db.costCenter.upsert({
      where: { accountingEntityId_code: { accountingEntityId: finEntity.id, code: 'CC_SECURITY' } },
      update: {},
      create: {
        accountingEntityId: finEntity.id,
        code: 'CC_SECURITY',
        name: 'Security & Manned Guarding',
        status: 'ACTIVE',
      },
    });

    const _ccHousekeeping = await db.costCenter.upsert({
      where: {
        accountingEntityId_code: { accountingEntityId: finEntity.id, code: 'CC_HOUSEKEEPING' },
      },
      update: {},
      create: {
        accountingEntityId: finEntity.id,
        code: 'CC_HOUSEKEEPING',
        name: 'Housekeeping & Waste Management',
        status: 'ACTIVE',
      },
    });

    const ccElectrical = await db.costCenter.upsert({
      where: {
        accountingEntityId_code: { accountingEntityId: finEntity.id, code: 'CC_ELECTRICAL' },
      },
      update: {},
      create: {
        accountingEntityId: finEntity.id,
        code: 'CC_ELECTRICAL',
        name: 'Electrical Infrastructure & DG Backup',
        status: 'ACTIVE',
      },
    });

    // 6. Standard Chart of Accounts
    const accountsData = [
      {
        code: '1000',
        name: 'Current Assets',
        type: 'ASSET',
        subType: 'OTHER_CURRENT_ASSET',
        normal: 'DEBIT',
        posting: false,
      },
      {
        code: '1100',
        name: 'Cash and Bank Balances',
        type: 'ASSET',
        subType: 'BANK',
        normal: 'DEBIT',
        posting: false,
        parent: '1000',
      },
      {
        code: '1110',
        name: 'Primary Operating Bank Account - HDFC',
        type: 'ASSET',
        subType: 'BANK',
        normal: 'DEBIT',
        posting: true,
        parent: '1100',
        key: 'BANK_PRIMARY',
      },
      {
        code: '1120',
        name: 'Sinking Fund Fixed Deposit - SBI',
        type: 'ASSET',
        subType: 'BANK',
        normal: 'DEBIT',
        posting: true,
        parent: '1100',
        key: 'BANK_SINKING_FD',
      },
      {
        code: '1130',
        name: 'Petty Cash',
        type: 'ASSET',
        subType: 'CASH',
        normal: 'DEBIT',
        posting: true,
        parent: '1100',
        key: 'CASH_PETTY',
      },
      {
        code: '1200',
        name: 'Accounts Receivable (Maintenance Dues)',
        type: 'ASSET',
        subType: 'ACCOUNTS_RECEIVABLE',
        normal: 'DEBIT',
        posting: true,
        parent: '1000',
        key: 'AR_CONTROL',
        isControl: true,
        allowManual: false,
      },
      {
        code: '1300',
        name: 'Vendor Advances',
        type: 'ASSET',
        subType: 'VENDOR_ADVANCE',
        normal: 'DEBIT',
        posting: true,
        parent: '1000',
      },
      {
        code: '2000',
        name: 'Current Liabilities',
        type: 'LIABILITY',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: false,
      },
      {
        code: '2100',
        name: 'Accounts Payable (Trade Creditors)',
        type: 'LIABILITY',
        subType: 'ACCOUNTS_PAYABLE',
        normal: 'CREDIT',
        posting: true,
        parent: '2000',
        key: 'AP_CONTROL',
        isControl: true,
        allowManual: false,
      },
      {
        code: '2200',
        name: 'Resident Advance Payments',
        type: 'LIABILITY',
        subType: 'RESIDENT_ADVANCE',
        normal: 'CREDIT',
        posting: true,
        parent: '2000',
        key: 'RESIDENT_ADVANCE',
        isControl: true,
      },
      {
        code: '2400',
        name: 'Statutory Taxes Payable (GST/TDS)',
        type: 'LIABILITY',
        subType: 'TAX_PAYABLE',
        normal: 'CREDIT',
        posting: true,
        parent: '2000',
        key: 'TAX_PAYABLE',
      },
      {
        code: '3000',
        name: 'Reserves and Society Funds',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: false,
      },
      {
        code: '3100',
        name: 'General Operating Fund',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: true,
        parent: '3000',
        key: 'GENERAL_FUND',
      },
      {
        code: '3200',
        name: 'Sinking Fund Reserve',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: true,
        parent: '3000',
        key: 'SINKING_FUND',
      },
      {
        code: '3300',
        name: 'Corpus Fund',
        type: 'FUND_BALANCE',
        subType: 'OTHER_CURRENT_LIABILITY',
        normal: 'CREDIT',
        posting: true,
        parent: '3000',
        key: 'CORPUS_FUND',
      },
      {
        code: '4000',
        name: 'Operating & Maintenance Income',
        type: 'INCOME',
        subType: 'MAINTENANCE_INCOME',
        normal: 'CREDIT',
        posting: false,
      },
      {
        code: '4100',
        name: 'Monthly Resident Maintenance Charges',
        type: 'INCOME',
        subType: 'MAINTENANCE_INCOME',
        normal: 'CREDIT',
        posting: true,
        parent: '4000',
        key: 'MAINTENANCE_INCOME',
      },
      {
        code: '4200',
        name: 'Clubhouse & Amenity Booking Income',
        type: 'INCOME',
        subType: 'AMENITY_INCOME',
        normal: 'CREDIT',
        posting: true,
        parent: '4000',
      },
      {
        code: '5000',
        name: 'Society Operational Expenses',
        type: 'EXPENSE',
        subType: 'ADMIN_EXPENSE',
        normal: 'DEBIT',
        posting: false,
      },
      {
        code: '5100',
        name: 'Repairs & Maintenance Expenses',
        type: 'EXPENSE',
        subType: 'REPAIRS_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
      {
        code: '5200',
        name: 'Electricity & Utility Bills',
        type: 'EXPENSE',
        subType: 'UTILITIES_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
      {
        code: '5300',
        name: 'Security Agency Services',
        type: 'EXPENSE',
        subType: 'SECURITY_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
      {
        code: '5400',
        name: 'Housekeeping & Waste Management',
        type: 'EXPENSE',
        subType: 'HOUSEKEEPING_EXPENSE',
        normal: 'DEBIT',
        posting: true,
        parent: '5000',
      },
    ];

    const seededAccounts = new Map<string, any>();

    for (const a of accountsData) {
      const acc = await db.ledgerAccount.upsert({
        where: {
          accountingEntityId_accountCode: { accountingEntityId: finEntity.id, accountCode: a.code },
        },
        update: {},
        create: {
          accountingEntityId: finEntity.id,
          accountCode: a.code,
          name: a.name,
          accountType: a.type as any,
          accountSubType: a.subType as any,
          normalBalance: a.normal as any,
          postingAllowed: a.posting,
          status: 'ACTIVE',
          systemAccountKey: a.key ?? null,
          isControlAccount: a.isControl ?? false,
          allowManualPosting: a.allowManual ?? true,
        },
      });
      seededAccounts.set(a.code, acc);
    }

    // Connect parents and create mappings
    for (const a of accountsData) {
      const acc = seededAccounts.get(a.code);
      if (a.parent && acc) {
        const parent = seededAccounts.get(a.parent);
        if (parent) {
          await db.ledgerAccount.update({
            where: { id: acc.id },
            data: { parentAccountId: parent.id },
          });
        }
      }
      if (a.key && acc) {
        await db.accountMapping.upsert({
          where: {
            accountingEntityId_mappingKey: { accountingEntityId: finEntity.id, mappingKey: a.key },
          },
          update: { accountId: acc.id },
          create: {
            accountingEntityId: finEntity.id,
            mappingKey: a.key,
            accountId: acc.id,
            description: `System mapping for ${a.name}`,
          },
        });
      }
    }

    // 7. Seed Balanced Opening Balances Journal
    const accBank = seededAccounts.get('1110');
    const accSinkingFD = seededAccounts.get('1120');
    const accGeneralFund = seededAccounts.get('3100');
    const accSinkingFund = seededAccounts.get('3200');
    const accElecExp = seededAccounts.get('5200');

    let obJournal: any = await db.journalEntry.findFirst({
      where: { accountingEntityId: finEntity.id, journalNumber: 'OB-2026-000001' },
    });

    if (!obJournal && accBank && accSinkingFD && accGeneralFund && accSinkingFund && period1) {
      obJournal = await db.journalEntry.create({
        data: {
          accountingEntityId: finEntity.id,
          journalNumber: 'OB-2026-000001',
          journalType: 'OPENING',
          journalDate: new Date('2026-04-01T00:00:00.000Z'),
          fiscalYearId: fiscalYear26.id,
          accountingPeriodId: period1.id,
          status: 'POSTED',
          description: 'Migration Opening Balances as of 2026-04-01',
          reference: 'MIGRATION_OB',
          currency: 'INR',
          totalDebit: 2450000,
          totalCredit: 2450000,
          postedAt: new Date('2026-04-01T00:00:00.000Z'),
          postedById: adminUser.id,
          createdById: adminUser.id,
          lines: {
            create: [
              {
                lineNumber: 1,
                accountId: accBank.id,
                description: 'Opening Operating Bank Balance - HDFC',
                debitAmount: 1500000,
                creditAmount: 0,
                baseAmount: 1500000,
                fundId: fundGeneral.id,
              },
              {
                lineNumber: 2,
                accountId: accSinkingFD.id,
                description: 'Opening Sinking Fund Fixed Deposit - SBI',
                debitAmount: 950000,
                creditAmount: 0,
                baseAmount: 950000,
                fundId: fundSinking.id,
              },
              {
                lineNumber: 3,
                accountId: accGeneralFund.id,
                description: 'Opening General Operating Fund Balance',
                debitAmount: 0,
                creditAmount: 1500000,
                baseAmount: 1500000,
                fundId: fundGeneral.id,
              },
              {
                lineNumber: 4,
                accountId: accSinkingFund.id,
                description: 'Opening Sinking Fund Reserve Balance',
                debitAmount: 0,
                creditAmount: 950000,
                baseAmount: 950000,
                fundId: fundSinking.id,
              },
            ],
          },
        },
        include: { lines: true },
      });

      // GL and Balance projections for OB
      for (const line of obJournal.lines) {
        await db.generalLedgerEntry.create({
          data: {
            accountingEntityId: finEntity.id,
            journalEntryId: obJournal.id,
            journalLineId: line.id,
            accountId: line.accountId,
            postingDate: obJournal.journalDate,
            fiscalYearId: fiscalYear26.id,
            periodId: period1.id,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            baseAmount: line.baseAmount,
            fundId: line.fundId,
            sourceModule: 'finance',
            sourceType: 'OpeningBalance',
            sourceId: obJournal.id,
            postedAt: obJournal.postedAt || new Date(),
          },
        });

        await db.accountBalance.create({
          data: {
            accountingEntityId: finEntity.id,
            accountId: line.accountId,
            fiscalYearId: fiscalYear26.id,
            periodId: period1.id,
            fundId: line.fundId,
            openingDebit: line.debitAmount,
            openingCredit: line.creditAmount,
            periodDebit: 0,
            periodCredit: 0,
            closingDebit: line.debitAmount,
            closingCredit: line.creditAmount,
          },
        });
      }
    }

    // 8. Seed Sample Posted Operational Journal (Utility Bills)
    let jv1: any = await db.journalEntry.findFirst({
      where: { accountingEntityId: finEntity.id, journalNumber: 'JV-2026-000001' },
    });

    if (!jv1 && accElecExp && accBank && period1) {
      jv1 = await db.journalEntry.create({
        data: {
          accountingEntityId: finEntity.id,
          journalNumber: 'JV-2026-000001',
          journalType: 'GENERAL',
          journalDate: new Date('2026-04-05T00:00:00.000Z'),
          fiscalYearId: fiscalYear26.id,
          accountingPeriodId: period1.id,
          status: 'POSTED',
          description: 'BESCOM Electricity Utility Bill for Pump House & Common Lighting',
          reference: 'BESCOM-APR-2026',
          currency: 'INR',
          totalDebit: 25000,
          totalCredit: 25000,
          postedAt: new Date('2026-04-05T00:00:00.000Z'),
          postedById: adminUser.id,
          createdById: adminUser.id,
          lines: {
            create: [
              {
                lineNumber: 1,
                accountId: accElecExp.id,
                description: 'BESCOM Pump House & Lighting Electricity Bill',
                debitAmount: 25000,
                creditAmount: 0,
                baseAmount: 25000,
                costCenterId: ccElectrical.id,
                fundId: fundGeneral.id,
              },
              {
                lineNumber: 2,
                accountId: accBank.id,
                description: 'HDFC Operating Bank Payment to BESCOM',
                debitAmount: 0,
                creditAmount: 25000,
                baseAmount: 25000,
                fundId: fundGeneral.id,
              },
            ],
          },
        },
        include: { lines: true },
      });

      for (const line of jv1.lines) {
        await db.generalLedgerEntry.create({
          data: {
            accountingEntityId: finEntity.id,
            journalEntryId: jv1.id,
            journalLineId: line.id,
            accountId: line.accountId,
            postingDate: jv1.journalDate,
            fiscalYearId: fiscalYear26.id,
            periodId: period1.id,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            baseAmount: line.baseAmount,
            costCenterId: line.costCenterId,
            fundId: line.fundId,
            sourceModule: 'finance',
            sourceType: 'JournalEntry',
            sourceId: jv1.id,
            postedAt: jv1.postedAt || new Date(),
          },
        });

        const existingBal = await db.accountBalance.findFirst({
          where: {
            accountingEntityId: finEntity.id,
            accountId: line.accountId,
            fiscalYearId: fiscalYear26.id,
            periodId: period1.id,
            fundId: line.fundId,
            costCenterId: line.costCenterId,
          },
        });

        const dr = Number(line.debitAmount);
        const cr = Number(line.creditAmount);

        if (existingBal) {
          await db.accountBalance.update({
            where: { id: existingBal.id },
            data: {
              periodDebit: Number(existingBal.periodDebit) + dr,
              periodCredit: Number(existingBal.periodCredit) + cr,
              closingDebit: Number(existingBal.openingDebit) + Number(existingBal.periodDebit) + dr,
              closingCredit:
                Number(existingBal.openingCredit) + Number(existingBal.periodCredit) + cr,
            },
          });
        } else {
          await db.accountBalance.create({
            data: {
              accountingEntityId: finEntity.id,
              accountId: line.accountId,
              fiscalYearId: fiscalYear26.id,
              periodId: period1.id,
              fundId: line.fundId,
              costCenterId: line.costCenterId,
              openingDebit: 0,
              openingCredit: 0,
              periodDebit: dr,
              periodCredit: cr,
              closingDebit: dr,
              closingCredit: cr,
            },
          });
        }
      }
    }

    // =========================================================================
    // PHASE 14: ENTERPRISE RESIDENT MAINTENANCE BILLING & AR
    // =========================================================================
    // 14.1 Charge Definitions
    const maintSqftCharge = await db.chargeDefinition.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: 'MAINT_SQFT',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        code: 'MAINT_SQFT',
        name: 'Monthly Maintenance Charge',
        description: 'Standard residential maintenance calculated per sqft of built-up area',
        category: 'MAINTENANCE',
        chargeNature: 'AREA_BASED',
        recurrenceType: 'MONTHLY',
        defaultCalculation: 'PER_SQFT',
        defaultUOM: 'SQFT',
        taxable: true,
        accountingMappingKey: 'MAINTENANCE_INCOME',
        isActive: true,
      },
    });

    const sinkingFundCharge = await db.chargeDefinition.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: 'SINKING_FUND',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        code: 'SINKING_FUND',
        name: 'Sinking Fund Contribution',
        description: 'Statutory long-term capital replacement fund contribution',
        category: 'FUND',
        chargeNature: 'FIXED',
        recurrenceType: 'MONTHLY',
        defaultCalculation: 'FIXED_AMOUNT',
        defaultUOM: 'UNIT',
        taxable: false,
        accountingMappingKey: 'SINKING_FUND_LIABILITY',
        isActive: true,
      },
    });

    const parkingSlotCharge = await db.chargeDefinition.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: 'PARKING_SLOT',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        code: 'PARKING_SLOT',
        name: 'Covered Parking Slot Fee',
        description: 'Monthly fee for allocated covered parking bays',
        category: 'PARKING',
        chargeNature: 'UNIT_BASED',
        recurrenceType: 'MONTHLY',
        defaultCalculation: 'PER_PARKING',
        defaultUOM: 'SLOT',
        taxable: true,
        accountingMappingKey: 'MAINTENANCE_INCOME',
        isActive: true,
      },
    });

    const _latePenaltyCharge = await db.chargeDefinition.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: 'LATE_PENALTY',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        code: 'LATE_PENALTY',
        name: 'Late Payment Penalty',
        description: 'Fixed administrative late fee after grace period expiry',
        category: 'PENALTY',
        chargeNature: 'FIXED',
        recurrenceType: 'MONTHLY',
        defaultCalculation: 'FIXED_AMOUNT',
        defaultUOM: 'UNIT',
        taxable: false,
        accountingMappingKey: 'LATE_FEE_INCOME',
        isActive: true,
      },
    });

    // 14.2 Billing Tariff Plan & Rules
    const standardResidentialPlan = await db.billingPlan.upsert({
      where: {
        communityId_code: {
          communityId: community1.id,
          code: 'PLAN_RES_STD',
        },
      },
      update: {},
      create: {
        communityId: community1.id,
        code: 'PLAN_RES_STD',
        name: 'Standard Residential Tariff Plan',
        description: 'Maintenance ₹2.50/sqft + Sinking Fund ₹500 + Parking ₹300',
        recurrenceType: 'MONTHLY',
        effectiveFrom: new Date('2026-01-01'),
        isActive: true,
      },
    });

    // Plan rules
    await db.chargeRule.upsert({
      where: { id: '00000000-0000-0000-0000-000000000091' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000091',
        billingPlanId: standardResidentialPlan.id,
        chargeDefinitionId: maintSqftCharge.id,
        calculationMethod: 'PER_SQFT',
        rate: 2.5,
        dueDays: 10,
        graceDays: 5,
        costCenterId: _ccAdmin.id,
        priority: 1,
        isActive: true,
      },
    });

    await db.chargeRule.upsert({
      where: { id: '00000000-0000-0000-0000-000000000092' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000092',
        billingPlanId: standardResidentialPlan.id,
        chargeDefinitionId: sinkingFundCharge.id,
        calculationMethod: 'FIXED_AMOUNT',
        amount: 500,
        dueDays: 10,
        graceDays: 5,
        fundId: fundSinking.id,
        priority: 2,
        isActive: true,
      },
    });

    await db.chargeRule.upsert({
      where: { id: '00000000-0000-0000-0000-000000000093' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000093',
        billingPlanId: standardResidentialPlan.id,
        chargeDefinitionId: parkingSlotCharge.id,
        calculationMethod: 'PER_PARKING',
        amount: 300,
        dueDays: 10,
        graceDays: 5,
        priority: 3,
        isActive: true,
      },
    });

    // 14.3 Billing Period
    const billingPeriodApr26 = await db.billingPeriod.upsert({
      where: {
        communityId_code: {
          communityId: community1.id,
          code: 'BP_2026_04',
        },
      },
      update: {},
      create: {
        communityId: community1.id,
        name: 'April 2026 Maintenance Billing',
        code: 'BP_2026_04',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
        invoiceDate: new Date('2026-04-01'),
        dueDate: new Date('2026-04-10'),
        graceDate: new Date('2026-04-15'),
        status: 'OPEN',
      },
    });

    // 14.4 Billable Accounts & Resident Accounts for Tower A & B
    const ba101 = await db.billableAccount.upsert({
      where: {
        communityId_accountNumber: {
          communityId: community1.id,
          accountNumber: 'ACC-101',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        unitId: unit101.id,
        householdId: doeHousehold.id,
        accountNumber: 'ACC-101',
        accountType: 'UNIT',
        displayName: 'Unit 101 (Mr. John Doe)',
        status: 'ACTIVE',
      },
    });

    const ra101 = await db.residentAccount.upsert({
      where: { billableAccountId: ba101.id },
      update: {},
      create: {
        billableAccountId: ba101.id,
        accountNumber: 'RA-101',
        openingBalance: 0,
        currentBalance: 0,
      },
    });

    const ba102 = await db.billableAccount.upsert({
      where: {
        communityId_accountNumber: {
          communityId: community1.id,
          accountNumber: 'ACC-102',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        unitId: unit102.id,
        householdId: aliceHousehold.id,
        accountNumber: 'ACC-102',
        accountType: 'UNIT',
        displayName: 'Unit 102 (Jane Smith)',
        status: 'ACTIVE',
      },
    });

    const ra102 = await db.residentAccount.upsert({
      where: { billableAccountId: ba102.id },
      update: {},
      create: {
        billableAccountId: ba102.id,
        accountNumber: 'RA-102',
        openingBalance: 0,
        currentBalance: 0,
      },
    });

    // 14.5 Seeded Invoices, Payments, Receipts, Allocations & Subledger
    const inv101 = await db.invoice.upsert({
      where: {
        communityId_invoiceNumber: {
          communityId: community1.id,
          invoiceNumber: 'INV-2026-000101',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        billableAccountId: ba101.id,
        billingPeriodId: billingPeriodApr26.id,
        invoiceNumber: 'INV-2026-000101',
        invoiceDate: new Date('2026-04-01'),
        dueDate: new Date('2026-04-10'),
        graceDate: new Date('2026-04-15'),
        subtotal: 3800,
        grandTotal: 3800,
        allocatedAmount: 3800,
        outstandingAmount: 0,
        status: 'PAID',
        lines: {
          create: [
            {
              lineNumber: 1,
              chargeDefinitionId: maintSqftCharge.id,
              descriptionSnapshot: 'Monthly Maintenance (1200 sqft @ ₹2.50)',
              periodStart: new Date('2026-04-01'),
              periodEnd: new Date('2026-04-30'),
              quantity: 1200,
              rate: 2.5,
              amount: 3000,
              netAmount: 3000,
              costCenterId: _ccAdmin.id,
              accountingMappingKey: 'MAINTENANCE_INCOME',
            },
            {
              lineNumber: 2,
              chargeDefinitionId: sinkingFundCharge.id,
              descriptionSnapshot: 'Sinking Fund Contribution (Statutory)',
              periodStart: new Date('2026-04-01'),
              periodEnd: new Date('2026-04-30'),
              quantity: 1,
              rate: 500,
              amount: 500,
              netAmount: 500,
              fundId: fundSinking.id,
              accountingMappingKey: 'SINKING_FUND_LIABILITY',
            },
            {
              lineNumber: 3,
              chargeDefinitionId: parkingSlotCharge.id,
              descriptionSnapshot: 'Covered Parking Slot Fee (1 slot)',
              periodStart: new Date('2026-04-01'),
              periodEnd: new Date('2026-04-30'),
              quantity: 1,
              rate: 300,
              amount: 300,
              netAmount: 300,
              accountingMappingKey: 'MAINTENANCE_INCOME',
            },
          ],
        },
      },
    });

    const pay101 = await db.payment.upsert({
      where: { id: '00000000-0000-0000-0000-000000000095' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000095',
        organizationId: org.id,
        communityId: community1.id,
        billableAccountId: ba101.id,
        paymentNumber: 'PAY-2026-000101',
        paymentDate: new Date('2026-04-05'),
        receivedAmount: 3800,
        allocatedAmount: 3800,
        unallocatedAmount: 0,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/20260405/98213812',
        status: 'SUCCESS',
      },
    });

    await db.receipt.upsert({
      where: { id: '00000000-0000-0000-0000-000000000096' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000096',
        communityId: community1.id,
        paymentId: pay101.id,
        billableAccountId: ba101.id,
        receiptNumber: 'RCT-2026-000101',
        receiptDate: new Date('2026-04-05'),
        amount: 3800,
        status: 'SUCCESS',
      },
    });

    await db.paymentAllocation.upsert({
      where: { id: '00000000-0000-0000-0000-000000000097' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000097',
        paymentId: pay101.id,
        invoiceId: inv101.id,
        allocationAmount: 3800,
        allocationRule: 'OLDEST_DUE_FIRST',
        sequence: 1,
      },
    });

    // Subledger entries for Unit 101
    await db.residentLedgerEntry.upsert({
      where: { id: '00000000-0000-0000-0000-000000000098' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000098',
        residentAccountId: ra101.id,
        entryDate: new Date('2026-04-01'),
        entryType: 'INVOICE',
        referenceType: 'INVOICE',
        referenceId: inv101.invoiceNumber,
        debit: 3800,
        credit: 0,
        runningBalance: 3800,
        description: 'Maintenance Invoice INV-2026-000101',
      },
    });

    await db.residentLedgerEntry.upsert({
      where: { id: '00000000-0000-0000-0000-000000000099' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000099',
        residentAccountId: ra101.id,
        entryDate: new Date('2026-04-05'),
        entryType: 'RECEIPT',
        referenceType: 'PAYMENT',
        referenceId: pay101.paymentNumber,
        debit: 0,
        credit: 3800,
        runningBalance: 0,
        description: 'Payment Received (UPI)',
      },
    });

    await db.residentOutstanding.upsert({
      where: { residentAccountId: ra101.id },
      update: {},
      create: {
        residentAccountId: ra101.id,
        currentDue: 0,
        overdue: 0,
        advanceCredit: 0,
        totalOutstanding: 0,
        bucket0To30: 0,
        bucket31To60: 0,
        bucket61To90: 0,
        bucket91Plus: 0,
        collectionStatus: 'CURRENT',
      },
    });

    // Invoice for Unit 102 (Overdue)
    const inv102 = await db.invoice.upsert({
      where: {
        communityId_invoiceNumber: {
          communityId: community1.id,
          invoiceNumber: 'INV-2026-000102',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        communityId: community1.id,
        billableAccountId: ba102.id,
        billingPeriodId: billingPeriodApr26.id,
        invoiceNumber: 'INV-2026-000102',
        invoiceDate: new Date('2026-04-01'),
        dueDate: new Date('2026-04-10'),
        graceDate: new Date('2026-04-15'),
        subtotal: 3800,
        grandTotal: 3800,
        allocatedAmount: 0,
        outstandingAmount: 3800,
        status: 'OVERDUE',
        lines: {
          create: [
            {
              lineNumber: 1,
              chargeDefinitionId: maintSqftCharge.id,
              descriptionSnapshot: 'Monthly Maintenance (1200 sqft @ ₹2.50)',
              periodStart: new Date('2026-04-01'),
              periodEnd: new Date('2026-04-30'),
              quantity: 1200,
              rate: 2.5,
              amount: 3000,
              netAmount: 3000,
              costCenterId: _ccAdmin.id,
              accountingMappingKey: 'MAINTENANCE_INCOME',
            },
            {
              lineNumber: 2,
              chargeDefinitionId: sinkingFundCharge.id,
              descriptionSnapshot: 'Sinking Fund Contribution (Statutory)',
              periodStart: new Date('2026-04-01'),
              periodEnd: new Date('2026-04-30'),
              quantity: 1,
              rate: 500,
              amount: 500,
              netAmount: 500,
              fundId: fundSinking.id,
              accountingMappingKey: 'SINKING_FUND_LIABILITY',
            },
            {
              lineNumber: 3,
              chargeDefinitionId: parkingSlotCharge.id,
              descriptionSnapshot: 'Covered Parking Slot Fee (1 slot)',
              periodStart: new Date('2026-04-01'),
              periodEnd: new Date('2026-04-30'),
              quantity: 1,
              rate: 300,
              amount: 300,
              netAmount: 300,
              accountingMappingKey: 'MAINTENANCE_INCOME',
            },
          ],
        },
      },
    });

    await db.residentLedgerEntry.upsert({
      where: { id: '00000000-0000-0000-0000-000000000100' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000100',
        residentAccountId: ra102.id,
        entryDate: new Date('2026-04-01'),
        entryType: 'INVOICE',
        referenceType: 'INVOICE',
        referenceId: inv102.invoiceNumber,
        debit: 3800,
        credit: 0,
        runningBalance: 3800,
        description: 'Maintenance Invoice INV-2026-000102',
      },
    });

    await db.residentOutstanding.upsert({
      where: { residentAccountId: ra102.id },
      update: {},
      create: {
        residentAccountId: ra102.id,
        currentDue: 0,
        overdue: 3800,
        advanceCredit: 0,
        totalOutstanding: 3800,
        bucket0To30: 3800,
        bucket31To60: 0,
        bucket61To90: 0,
        bucket91Plus: 0,
        collectionStatus: 'OVERDUE',
      },
    });

    // ============================================================================
    // PHASE 15: ENTERPRISE ACCOUNTS PAYABLE & TREASURY SEEDING
    // ============================================================================

    // 15.1 Payment Terms
    const _net30Terms = await db.paymentTerms.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'NET_30' } },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        code: 'NET_30',
        name: 'Net 30 Days',
        days: 30,
        calculationRule: 'FROM_INVOICE_DATE',
        description: 'Payment due within 30 days of invoice date',
        status: 'ACTIVE',
      },
    });

    const _net15Terms = await db.paymentTerms.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'NET_15' } },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        code: 'NET_15',
        name: 'Net 15 Days',
        days: 15,
        calculationRule: 'FROM_INVOICE_DATE',
        description: 'Payment due within 15 days of invoice date',
        status: 'ACTIVE',
      },
    });

    // 15.2 Matching Tolerance Policy
    await db.matchingTolerancePolicy.upsert({
      where: { id: '00000000-0000-0000-0000-000000000091' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000091',
        organization: { connect: { id: org.id } },
        accountingEntityId: finEntity.id,
        name: 'Standard Society AP Tolerance',
        priceTolerancePercent: 2.0,
        priceToleranceAbsolute: 500,
        qtyTolerancePercent: 0,
        qtyToleranceAbsolute: 0,
        totalAmountTolerance: 500,
        isDefault: true,
      },
    });

    // 15.3 Operating Bank Account
    const bankGlAccount = await db.ledgerAccount.findFirst({
      where: { accountingEntityId: finEntity.id, accountCode: '1120' },
    });

    const primaryBankAccount = await db.bankAccount.upsert({
      where: {
        accountingEntityId_maskedAccountNumber: {
          accountingEntityId: finEntity.id,
          maskedAccountNumber: 'XXXXXXXXXX4589',
        },
      },
      update: {},
      create: {
        accountingEntity: { connect: { id: finEntity.id } },
        glAccount: { connect: { id: bankGlAccount!.id } },
        name: 'HDFC Society Operating Account',
        bankName: 'HDFC Bank Ltd',
        accountType: 'CURRENT',
        currency: 'INR',
        maskedAccountNumber: 'XXXXXXXXXX4589',
        routingCode: 'HDFC0000240',
        status: 'ACTIVE',
        isDefault: true,
      },
    });

    // 15.4 Vendor Financial Accounts
    const firstVendor = await db.vendor.findFirst({ where: { organizationId: org.id } });
    let vAccount1 = null;
    if (firstVendor) {
      vAccount1 = await db.vendorAccount.upsert({
        where: {
          accountingEntityId_vendorId: {
            accountingEntityId: finEntity.id,
            vendorId: firstVendor.id,
          },
        },
        update: {},
        create: {
          organization: { connect: { id: org.id } },
          accountingEntity: { connect: { id: finEntity.id } },
          vendor: { connect: { id: firstVendor.id } },
          accountNumber: `VACC-${firstVendor.vendorCode}`,
          currency: 'INR',
          status: 'ACTIVE',
        },
      });

      // 15.5 Sample Supplier Invoice
      if (vAccount1 && firstVendor) {
        const _sampleSupplierInvoice = await db.supplierInvoice.upsert({
          where: {
            organizationId_internalInvoiceNumber: {
              organizationId: org.id,
              internalInvoiceNumber: 'APINV-2026-000001',
            },
          },
          update: {},
          create: {
            organization: { connect: { id: org.id } },
            accountingEntity: { connect: { id: finEntity.id } },
            community: { connect: { id: community1.id } },
            vendor: { connect: { id: firstVendor.id } },
            vendorAccount: { connect: { id: vAccount1.id } },
            supplierInvoiceNumber: 'INV-APEX-2026-041',
            internalInvoiceNumber: 'APINV-2026-000001',
            normalizedInvoiceNumber: 'INVAPEX2026041',
            invoiceDate: new Date('2026-04-10'),
            receivedDate: new Date('2026-04-11'),
            postingDate: new Date('2026-04-11'),
            dueDate: new Date('2026-05-10'),
            currency: 'INR',
            invoiceType: 'PO_GOODS',
            sourceType: 'PO',
            status: 'POSTED',
            matchingStatus: 'MATCHED',
            subtotal: 45000,
            discountTotal: 0,
            taxTotal: 0,
            freightTotal: 0,
            otherCharges: 0,
            grandTotal: 45000,
            paidAmount: 0,
            outstandingAmount: 45000,
            lines: {
              create: [
                {
                  lineNumber: 1,
                  description: 'Elevator Monthly Maintenance Spare Parts',
                  quantity: 10,
                  unitPrice: 4500,
                  netAmount: 45000,
                },
              ],
            },
          },
        });

        // 15.6 Sample Vendor Ledger Entry
        await db.vendorLedgerEntry.upsert({
          where: { id: '00000000-0000-0000-0000-000000000092' },
          update: {},
          create: {
            id: '00000000-0000-0000-0000-000000000092',
            vendorAccount: { connect: { id: vAccount1.id } },
            entryDate: new Date('2026-04-10'),
            entryType: 'SUPPLIER_INVOICE',
            referenceType: 'SUPPLIER_INVOICE',
            referenceId: 'APINV-2026-000001',
            debit: 0,
            credit: 45000,
            runningBalance: 45000,
            currency: 'INR',
            description: 'Supplier Invoice INV-APEX-2026-041 posted',
          },
        });
      }
    }

    // 15.7 Bank Statement & Transactions
    const sampleStatement = await db.bankStatement.upsert({
      where: {
        bankAccountId_statementReference: {
          bankAccountId: primaryBankAccount.id,
          statementReference: 'STMT-2026-04-APR',
        },
      },
      update: {},
      create: {
        bankAccount: { connect: { id: primaryBankAccount.id } },
        statementReference: 'STMT-2026-04-APR',
        periodStart: new Date('2026-04-01'),
        periodEnd: new Date('2026-04-30'),
        openingBalance: 500000,
        closingBalance: 535000,
        currency: 'INR',
        importSource: 'CSV',
        status: 'PARSED',
      },
    });

    await db.bankTransaction.upsert({
      where: {
        bankAccountId_fingerprint: {
          bankAccountId: primaryBankAccount.id,
          fingerprint: 'fp-seed-sample-txn-001',
        },
      },
      update: {},
      create: {
        bankStatement: { connect: { id: sampleStatement.id } },
        bankAccount: { connect: { id: primaryBankAccount.id } },
        transactionDate: new Date('2026-04-05'),
        description: 'UPI/3948293849/Resident Maintenance 101',
        bankReference: 'UPI-REF-001',
        amount: 3500,
        direction: 'CREDIT',
        runningBalance: 503500,
        status: 'UNMATCHED',
        fingerprint: 'fp-seed-sample-txn-001',
      },
    });

    // ============================================================================
    // 16. PHASE 16: ENTERPRISE BUDGETING, PLANNING & FINANCIAL CONTROL
    // ============================================================================
    // 16.1 Budget Assumptions
    await db.budgetAssumption.upsert({
      where: {
        organizationId_name: { organizationId: org.id, name: 'Electricity Tariff Inflation' },
      },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        accountingEntity: { connect: { id: finEntity.id } },
        fiscalYear: { connect: { id: fiscalYear26.id } },
        name: 'Electricity Tariff Inflation',
        value: 8.0,
        unit: '%',
        category: 'UTILITIES',
        description: 'Expected 8% state electricity board tariff increase',
        source: 'State Electricity Regulatory Commission Notification',
      },
    });

    await db.budgetAssumption.upsert({
      where: { organizationId_name: { organizationId: org.id, name: 'General Inflation' } },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        accountingEntity: { connect: { id: finEntity.id } },
        fiscalYear: { connect: { id: fiscalYear26.id } },
        name: 'General Inflation',
        value: 5.0,
        unit: '%',
        category: 'ECONOMIC',
        description: 'Estimated annual inflation benchmark',
        source: 'Reserve Bank Forecast',
      },
    });

    // 16.2 Budget Template
    const repMaintAccount = await db.ledgerAccount.findFirst({
      where: { accountingEntityId: finEntity.id, accountCode: '5100' },
    });
    const mainRevAccount = await db.ledgerAccount.findFirst({
      where: { accountingEntityId: finEntity.id, accountCode: '4100' },
    });

    const standardTemplate = await db.budgetTemplate.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'TPL-SOCIETY-OPEX' } },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        name: 'Standard Society Operating Plan Template',
        code: 'TPL-SOCIETY-OPEX',
        description: 'Standard template for residential society annual budget',
        budgetType: 'OPERATING',
        isDefault: true,
        lines: {
          create: [
            {
              lineNumber: 1,
              account: { connect: { id: mainRevAccount ? mainRevAccount.id : bankGlAccount!.id } },
              lineType: 'REVENUE',
              allocationMethod: 'EQUAL',
              weightPercent: 100.0,
              description: 'Resident Maintenance Fees Revenue',
            },
            {
              lineNumber: 2,
              account: {
                connect: { id: repMaintAccount ? repMaintAccount.id : bankGlAccount!.id },
              },
              lineType: 'OPEX',
              allocationMethod: 'SEASONAL',
              weightPercent: 40.0,
              description: 'Routine Repairs & Maintenance Expense',
            },
          ],
        },
      },
    });

    // 16.3 CAPEX Initiatives
    const sinkingFund = await db.fund.findFirst({
      where: { accountingEntityId: finEntity.id, code: 'SINKING' },
    });

    const _liftCapex = await db.capexInitiative.upsert({
      where: { communityId_code: { communityId: community1.id, code: 'CAPEX-2026-LIFT' } },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'CAPEX-2026-LIFT',
        name: 'Tower A & B Lift Modernization & VFD Upgrade',
        description: 'Complete overhaul of 4 traction elevator controllers and safety mechanisms',
        category: 'LIFT',
        priority: 'HIGH',
        businessJustification:
          'Elevators have completed 15 years lifespan; frequent safety trips reported',
        estimatedCost: 3500000,
        approvedBudget: 3500000,
        committedCost: 2000000,
        actualCost: 800000,
        forecastCost: 3500000,
        physicalProgressPercent: 45.0,
        plannedStart: new Date('2026-04-01'),
        plannedEnd: new Date('2026-09-30'),
        status: 'IN_PROGRESS',
        sponsor: 'Technical & Infrastructure Committee',
        fund: sinkingFund ? { connect: { id: sinkingFund.id } } : undefined,
      },
    });

    // 16.4 Fund Plan
    if (sinkingFund) {
      await db.fundPlan.upsert({
        where: { fundId_fiscalYearId: { fundId: sinkingFund.id, fiscalYearId: fiscalYear26.id } },
        update: {},
        create: {
          fund: { connect: { id: sinkingFund.id } },
          fiscalYear: { connect: { id: fiscalYear26.id } },
          openingAvailable: 5000000,
          plannedContribution: 2400000,
          actualContribution: 400000,
          plannedUsage: 3500000,
          actualUsage: 800000,
          committedUsage: 1200000,
          forecastContribution: 2400000,
          forecastUsage: 3500000,
          projectedClosing: 3900000,
          notes: 'Fund plan aligned with Lift Modernization and scheduled roof waterproofing',
        },
      });
    }

    // 16.5 Official Annual Operating Plan (Approved Budget)
    const annualBudget = await db.budget.upsert({
      where: {
        organizationId_budgetNumber: { organizationId: org.id, budgetNumber: 'BUD-FY26-00001' },
      },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        accountingEntity: { connect: { id: finEntity.id } },
        community: { connect: { id: community1.id } },
        fiscalYear: { connect: { id: fiscalYear26.id } },
        budgetNumber: 'BUD-FY26-00001',
        name: 'FY 2026-27 Approved Annual Operating Plan',
        description: 'Comprehensive AOP approved by General Body for FY 2026-27',
        budgetType: 'OPERATING',
        scenarioType: 'BASE',
        status: 'ACTIVE',
        currency: 'INR',
        versionNumber: 1,
        template: { connect: { id: standardTemplate.id } },
        effectiveFrom: new Date('2026-04-01'),
        effectiveTo: new Date('2027-03-31'),
        totalRevenue: 24000000,
        totalOpex: 18000000,
        totalCapex: 3500000,
        totalNetBudget: 2500000,
        submittedAt: new Date('2026-03-15'),
        approvedAt: new Date('2026-03-25'),
        approvedById: adminUser.id,
        createdById: adminUser.id,
        lines: {
          create: [
            {
              lineNumber: 1,
              account: { connect: { id: mainRevAccount ? mainRevAccount.id : bankGlAccount!.id } },
              lineType: 'REVENUE',
              description: 'Annual Maintenance Assessment (Units & Villas)',
              annualAmount: 24000000,
              currentAmount: 24000000,
              allocationMethod: 'EQUAL',
            },
            {
              lineNumber: 2,
              account: {
                connect: { id: repMaintAccount ? repMaintAccount.id : bankGlAccount!.id },
              },
              lineType: 'OPEX',
              description: 'Repairs & Maintenance Annual Provision',
              annualAmount: 18000000,
              currentAmount: 18000000,
              allocationMethod: 'EQUAL',
            },
          ],
        },
      },
      include: { lines: true },
    });

    // Populate period allocations for line 1 and 2
    for (const line of annualBudget.lines) {
      const monthlyAmount = Number(line.annualAmount) / 12;
      for (const p of fiscalYear26.periods) {
        await db.budgetPeriodAllocation.upsert({
          where: {
            budgetLineId_accountingPeriodId: { budgetLineId: line.id, accountingPeriodId: p.id },
          },
          update: {},
          create: {
            budgetLine: { connect: { id: line.id } },
            accountingPeriod: { connect: { id: p.id } },
            amount: monthlyAmount,
            allocationMethod: 'EQUAL',
          },
        });
      }

      // Initial Balance Projection
      await db.budgetBalanceProjection.upsert({
        where: { budgetLineId: line.id },
        update: {},
        create: {
          budgetLine: { connect: { id: line.id } },
          originalBudget: line.annualAmount,
          currentApprovedBudget: line.annualAmount,
          actualYtd: 0,
          commitments: 0,
          reservations: 0,
          availableBudget: line.annualAmount,
          forecastFullYear: line.annualAmount,
          utilizationPercent: 0,
        },
      });
    }

    console.info(
      '✅ Seeded Phase 16 Enterprise Budgeting, Planning & Financial Control (Assumptions, Templates, Capex Initiatives, Fund Plans, Approved AOP & Projections)',
    );
    // ==========================================
    // Phase 18: Enterprise Security, Gate & Visitor Management Seed Data
    // ==========================================

    // 18.1 Security Gates
    const mainGate = await db.securityGate.upsert({
      where: { communityId_code: { communityId: community1.id, code: 'GATE-MAIN-01' } },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'GATE-MAIN-01',
        name: 'Main North Gate 1',
        gateType: 'MAIN',
        directionPolicy: 'ENTRY_AND_EXIT',
        status: 'ACTIVE',
        locationDescription: 'North perimeter access road opposite clubhouse boulevard',
        supportsVehicleEntry: true,
        supportsPedestrianEntry: true,
        supportsDelivery: true,
        supportsContractorEntry: false,
        createdBy: { connect: { id: adminUser.id } },
      },
    });

    const _serviceGate = await db.securityGate.upsert({
      where: { communityId_code: { communityId: community1.id, code: 'GATE-SERV-02' } },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'GATE-SERV-02',
        name: 'South Service Gate 2',
        gateType: 'SERVICE',
        directionPolicy: 'ENTRY_AND_EXIT',
        status: 'ACTIVE',
        locationDescription:
          'South utility bay for contractors, material freight and service trucks',
        supportsVehicleEntry: true,
        supportsPedestrianEntry: true,
        supportsDelivery: true,
        supportsContractorEntry: true,
        createdBy: { connect: { id: adminUser.id } },
      },
    });

    // 18.2 Security Posts
    await db.securityPost.upsert({
      where: { gateId_code: { gateId: mainGate.id, code: 'POST-MAIN-LANE-A' } },
      update: {},
      create: {
        gate: { connect: { id: mainGate.id } },
        code: 'POST-MAIN-LANE-A',
        name: 'Main Gate — Vehicle Lane A Guard Cabin',
        status: 'ACTIVE',
      },
    });

    // 18.3 Access Zones
    await db.accessZone.upsert({
      where: { communityId_code: { communityId: community1.id, code: 'ZONE-PERIMETER' } },
      update: {},
      create: {
        organizationId: org.id,
        community: { connect: { id: community1.id } },
        code: 'ZONE-PERIMETER',
        name: 'Community Perimeter & Internal Roads',
        zoneType: 'GENERAL',
      },
    });

    await db.accessZone.upsert({
      where: { communityId_code: { communityId: community1.id, code: 'ZONE-TOWER-A' } },
      update: {},
      create: {
        organizationId: org.id,
        community: { connect: { id: community1.id } },
        code: 'ZONE-TOWER-A',
        name: 'Tower A Residential Lobby & Lifts',
        zoneType: 'RESIDENTIAL_CORE',
      },
    });

    // 18.4 Visitor Profile
    const visitorPhone = '+12025550999';
    const phoneHash = crypto.createHash('sha256').update(visitorPhone).digest('hex');

    let visitor1 = await db.visitorProfile.findFirst({
      where: { communityId: community1.id, phoneHash },
    });

    if (!visitor1) {
      visitor1 = await db.visitorProfile.create({
        data: {
          organization: { connect: { id: org.id } },
          community: { connect: { id: community1.id } },
          name: 'Robert Taylor',
          phone: visitorPhone,
          phoneHash,
          vehicleNumber: 'KA-01-MJ-5520',
          normalizedVehicleNumber: 'KA01MJ5520',
        },
      });
    }

    // 18.5 Pre-Approved Visitor Invitation
    const invitation = await db.visitorInvitation.upsert({
      where: { invitationNumber: 'INV-2026-000001' },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        invitationNumber: 'INV-2026-000001',
        hostResident: { connect: { id: johnResident.id } },
        destinationUnit: { connect: { id: unit101.id } },
        visitorName: 'Robert Taylor',
        phone: visitorPhone,
        visitType: 'GUEST',
        purpose: 'Weekend Family Dinner',
        expectedFrom: new Date('2026-05-15T18:00:00Z'),
        expectedUntil: new Date('2026-05-15T23:00:00Z'),
        entryCountLimit: 1,
        vehicleExpected: true,
        vehicleNumber: 'KA-01-MJ-5520',
        status: 'ACTIVE',
        createdBy: { connect: { id: adminUser.id } },
      },
    });

    // 18.6 Access Pass
    const rawQrToken = 'TOKEN-SEC-SAMPLE-QR-2026-XYZ999';
    const tokenHash = crypto.createHash('sha256').update(rawQrToken).digest('hex');

    await db.accessPass.upsert({
      where: { passNumber: 'PASS-2026-000001' },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        passNumber: 'PASS-2026-000001',
        invitation: { connect: { id: invitation.id } },
        passType: 'SINGLE_ENTRY',
        credentialType: 'QR',
        credentialHash: tokenHash,
        rawTokenPreview: 'TOKEN-SEC-***',
        validFrom: new Date('2026-05-15T18:00:00Z'),
        validUntil: new Date('2026-05-15T23:00:00Z'),
        entryLimit: 1,
        entriesUsed: 1,
        status: 'ACTIVE',
      },
    });

    // 18.7 Checked-In Visit & ActiveVisit Projection
    const visit1 = await db.visit.upsert({
      where: { visitNumber: 'VIS-2026-000001' },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        visitNumber: 'VIS-2026-000001',
        visitor: { connect: { id: visitor1.id } },
        visitType: 'GUEST',
        purpose: 'Weekend Family Dinner',
        hostResident: { connect: { id: johnResident.id } },
        destinationUnit: { connect: { id: unit101.id } },
        invitation: { connect: { id: invitation.id } },
        status: 'ACTIVE',
        expectedFrom: new Date('2026-05-15T18:00:00Z'),
        expectedUntil: new Date('2026-05-15T23:00:00Z'),
        actualCheckIn: new Date('2026-05-15T18:15:00Z'),
        entryGate: { connect: { id: mainGate.id } },
        vehicleNumber: 'KA-01-MJ-5520',
        approvalStatus: 'APPROVED',
      },
    });

    await db.activeVisit.upsert({
      where: { visitId: visit1.id },
      update: {},
      create: {
        visit: { connect: { id: visit1.id } },
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        visitor: { connect: { id: visitor1.id } },
        visitorName: 'Robert Taylor',
        visitType: 'GUEST',
        destinationUnitNumber: '101',
        checkInTime: new Date('2026-05-15T18:15:00Z'),
        entryGate: { connect: { id: mainGate.id } },
        vehicleNumber: 'KA-01-MJ-5520',
      },
    });

    // 18.8 Domestic Help Recurring Service Access
    const household1 = await db.household.findFirst({ where: { communityId: community1.id } });
    if (household1) {
      await db.householdServiceAccess.create({
        data: {
          community: { connect: { id: community1.id } },
          household: { connect: { id: household1.id } },
          unit: { connect: { id: unit101.id } },
          servicePersonName: 'Maria Santos',
          phone: '+12025550777',
          serviceType: 'MAID',
          validFrom: new Date('2026-01-01'),
          validUntil: new Date('2026-12-31'),
          allowedDays: 'MON,TUE,WED,THU,FRI,SAT',
          allowedTimeStart: '07:00',
          allowedTimeEnd: '19:00',
          status: 'ACTIVE',
        },
      });
    }

    // 18.9 Contractor Access Authorization
    const vendor1 = await db.vendor.findFirst({ where: { organizationId: org.id } });
    if (vendor1) {
      const _contractorAuth = await db.contractorAccessAuthorization.create({
        data: {
          organization: { connect: { id: org.id } },
          community: { connect: { id: community1.id } },
          vendor: { connect: { id: vendor1.id } },
          title: 'Elevator Modernization Site Crew Access',
          authorizedFrom: new Date('2026-04-01T08:00:00Z'),
          authorizedUntil: new Date('2026-09-30T19:00:00Z'),
          allowedGates: 'GATE-SERV-02',
          workerLimit: 8,
          timeWindows: '08:00-19:00',
          status: 'ACTIVE',
          workers: {
            create: [
              {
                vendor: { connect: { id: vendor1.id } },
                workerReference: 'WRK-APEX-001',
                name: 'Suresh Kumar',
                phone: '+12025550881',
                skillTrade: 'Senior Elevator Rigging Technician',
                status: 'ACTIVE',
              },
              {
                vendor: { connect: { id: vendor1.id } },
                workerReference: 'WRK-APEX-002',
                name: 'Ramesh Patel',
                phone: '+12025550882',
                skillTrade: 'Control Panel Electrician',
                status: 'ACTIVE',
              },
            ],
          },
        },
      });
    }

    // 18.10 Security Watchlist Entry
    await db.watchlistEntry.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        subjectType: 'VEHICLE',
        subjectIdentifier: 'KA-05-XY-9999',
        normalizedKey: 'KA05XY9999',
        severity: 'HIGH',
        action: 'REQUIRE_SUPERVISOR',
        reason: 'Unauthorized parking violation & speeding on boulevard',
        validFrom: new Date('2026-01-01T00:00:00Z'),
        status: 'ACTIVE',
        createdBy: { connect: { id: adminUser.id } },
      },
    });

    console.info(
      '✅ Seeded Phase 18 Enterprise Security, Gate & Visitor Management (Gates, Posts, Zones, Pre-Approved Passes, Active Visits, Domestic Help, Contractor Authorization & Watchlists)',
    );
    // ==========================================
    // PHASE 19: ENTERPRISE PARKING & VEHICLES
    // ==========================================
    console.info('🚗 Seeding Phase 19 Enterprise Parking & Vehicle Registry...');

    // 19.1 Parking Areas & Zones
    const parkingAreaB1 = await db.parkingArea.upsert({
      where: {
        communityId_code: {
          communityId: community1.id,
          code: 'AREA-B1',
        },
      },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'AREA-B1',
        name: 'Basement 1 Resident & EV Parking',
        type: 'BASEMENT',
        totalCapacity: 50,
        status: 'ACTIVE',
      },
    });

    const parkingAreaVisitor = await db.parkingArea.upsert({
      where: {
        communityId_code: {
          communityId: community1.id,
          code: 'AREA-VIS-01',
        },
      },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'AREA-VIS-01',
        name: 'Visitor & Drop-off Surface Parking',
        type: 'VISITOR',
        totalCapacity: 20,
        status: 'ACTIVE',
      },
    });

    const zoneA = await db.parkingZone.upsert({
      where: {
        parkingAreaId_code: {
          parkingAreaId: parkingAreaB1.id,
          code: 'ZONE-A',
        },
      },
      update: {},
      create: {
        parkingArea: { connect: { id: parkingAreaB1.id } },
        code: 'ZONE-A',
        name: 'Tower A Basement Zone',
        description: 'Direct lift lobby access to Tower A',
      },
    });

    // 19.2 Parking Slots
    const slot101 = await db.parkingSlot.upsert({
      where: {
        parkingAreaId_slotNumber: {
          parkingAreaId: parkingAreaB1.id,
          slotNumber: 'B1-A-101',
        },
      },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        parkingArea: { connect: { id: parkingAreaB1.id } },
        zone: { connect: { id: zoneA.id } },
        slotNumber: 'B1-A-101',
        slotType: 'CAR',
        status: 'AVAILABLE',
        ownershipModel: 'UNIT_LINKED',
      },
    });

    // Find DG-01 or any asset for EV Charger linkage
    const evAsset = await db.asset.findFirst({ where: { communityId: community1.id } });

    const _slot102 = await db.parkingSlot.upsert({
      where: {
        parkingAreaId_slotNumber: {
          parkingAreaId: parkingAreaB1.id,
          slotNumber: 'B1-A-102-EV',
        },
      },
      update: {},
      create: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        parkingArea: { connect: { id: parkingAreaB1.id } },
        zone: { connect: { id: zoneA.id } },
        slotNumber: 'B1-A-102-EV',
        slotType: 'EV_CAR',
        isEvEnabled: true,
        chargerAsset: evAsset ? { connect: { id: evAsset.id } } : undefined,
        status: 'AVAILABLE',
        ownershipModel: 'COMMON',
      },
    });

    // Seed 5 Visitor Slots
    for (let i = 1; i <= 5; i++) {
      const slotNum = `VIS-${String(i).padStart(3, '0')}`;
      await db.parkingSlot.upsert({
        where: {
          parkingAreaId_slotNumber: {
            parkingAreaId: parkingAreaVisitor.id,
            slotNumber: slotNum,
          },
        },
        update: {},
        create: {
          organization: { connect: { id: org.id } },
          community: { connect: { id: community1.id } },
          parkingArea: { connect: { id: parkingAreaVisitor.id } },
          slotNumber: slotNum,
          slotType: 'VISITOR',
          status: 'AVAILABLE',
          ownershipModel: 'VISITOR_POOL',
        },
      });
    }

    // 19.3 Vehicle & Vehicle Authorization for John Doe (Unit 101)
    const johnVehicle = await db.vehicle.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        registrationNumber: 'KA-01-MJ-5520',
        normalizedRegistrationNumber: 'KA01MJ5520',
        vehicleType: 'CAR',
        make: 'Honda',
        model: 'City ZX',
        color: 'Platinum White',
        fuelType: 'PETROL',
        isEv: false,
        status: 'ACTIVE',
        primaryOwnerType: 'RESIDENT',
        authorizations: {
          create: {
            unit: { connect: { id: unit101.id } },
            household: household1 ? { connect: { id: household1.id } } : undefined,
            resident: { connect: { id: johnResident.id } },
            authorizationType: 'OWNER',
            validFrom: new Date('2024-06-01T00:00:00Z'),
            status: 'ACTIVE',
            verificationStatus: 'VERIFIED',
            verifiedBy: { connect: { id: adminUser.id } },
            verifiedAt: new Date('2024-06-02T10:00:00Z'),
          },
        },
      },
    });

    // 19.4 Parking Right for Unit 101 (2 Car rights)
    const unit101Right = await db.parkingRight.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        unit: { connect: { id: unit101.id } },
        household: household1 ? { connect: { id: household1.id } } : undefined,
        resident: { connect: { id: johnResident.id } },
        rightType: 'OWNED_REFERENCE',
        slotTypeEligibility: 'CAR',
        quantity: 2,
        validFrom: new Date('2024-06-01T00:00:00Z'),
        status: 'ACTIVE',
      },
    });

    // 19.5 Parking Allocation for Slot B1-A-101
    const alloc101 = await db.parkingAllocation.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        parkingRight: { connect: { id: unit101Right.id } },
        parkingSlot: { connect: { id: slot101.id } },
        vehicle: { connect: { id: johnVehicle.id } },
        unit: { connect: { id: unit101.id } },
        household: household1 ? { connect: { id: household1.id } } : undefined,
        allocationType: 'PERMANENT',
        validFrom: new Date('2024-06-01T00:00:00Z'),
        status: 'ACTIVE',
      },
    });

    // 19.6 Parking Permit & RFID Tag
    await db.parkingPermit.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        vehicle: { connect: { id: johnVehicle.id } },
        parkingRight: { connect: { id: unit101Right.id } },
        allocation: { connect: { id: alloc101.id } },
        permitNumber: 'PRMIT-2026-000001',
        permitType: 'RESIDENT',
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validUntil: new Date('2026-12-31T23:59:59Z'),
        status: 'ACTIVE',
        rfidCredentialTag: 'RFID-KA01-5520',
      },
    });

    // 19.7 Parking Capacity Summary
    await db.parkingCapacitySummary.upsert({
      where: { communityId: community1.id },
      update: {},
      create: {
        community: { connect: { id: community1.id } },
        totalSlots: 57,
        allocatedSlots: 1,
        occupiedSlots: 0,
        visitorCapacity: 20,
        visitorOccupied: 0,
        evSlots: 1,
        accessibleSlots: 0,
      },
    });

    console.info(
      '✅ Seeded Phase 19 Enterprise Parking & Vehicles (Areas, Zones, Slots, Vehicle Registry, Rights, Allocations, Permits, RFID & Capacity Summary)',
    );

    // ==========================================
    // Phase 20: Enterprise Amenities, Facilities & Booking Management
    // ==========================================
    console.info('🌱 Seeding Phase 20 Enterprise Amenities & Booking Management...');
    await db.amenity.deleteMany({ where: { communityId: community1.id } });

    // 20.1 Badminton Arena (Free, Instant, 2 Courts)
    const badmintonAmenity = await db.amenity.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'AMN-BADMINTON',
        name: 'Indoor Badminton Arena',
        description: 'Two competition-grade wooden floor badminton courts with pro lighting.',
        category: 'SPORTS',
        status: 'ACTIVE',
        bookingMode: 'INSTANT',
        capacity: 4,
        requiresBooking: true,
        requiresApproval: false,
        guestAllowed: true,
        isPaid: false,
        locationReference: 'Clubhouse Level 2',
        displayOrder: 1,
      },
    });

    const court1 = await db.amenityResource.create({
      data: {
        amenity: { connect: { id: badmintonAmenity.id } },
        code: 'BADM-CRT-01',
        name: 'Badminton Court 1',
        description: 'Court 1 (East Wing)',
        resourceType: 'EXCLUSIVE',
        capacity: 4,
        status: 'ACTIVE',
        isExclusive: true,
      },
    });

    const _court2 = await db.amenityResource.create({
      data: {
        amenity: { connect: { id: badmintonAmenity.id } },
        code: 'BADM-CRT-02',
        name: 'Badminton Court 2',
        description: 'Court 2 (West Wing)',
        resourceType: 'EXCLUSIVE',
        capacity: 4,
        status: 'ACTIVE',
        isExclusive: true,
      },
    });

    // Operating Schedules (06:00 to 22:00 for each day of the week)
    for (let day = 0; day <= 6; day++) {
      await db.amenityOperatingSchedule.create({
        data: {
          amenity: { connect: { id: badmintonAmenity.id } },
          dayOfWeek: day,
          openTime: '06:00',
          closeTime: '22:00',
        },
      });
    }

    // Badminton Booking Policy
    await db.amenityBookingPolicy.create({
      data: {
        amenity: { connect: { id: badmintonAmenity.id } },
        name: 'Standard Badminton Policy',
        slotModel: 'FIXED_SLOT',
        slotDurationMinutes: 60,
        minimumDurationMinutes: 60,
        maximumDurationMinutes: 120,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        advanceBookingDays: 14,
        minimumNoticeMinutes: 0,
        maxActiveBookingsPerUnit: 2,
        maxBookingsPerWeekPerUnit: 5,
        maxGuests: 3,
        requiresCheckIn: true,
        checkInGraceMinutes: 15,
        requiresTermsAcceptance: true,
        isDefault: true,
      },
    });

    // Badminton Pricing Policy (Free)
    await db.amenityPricingPolicy.create({
      data: {
        amenity: { connect: { id: badmintonAmenity.id } },
        name: 'Free Resident Tier',
        pricingType: 'FREE',
        baseRate: 0,
        depositAmount: 0,
        isDefault: true,
      },
    });

    // 20.2 Grand Clubhouse Party Hall (Paid, Approval Required)
    const partyHallAmenity = await db.amenity.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'AMN-PARTY-HALL',
        name: 'Grand Clubhouse Party Hall',
        description:
          'Banquet hall with attached lawn, audio-visual equipment, and catering prep area.',
        category: 'EVENT',
        status: 'ACTIVE',
        bookingMode: 'APPROVAL_REQUIRED',
        capacity: 150,
        requiresBooking: true,
        requiresApproval: true,
        guestAllowed: true,
        isPaid: true,
        locationReference: 'Clubhouse Ground Floor',
        displayOrder: 2,
      },
    });

    const _mainHallResource = await db.amenityResource.create({
      data: {
        amenity: { connect: { id: partyHallAmenity.id } },
        code: 'HALL-MAIN-01',
        name: 'Grand Ballroom & Stage',
        description: 'Main air-conditioned hall with projector and sound system.',
        resourceType: 'EXCLUSIVE',
        capacity: 150,
        status: 'ACTIVE',
        isExclusive: true,
      },
    });

    for (let day = 0; day <= 6; day++) {
      await db.amenityOperatingSchedule.create({
        data: {
          amenity: { connect: { id: partyHallAmenity.id } },
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: '23:00',
        },
      });
    }

    // Party Hall Policies
    await db.amenityBookingPolicy.create({
      data: {
        amenity: { connect: { id: partyHallAmenity.id } },
        name: 'Event Booking Policy',
        slotModel: 'FLEXIBLE_DURATION',
        slotDurationMinutes: 240,
        minimumDurationMinutes: 240,
        maximumDurationMinutes: 480,
        bufferBeforeMinutes: 30,
        bufferAfterMinutes: 60, // 1 hour cleaning buffer
        advanceBookingDays: 60,
        minimumNoticeMinutes: 2880, // 48 hours notice
        maxActiveBookingsPerUnit: 1,
        maxBookingsPerWeekPerUnit: 1,
        maxGuests: 150,
        requiresCheckIn: true,
        checkInGraceMinutes: 30,
        requiresTermsAcceptance: true,
        isDefault: true,
      },
    });

    await db.amenityPricingPolicy.create({
      data: {
        amenity: { connect: { id: partyHallAmenity.id } },
        name: 'Standard Event Pricing',
        pricingType: 'FLAT',
        baseRate: 5000.0,
        depositAmount: 10000.0,
        isDefault: true,
      },
    });

    await db.amenityDepositPolicy.create({
      data: {
        amenity: { connect: { id: partyHallAmenity.id } },
        name: 'Hall Security Deposit Policy',
        depositAmount: 10000.0,
        refundable: true,
        damageDeductionRules:
          'Deep cleaning deduction ₹1,500 if uncleaned. Audio-visual damage at actual repair cost.',
      },
    });

    await db.amenityCancellationPolicy.create({
      data: {
        amenity: { connect: { id: partyHallAmenity.id } },
        name: 'Standard Event Cancellation',
        cutoffHours: 48,
        outcome: 'FULL_REFUND',
        cancellationFeePercent: 0,
      },
    });

    // 20.3 Olympic Swimming Pool (Capacity Based)
    const poolAmenity = await db.amenity.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'AMN-POOL',
        name: 'Infinity Swimming Pool',
        description: '25m temperature-controlled lap pool and kiddie splash pool.',
        category: 'FITNESS',
        status: 'ACTIVE',
        bookingMode: 'INSTANT',
        capacity: 50,
        requiresBooking: true,
        requiresApproval: false,
        guestAllowed: true,
        isPaid: false,
        locationReference: 'Podium Level',
        displayOrder: 3,
      },
    });

    await db.amenityResource.create({
      data: {
        amenity: { connect: { id: poolAmenity.id } },
        code: 'POOL-MAIN',
        name: 'Main Lap Pool',
        description: 'Capacity managed lap pool',
        resourceType: 'CAPACITY_BASED',
        capacity: 50,
        status: 'ACTIVE',
        isExclusive: false,
      },
    });

    for (let day = 0; day <= 6; day++) {
      await db.amenityOperatingSchedule.create({
        data: {
          amenity: { connect: { id: poolAmenity.id } },
          dayOfWeek: day,
          openTime: '06:00',
          closeTime: '21:00',
        },
      });
    }

    // 20.4 Sample Confirmed Booking for John Doe (Unit 101) on Court 1
    const bookingStartTime = new Date();
    bookingStartTime.setDate(bookingStartTime.getDate() + 1);
    bookingStartTime.setHours(18, 0, 0, 0);

    const bookingEndTime = new Date(bookingStartTime);
    bookingEndTime.setHours(19, 0, 0, 0);

    const _sampleBooking = await db.amenityBooking.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        bookingNumber: 'AMB-2026-000001',
        amenity: { connect: { id: badmintonAmenity.id } },
        resource: { connect: { id: court1.id } },
        bookedByResident: { connect: { id: johnResident.id } },
        household: household1 ? { connect: { id: household1.id } } : undefined,
        unit: { connect: { id: unit101.id } },
        bookingType: 'SPORT',
        startAt: bookingStartTime,
        endAt: bookingEndTime,
        participantCount: 2,
        guestCount: 1,
        status: 'CONFIRMED',
        approvalStatus: 'NOT_REQUIRED',
        basePrice: 0,
        depositAmount: 0,
        totalCharged: 0,
        depositStatus: 'NOT_REQUIRED',
        termsAcceptedAt: new Date(),
      },
    });

    // 20.5 Amenity Utilization Summary
    await db.amenityUtilizationSummary.create({
      data: {
        community: { connect: { id: community1.id } },
        amenity: { connect: { id: badmintonAmenity.id } },
        totalBookings: 1,
        totalHoursBooked: 1.0,
        totalRevenue: 0,
        utilizationRatePercent: 78.5,
      },
    });

    console.info(
      '✅ Seeded Phase 20 Enterprise Amenities, Resources, Operating Schedules, Policies, Bookings & Utilization Summaries',
    );

    // ==========================================
    // Phase 21: Enterprise Staff & Workforce Management
    // ==========================================
    console.info('🌱 Seeding Phase 21 Enterprise Staff & Workforce Management...');
    // Clean up dependent Phase 24/25 tables before worker teardown
    await db.aIResponseFeedback.deleteMany();
    await db.aIInteractionAudit.deleteMany();
    await db.safetyPermitToWork.deleteMany();
    await db.incidentInvestigation.deleteMany();
    await db.incidentResponderAssignment.deleteMany();
    await db.incidentCommandTransfer.deleteMany();
    await db.incidentCommand.deleteMany();
    await db.safetyIncident.deleteMany();
    await db.worker.deleteMany({ where: { organizationId: org.id } });
    await db.workforceJobRole.deleteMany({ where: { organizationId: org.id } });
    await db.workforceDepartment.deleteMany({ where: { organizationId: org.id } });
    await db.workforceSkill.deleteMany({ where: { organizationId: org.id } });
    await db.shiftTemplate.deleteMany({ where: { organizationId: org.id } });
    await db.workforceRoster.deleteMany({ where: { organizationId: org.id } });
    await db.attendanceDevice.deleteMany({ where: { organizationId: org.id } });

    // 21.1 Departments
    const deptEngineering = await db.workforceDepartment.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'DEPT-ENG',
        name: 'Engineering & Maintenance',
        description: 'Electrical, mechanical, plumbing, and HVAC maintenance engineering team.',
      },
    });

    const deptSecurity = await db.workforceDepartment.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'DEPT-SEC',
        name: 'Security Operations',
        description: 'Physical gate guarding, perimeter surveillance, and emergency response.',
      },
    });

    const _deptFacility = await db.workforceDepartment.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'DEPT-FAC',
        name: 'Facility & Clubhouse Operations',
        description: 'Amenity supervision, common area management, and guest services.',
      },
    });

    // 21.2 Job Roles
    const roleElectrician = await db.workforceJobRole.create({
      data: {
        organization: { connect: { id: org.id } },
        department: { connect: { id: deptEngineering.id } },
        code: 'ROLE-ELEC',
        name: 'Senior Electrician',
        trade: 'ELECTRICAL',
        description: 'HT/LT power distribution, DG maintenance, and panel repairs.',
      },
    });

    const rolePlumber = await db.workforceJobRole.create({
      data: {
        organization: { connect: { id: org.id } },
        department: { connect: { id: deptEngineering.id } },
        code: 'ROLE-PLUMB',
        name: 'Plumber & Pump Operator',
        trade: 'PLUMBING',
        description: 'Hydro-pneumatic systems, plumbing reticulation, and STP operations.',
      },
    });

    const roleGuard = await db.workforceJobRole.create({
      data: {
        organization: { connect: { id: org.id } },
        department: { connect: { id: deptSecurity.id } },
        code: 'ROLE-GUARD',
        name: 'Security Guard',
        trade: 'SECURITY',
        description: 'Access control, gate logging, visitor verification, and patrols.',
      },
    });

    // 21.3 Skills
    const skillHT = await db.workforceSkill.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'SKILL-HT',
        name: 'HT Panel & Transformer Operation',
        category: 'ELECTRICAL',
        description: '11kV substation handling and high-voltage breaker switching.',
      },
    });

    const skillPump = await db.workforceSkill.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'SKILL-PUMP',
        name: 'Pump & Motor Maintenance',
        category: 'MECHANICAL',
        description: 'Centrifugal, submersible, and booster pump troubleshooting.',
      },
    });

    const skillCCTV = await db.workforceSkill.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'SKILL-CCTV',
        name: 'CCTV & Access Control Monitoring',
        category: 'SECURITY',
        description: 'Command center monitoring, ANPR surveillance, and perimeter alarms.',
      },
    });

    // 21.4 Direct Employees (Electrician Rajesh & Plumber Suresh)
    const workerElectrician = await db.worker.create({
      data: {
        organization: { connect: { id: org.id } },
        primaryCommunity: { connect: { id: community1.id } },
        workerNumber: 'WRK-2026-000101',
        workerType: 'EMPLOYEE',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        displayName: 'Rajesh Kumar (Electrician)',
        phone: '+919876543210',
        email: 'rajesh.kumar@communityos.io',
        gender: 'MALE',
        status: 'ACTIVE',
        engagements: {
          create: {
            organizationId: org.id,
            communityId: community1.id,
            engagementType: 'DIRECT_EMPLOYMENT',
            employmentReference: 'EMP-2026-0101',
            startDate: new Date('2024-01-01'),
            department: { connect: { id: deptEngineering.id } },
            jobRole: { connect: { id: roleElectrician.id } },
            status: 'ACTIVE',
          },
        },
        skills: {
          create: {
            skill: { connect: { id: skillHT.id } },
            proficiencyLevel: 'ADVANCED',
            verified: true,
            verifiedBy: { connect: { id: adminUser.id } },
          },
        },
        certifications: {
          create: {
            name: 'Licensed High Tension Electrical Supervisor Certificate',
            certificationType: 'ELECTRICAL_LICENSE',
            certificateNumber: 'HT-LIC-2026-8899',
            issuedBy: 'State Electricity Licensing Board',
            issueDate: new Date('2024-01-15'),
            expiryDate: new Date('2027-12-31'),
            verificationStatus: 'VERIFIED',
          },
        },
      },
    });

    const _workerPlumber = await db.worker.create({
      data: {
        organization: { connect: { id: org.id } },
        primaryCommunity: { connect: { id: community1.id } },
        workerNumber: 'WRK-2026-000102',
        workerType: 'EMPLOYEE',
        firstName: 'Suresh',
        lastName: 'Sharma',
        displayName: 'Suresh Sharma (Plumber)',
        phone: '+919876543211',
        email: 'suresh.sharma@communityos.io',
        gender: 'MALE',
        status: 'ACTIVE',
        engagements: {
          create: {
            organizationId: org.id,
            communityId: community1.id,
            engagementType: 'DIRECT_EMPLOYMENT',
            employmentReference: 'EMP-2026-0102',
            startDate: new Date('2024-02-01'),
            department: { connect: { id: deptEngineering.id } },
            jobRole: { connect: { id: rolePlumber.id } },
            status: 'ACTIVE',
          },
        },
        skills: {
          create: {
            skill: { connect: { id: skillPump.id } },
            proficiencyLevel: 'ADVANCED',
            verified: true,
            verifiedBy: { connect: { id: adminUser.id } },
          },
        },
      },
    });

    // 21.5 Contract Worker (Vendor Guard Ramesh Singh from Apex Security Services)
    const vendor = await db.vendor.findFirst({ where: { organizationId: org.id } });

    const workerGuard = await db.worker.create({
      data: {
        organization: { connect: { id: org.id } },
        primaryCommunity: { connect: { id: community1.id } },
        workerNumber: 'WRK-2026-000201',
        workerType: 'CONTRACT_WORKER',
        firstName: 'Ramesh',
        lastName: 'Singh',
        displayName: 'Ramesh Singh (Security Guard)',
        phone: '+919876543212',
        email: 'ramesh.guard@apexsecurity.com',
        gender: 'MALE',
        status: 'ACTIVE',
        engagements: {
          create: {
            organizationId: org.id,
            communityId: community1.id,
            vendor: vendor ? { connect: { id: vendor.id } } : undefined,
            engagementType: 'VENDOR_CONTRACT',
            employmentReference: 'APEX-WRK-552',
            startDate: new Date('2024-03-01'),
            department: { connect: { id: deptSecurity.id } },
            jobRole: { connect: { id: roleGuard.id } },
            status: 'ACTIVE',
          },
        },
        skills: {
          create: {
            skill: { connect: { id: skillCCTV.id } },
            proficiencyLevel: 'INTERMEDIATE',
            verified: true,
            verifiedBy: { connect: { id: adminUser.id } },
          },
        },
      },
    });

    // 21.6 Shift Templates (Morning, Evening, Night - Cross Midnight, General)
    const shiftMorning = await db.shiftTemplate.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'SHF-MORN',
        name: 'Morning Shift',
        startLocalTime: '06:00',
        endLocalTime: '14:00',
        breakMinutes: 30,
        crossesMidnight: false,
      },
    });

    const _shiftNight = await db.shiftTemplate.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'SHF-NIGHT',
        name: 'Night Shift (Cross Midnight)',
        startLocalTime: '22:00',
        endLocalTime: '06:00',
        breakMinutes: 45,
        crossesMidnight: true,
      },
    });

    // 21.7 Shift Instances & Published Roster
    const today = new Date();
    const periodStart = new Date(today);
    periodStart.setDate(today.getDate() - today.getDay());
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);

    const roster = await db.workforceRoster.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        name: 'Current Week Maintenance & Security Roster',
        periodStart,
        periodEnd,
        department: { connect: { id: deptSecurity.id } },
        status: 'PUBLISHED',
        createdByUser: { connect: { id: adminUser.id } },
        approvedByUser: { connect: { id: adminUser.id } },
      },
    });

    const shiftStart = new Date();
    shiftStart.setHours(6, 0, 0, 0);
    const shiftEnd = new Date(shiftStart);
    shiftEnd.setHours(14, 0, 0, 0);

    const shiftInstance1 = await db.shiftInstance.create({
      data: {
        community: { connect: { id: community1.id } },
        shiftTemplate: { connect: { id: shiftMorning.id } },
        startAt: shiftStart,
        endAt: shiftEnd,
        locationReference: 'Clubhouse & Towers A/B',
        requiredHeadcount: 2,
        status: 'FULLY_STAFFED',
      },
    });

    await db.shiftAssignment.create({
      data: {
        shiftInstance: { connect: { id: shiftInstance1.id } },
        worker: { connect: { id: workerElectrician.id } },
        roster: { connect: { id: roster.id } },
        assignmentRole: 'Senior Duty Electrician',
        status: 'CONFIRMED',
      },
    });

    // 21.8 Operational Deployments
    await db.workforceDeployment.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        worker: { connect: { id: workerGuard.id } },
        targetType: 'GATE',
        locationName: 'Main Entrance Gate 1',
        roleName: 'Lead Access Control Guard',
        validFrom: new Date('2026-01-01T00:00:00Z'),
        status: 'ACTIVE',
      },
    });

    // 21.9 Attendance Device
    await db.attendanceDevice.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        deviceCode: 'DEV-GATE1-RFID',
        name: 'Main Gate Staff Attendance Terminal',
        deviceType: 'RFID_READER',
        locationReference: 'Gate 1 Security Cabin',
        status: 'ONLINE',
      },
    });

    console.info(
      '✅ Seeded Phase 21 Enterprise Staff & Workforce (Departments, Roles, Skills, Employees, Contract Workers, Shift Templates, Rosters, Deployments & Devices)',
    );
    // ==========================================
    // Phase 22: Enterprise Governance & Meetings
    // ==========================================
    console.info(
      '🌱 Seeding Phase 22 Enterprise Governance, Committees, AGM/EGM, Voting, Notices & Policies...',
    );
    await db.governanceNotice.deleteMany({ where: { organizationId: org.id } });
    await db.governancePolicy.deleteMany({ where: { organizationId: org.id } });
    await db.governanceActionItem.deleteMany({ where: { organizationId: org.id } });
    await db.governanceResolution.deleteMany({ where: { communityId: community1.id } });
    await db.governancePoll.deleteMany({ where: { organizationId: org.id } });
    await db.governanceMeeting.deleteMany({ where: { organizationId: org.id } });
    await db.committeeMembership.deleteMany();
    await db.committeeTerm.deleteMany();
    await db.committeePosition.deleteMany({ where: { organizationId: org.id } });
    await db.governanceCommittee.deleteMany({ where: { organizationId: org.id } });
    await db.quorumPolicy.deleteMany({ where: { organizationId: org.id } });

    // 22.1 Committee Positions
    const posPresident = await db.committeePosition.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'POS-PRES',
        name: 'President / Chairperson',
        description:
          'Chief executive officer of the association presiding over general body and managing committee meetings.',
        isExecutive: true,
      },
    });

    const posSecretary = await db.committeePosition.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'POS-SEC',
        name: 'Secretary',
        description:
          'Custodian of records, issuing official meeting notices, recording minutes, and executing statutory correspondence.',
        isExecutive: true,
      },
    });

    const posTreasurer = await db.committeePosition.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'POS-TREAS',
        name: 'Treasurer',
        description:
          'Oversees financial reporting, accounts review, budget preparation, and audit coordination without direct IAM posting privileges.',
        isExecutive: true,
      },
    });

    const _posMember = await db.committeePosition.create({
      data: {
        organization: { connect: { id: org.id } },
        code: 'POS-MEMB',
        name: 'Managing Committee Member',
        description:
          'Elected general member contributing to committee discussions and voting on operational resolutions.',
        isExecutive: false,
      },
    });

    // 22.2 Managing Committee & 2026-2029 Term
    const committeeMC = await db.governanceCommittee.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        code: 'MC-2026',
        name: 'Grand Cedar Managing Committee',
        description:
          'Elected apex governing body responsible for estate management, security, finance, and regulatory compliance.',
        committeeType: 'MANAGING',
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-01-01'),
        terms: {
          create: {
            termNumber: 'TERM-2026-2029',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2028-12-31'),
            status: 'ACTIVE',
            electionReference: 'ELEC-2025-AGM',
            notes: 'Elected at the 2025 Annual General Meeting.',
          },
        },
      },
      include: { terms: true },
    });

    const termMC = committeeMC.terms[0]!;

    // 22.3 Committee Memberships
    await db.committeeMembership.create({
      data: {
        committeeTerm: { connect: { id: termMC.id } },
        position: { connect: { id: posPresident.id } },
        personReferenceType: 'RESIDENT',
        resident: { connect: { id: johnResident.id } },
        user: { connect: { id: adminUser.id } },
        startDate: new Date('2026-01-01'),
        status: 'ACTIVE',
        appointmentMethod: 'ELECTED',
      },
    });

    await db.committeeMembership.create({
      data: {
        committeeTerm: { connect: { id: termMC.id } },
        position: { connect: { id: posSecretary.id } },
        personReferenceType: 'RESIDENT',
        resident: { connect: { id: janeResident.id } },
        user: { connect: { id: orgAdminUser.id } },
        startDate: new Date('2026-01-01'),
        status: 'ACTIVE',
        appointmentMethod: 'ELECTED',
      },
    });

    await db.committeeMembership.create({
      data: {
        committeeTerm: { connect: { id: termMC.id } },
        position: { connect: { id: posTreasurer.id } },
        personReferenceType: 'RESIDENT',
        resident: { connect: { id: aliceResident.id } },
        startDate: new Date('2026-01-01'),
        status: 'ACTIVE',
        appointmentMethod: 'ELECTED',
      },
    });

    // 22.4 Quorum Policy
    await db.quorumPolicy.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        name: 'AGM Statutory 25% Quorum Policy',
        meetingType: 'AGM',
        requiredPercentage: 25.0,
        isDefault: true,
      },
    });

    // 22.5 Scheduled AGM 2026 Meeting
    const agmMeeting = await db.governanceMeeting.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        meetingNumber: 'AGM-2026-001',
        meetingType: 'AGM',
        committee: { connect: { id: committeeMC.id } },
        committeeTerm: { connect: { id: termMC.id } },
        title: '2026 Annual General Body Meeting (AGM)',
        description:
          'Annual gathering of all estate unit owners to review financials, approve audited accounts, and vote on CAPEX initiatives.',
        scheduledStartAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        scheduledEndAt: new Date(Date.now() + 14 * 24 * 3600 * 1000 + 3 * 3600 * 1000),
        timezone: 'Asia/Kolkata',
        venueType: 'HYBRID',
        venueReference: 'Grand Cedar Clubhouse Main Hall & Zoom Online',
        onlineMeetingUrl: 'https://meet.communityos.io/agm-2026-grandcedar',
        status: 'NOTICE_PUBLISHED',
        notices: {
          create: {
            noticeDate: new Date(),
            noticePeriodDays: 14,
            instructions:
              'All registered unit owners are requested to carry their digital membership QR or government ID for in-person check-in.',
            status: 'PUBLISHED',
            issuedBy: { connect: { id: orgAdminUser.id } },
            publishedAt: new Date(),
          },
        },
        agendas: {
          create: {
            versionNumber: 1,
            title: 'Official AGM 2026 Agenda (Adopted)',
            status: 'PUBLISHED',
            publishedAt: new Date(),
            approvedBy: { connect: { id: adminUser.id } },
            items: {
              create: [
                {
                  itemNumber: '1.0',
                  title: 'Welcome Address & Confirmation of Quorum',
                  itemType: 'INFORMATION',
                  presenter: 'President John Doe',
                  estimatedDurationMinutes: 15,
                  displayOrder: 1,
                },
                {
                  itemNumber: '2.0',
                  title: 'Adoption of Audited Financial Statements for FY 2025-26',
                  itemType: 'DECISION',
                  presenter: 'Treasurer Alice Johnson',
                  estimatedDurationMinutes: 30,
                  decisionRequired: true,
                  votingExpected: true,
                  displayOrder: 2,
                },
                {
                  itemNumber: '3.0',
                  title: 'Rooftop Solar PV Installation CAPEX Initiative Approval',
                  itemType: 'MOTION',
                  presenter: 'Engineering Committee',
                  estimatedDurationMinutes: 45,
                  decisionRequired: true,
                  votingExpected: true,
                  displayOrder: 3,
                },
              ],
            },
          },
        },
      },
    });

    // 22.6 Formal Resolution
    await db.governanceResolution.create({
      data: {
        community: { connect: { id: community1.id } },
        meeting: { connect: { id: agmMeeting.id } },
        resolutionNumber: 'RES-2026-000101',
        title: 'Adoption of FY 2026-27 Annual Maintenance Budget & Sinking Fund Levy',
        resolutionText:
          'Resolved that the proposed annual operating budget of ₹48,00,000 and the capital sinking fund contribution of ₹500 per unit per month is hereby approved and adopted effective 01-April-2026.',
        decisionDate: new Date('2026-03-25'),
        effectiveDate: new Date('2026-04-01'),
        status: 'ADOPTED',
        classification: 'FINANCIAL',
      },
    });

    // 22.7 Official Notice & Read Receipts
    const _waterNotice = await db.governanceNotice.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        noticeNumber: 'NOT-2026-000101',
        noticeType: 'WATER',
        title: 'Overhead Tank Cleaning & Temporary Water Supply Interruption',
        summary:
          'Scheduled overhead domestic water tank cleaning across Tower A and Tower B on Saturday.',
        body: 'Please note that domestic overhead water tanks will undergo annual high-pressure sanitization on Saturday, 10:00 AM to 02:00 PM. Residents are advised to store sufficient water for morning consumption.',
        audienceType: 'BUILDING',
        priority: 'HIGH',
        status: 'PUBLISHED',
        publishAt: new Date(),
        requiresAcknowledgement: true,
        createdBy: { connect: { id: orgAdminUser.id } },
        approvedBy: { connect: { id: adminUser.id } },
        readReceipts: {
          create: {
            resident: { connect: { id: johnResident.id } },
            user: { connect: { id: adminUser.id } },
            firstReadAt: new Date(),
          },
        },
        acknowledgements: {
          create: {
            resident: { connect: { id: johnResident.id } },
            user: { connect: { id: adminUser.id } },
            acknowledgedAt: new Date(),
            method: 'IN_APP',
            status: 'ACKNOWLEDGED',
          },
        },
      },
    });

    // 22.8 Estate Policy Register & Versioning
    const _parkingPolicy = await db.governancePolicy.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        policyNumber: 'POL-2026-000001',
        title: 'Grand Cedar Residential Vehicle Parking & EV Charging Policy',
        category: 'PARKING',
        description:
          'Official rules governing resident designated parking, visitor bay allocations, EV charging slot etiquette, and clamping penalties.',
        status: 'EFFECTIVE',
        ownerCommittee: { connect: { id: committeeMC.id } },
        versions: {
          create: {
            versionNumber: 1,
            content:
              '1. Only registered vehicles with active RFID tags may enter designated basement parking bays. 2. Visitor parking is strictly limited to 6 hours continuous stay. 3. EV charging bays must be vacated within 30 minutes of charge completion.',
            effectiveFrom: new Date('2026-01-01'),
            status: 'EFFECTIVE',
            approvedBy: { connect: { id: adminUser.id } },
            approvedAt: new Date('2025-12-20'),
            publishedAt: new Date('2025-12-25'),
            acknowledgements: {
              create: {
                resident: { connect: { id: johnResident.id } },
                acknowledgedAt: new Date('2026-01-02'),
              },
            },
          },
        },
      },
    });

    // 22.9 Governance Action Item
    await db.governanceActionItem.create({
      data: {
        organization: { connect: { id: org.id } },
        community: { connect: { id: community1.id } },
        meeting: { connect: { id: agmMeeting.id } },
        title: 'Obtain Structural Engineering Feasibility Certificate for Solar Rooftop',
        description:
          'Engage certified structural consultant to inspect Tower A and Clubhouse roof slabs before contractor contract award.',
        ownerType: 'USER',
        ownerUser: { connect: { id: orgAdminUser.id } },
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        priority: 'HIGH',
        status: 'IN_PROGRESS',
      },
    });

    console.info(
      '✅ Seeded Phase 22 Enterprise Governance, Committees, 2026-2029 Term, AGM 2026, Published Agendas, Resolutions, Notices, Policies & Action Items',
    );

    console.info(
      '✅ Seeded Phase 15 Enterprise Accounts Payable & Treasury (Payment Terms, Tolerance Policies, Bank Account, Vendor Accounts, Invoices, Subledger & Statements)',
    );

    console.info(
      '✅ Seeded Phase 14 Enterprise Resident Maintenance Billing & AR (Charge Definitions, Tariff Plans, April 2026 Billing Run, Invoices, Receipts, Allocations & Subledger)',
    );

    // eslint-disable-next-line no-console
    console.info(
      '✅ Seeded Phase 13 Enterprise Finance & Accounting Core (AccountingEntity, COA, Fiscal Periods, Funds, Cost Centers, Opening Balances & Balanced Journals)',
    );

    console.info(
      '✅ Seeded Phase 12 Enterprise Vendor & Procurement (Vendors, PRs, RFQs, Quotes, Awards, POs, GRN & Scorecards)',
    );

    console.info(`✅ Seeded ${allDbPerms.length} permissions and system roles.`);
    // eslint-disable-next-line no-console
    console.info(`✅ Seeded Portfolio: ${portfolio.name}`);
    // eslint-disable-next-line no-console
    console.info(`✅ Seeded Section: ${section1.name}`);
    // eslint-disable-next-line no-console
    console.info(`✅ Seeded Buildings: ${towerA.name}, ${towerB.name}`);
    // eslint-disable-next-line no-console
    console.info(`✅ Seeded Floors: Floor G, Floor 1 (id: ${floor1.id})`);
    // eslint-disable-next-line no-console
    console.info(
      `✅ Seeded Units: ${unit101.unitNumber}, ${unit102.unitNumber}, ${villa01 ? 'VILLA-01' : ''}`,
    );
    // eslint-disable-next-line no-console
    console.info(
      `✅ Seeded Residents: ${johnResident.displayName}, ${janeResident.displayName}, ${aliceResident.displayName}`,
    );
    // eslint-disable-next-line no-console
    console.info(`✅ Seeded Root Admin: ${adminUser.email}`);
    // eslint-disable-next-line no-console
    console.info(`✅ Seeded Org Admin: ${orgAdminUser.email}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seed();
