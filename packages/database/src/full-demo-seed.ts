import crypto from 'crypto';
import { db } from './client.js';
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD_HASH = bcrypt.hashSync('Admin@CommunityOS2026!', 10);

export async function populateFullEnterpriseDemo() {
  console.log('🚀 [START] Seeding Full Enterprise Scale Demo Dataset...');
  const t0 = Date.now();

  const allComms = await db.community.findMany();
  const org =
    (await db.organization.findFirst({ where: { slug: 'northstar-community-mgmt' } })) ||
    (await db.organization.findFirst())!;
  const community =
    allComms.find(
      (c: { slug: string | null; code: string | null }) =>
        c.slug === 'green-valley-township' || c.code === 'GVH',
    ) || allComms[0]!;

  console.log('   Target Community: ' + community.name + ' (' + community.id + ')');

  // ---------------------------------------------------------------------------
  // 1. SEED 20 DEMO PERSONAS
  // ---------------------------------------------------------------------------
  console.log('👥 [1/10] Seeding 20 Demo Personas...');

  const platformAdminRole = await db.role.findFirst({
    where: { code: 'PLATFORM_ADMIN', organizationId: null },
  });
  const orgAdminRole = await db.role.findFirst({
    where: { code: 'ORG_ADMIN', organizationId: null },
  });
  const communityAdminRole = await db.role.findFirst({
    where: { code: 'COMMUNITY_ADMIN', organizationId: null },
  });
  const residentRole = await db.role.findFirst({
    where: { code: 'RESIDENT', organizationId: null },
  });

  const demoPersonas = [
    {
      email: 'admin@demo.local',
      name: 'Platform Super Admin',
      phone: '+918810000001',
      role: platformAdminRole,
      scopeType: 'PLATFORM',
      scopeId: null,
    },
    {
      email: 'orgadmin@northstar.demo',
      name: 'Rajesh Sharma (Org Director)',
      phone: '+918810000002',
      role: orgAdminRole,
      scopeType: 'ORGANIZATION',
      scopeId: org.id,
    },
    {
      email: 'manager.gvh@northstar.demo',
      name: 'Vikram Malhotra (General Manager)',
      phone: '+918810000003',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'finance@northstar.demo',
      name: 'Ananya Iyer (Finance Manager)',
      phone: '+918810000004',
      role: orgAdminRole,
      scopeType: 'ORGANIZATION',
      scopeId: org.id,
    },
    {
      email: 'accountant.gvh@northstar.demo',
      name: 'Suresh Verma (Senior Accountant)',
      phone: '+918810000005',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'facility.gvh@northstar.demo',
      name: 'Amitabh Sen (Facility Manager)',
      phone: '+918810000006',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'helpdesk.gvh@northstar.demo',
      name: 'Pooja Nair (Helpdesk Lead)',
      phone: '+918810000007',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'tech.electric@northstar.demo',
      name: 'Ramesh Kumar (Lead Electrician)',
      phone: '+918810000008',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'tech.plumb@northstar.demo',
      name: 'Manoj Yadav (Senior Plumber)',
      phone: '+918810000009',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'security.lead@northstar.demo',
      name: 'Capt. R. S. Rathore (Security Chief)',
      phone: '+918810000010',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'guard.north@northstar.demo',
      name: 'Dharmendra Singh (North Gate Guard)',
      phone: '+918810000011',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'store.manager@northstar.demo',
      name: 'Harish Joshi (Storekeeper)',
      phone: '+918810000012',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'procurement@northstar.demo',
      name: 'Meera Deshmukh (Procurement Lead)',
      phone: '+918810000013',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'projects.lead@northstar.demo',
      name: 'Arun Kulkarni (Capex Projects Head)',
      phone: '+918810000014',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'hr.workforce@northstar.demo',
      name: 'Sunita Kapoor (HR & Workforce Lead)',
      phone: '+918810000015',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'president.rwa@demo.local',
      name: 'Dr. Alok Mukherjee (MC President)',
      phone: '+918810000016',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'secretary.rwa@demo.local',
      name: 'Kavita Chawla (MC Secretary)',
      phone: '+918810000017',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'resident.owner@demo.local',
      name: 'Rohit Singhal (Owner A-405)',
      phone: '+918810000018',
      role: residentRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'resident.tenant@demo.local',
      name: 'Neha Gupta (Tenant C-602)',
      phone: '+918810000019',
      role: residentRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
    {
      email: 'safety.compliance@northstar.demo',
      name: 'Col. Pradeep Nambiar (Safety Officer)',
      phone: '+918810000020',
      role: communityAdminRole,
      scopeType: 'COMMUNITY',
      scopeId: community.id,
    },
  ];

  for (const dp of demoPersonas) {
    const u = await db.user.upsert({
      where: { email: dp.email },
      update: { displayName: dp.name, phone: dp.phone },
      create: {
        email: dp.email,
        phone: dp.phone,
        displayName: dp.name,
        passwordHash: DEMO_PASSWORD_HASH,
        status: 'ACTIVE',
      },
    });

    await db.tenantMembership.upsert({
      where: {
        userId_organizationId_communityId: {
          userId: u.id,
          organizationId: org.id,
          communityId: community.id,
        },
      },
      update: { status: 'ACTIVE' },
      create: {
        userId: u.id,
        organizationId: org.id,
        communityId: community.id,
        status: 'ACTIVE',
      },
    });

    if (dp.role) {
      const existingAssignment = await db.roleAssignment.findFirst({
        where: {
          userId: u.id,
          roleId: dp.role.id,
          scopeType: dp.scopeType as any,
          scopeId: dp.scopeId,
        },
      });

      if (!existingAssignment) {
        await db.roleAssignment.create({
          data: {
            userId: u.id,
            roleId: dp.role.id,
            scopeType: dp.scopeType as any,
            scopeId: dp.scopeId,
            status: 'ACTIVE',
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. TOWERS C & D AND 144 RESIDENTIAL UNITS
  // ---------------------------------------------------------------------------
  console.log('🏗️ [2/10] Seeding 144 Residential Units across 4 Towers...');

  const section =
    (await db.communitySection.findFirst({ where: { communityId: community.id } })) ||
    (await db.communitySection.findFirst())!;

  const towersData = [
    { code: 'TWR-A', name: 'Tower A (Aspen)', floors: 10 },
    { code: 'TWR-B', name: 'Tower B (Birch)', floors: 10 },
    { code: 'TWR-C', name: 'Tower C (Cedar)', floors: 10 },
    { code: 'TWR-D', name: 'Tower D (Dogwood)', floors: 6 },
  ];

  const allUnits: { id: string; num: string; bldgId: string }[] = [];

  for (const t of towersData) {
    const bldg = await db.building.upsert({
      where: { communityId_code: { communityId: community.id, code: t.code } },
      update: { name: t.name, numberOfFloors: t.floors },
      create: {
        organizationId: org.id,
        communityId: community.id,
        sectionId: section.id,
        code: t.code,
        name: t.name,
        buildingType: 'TOWER',
        numberOfFloors: t.floors,
        status: 'ACTIVE',
      },
    });

    for (let f = 0; f < t.floors; f++) {
      const floorLabel = f === 0 ? 'Floor G' : 'Floor ' + f;
      const flr = await db.floor.upsert({
        where: { buildingId_label: { buildingId: bldg.id, label: floorLabel } },
        update: { levelNumber: f },
        create: {
          organizationId: org.id,
          communityId: community.id,
          buildingId: bldg.id,
          label: floorLabel,
          levelNumber: f,
          status: 'ACTIVE',
        },
      });

      for (let u = 1; u <= 4; u++) {
        const unitNum = t.code.replace('TWR-', '') + '-' + (f === 0 ? 'G' : f) + '0' + u;
        const area = u === 1 ? 1250 : u === 2 ? 1750 : u === 3 ? 1850 : 2450;

        const unitRec = await db.unit.upsert({
          where: {
            communityId_buildingId_unitNumber: {
              communityId: community.id,
              buildingId: bldg.id,
              unitNumber: unitNum,
            },
          },
          update: { displayName: 'Unit ' + unitNum, status: 'ACTIVE' },
          create: {
            organizationId: org.id,
            communityId: community.id,
            sectionId: section.id,
            buildingId: bldg.id,
            floorId: flr.id,
            unitNumber: unitNum,
            displayName: 'Unit ' + unitNum,
            unitType: 'APARTMENT',
            status: 'ACTIVE',
            carpetArea: area * 0.78,
            builtUpArea: area * 0.9,
            superBuiltUpArea: area,
            areaUnit: 'SQFT',
            bedroomCount: u === 1 ? 2 : 3,
            bathroomCount: u === 1 ? 2 : 3,
          },
        });
        allUnits.push({ id: unitRec.id, num: unitNum, bldgId: bldg.id });
      }
    }
  }

  console.log('   ✅ Seeded ' + allUnits.length + ' residential units across 4 towers.');

  // ---------------------------------------------------------------------------
  // 3. HOUSEHOLDS & RESIDENTS (105 Owners, 27 Tenants, 12 Vacant)
  // ---------------------------------------------------------------------------
  console.log('👨‍👩‍👧‍👦 [3/10] Seeding Households, Residents, Ownerships & Tenancies...');

  const firstNames = [
    'Aarav',
    'Vivaan',
    'Aditya',
    'Vihaan',
    'Arjun',
    'Sai',
    'Reyansh',
    'Ayaan',
    'Krishna',
    'Ishaan',
    'Shaurya',
    'Atharv',
    'Advik',
    'Pranav',
    'Kabir',
    'Ananya',
    'Diya',
    'Saanvi',
    'Aadhya',
    'Pari',
    'Kiara',
    'Myra',
    'Riya',
    'Isha',
    'Ahana',
    'Anushka',
    'Tara',
    'Navya',
    'Meera',
    'Sneha',
  ];
  const lastNames = [
    'Sharma',
    'Verma',
    'Patel',
    'Mehta',
    'Joshi',
    'Bhatia',
    'Iyer',
    'Nair',
    'Reddy',
    'Chopra',
    'Malhotra',
    'Gupta',
    'Singh',
    'Agarwal',
    'Deshmukh',
    'Kulkarni',
    'Dubey',
    'Trivedi',
    'Saxena',
    'Pandey',
  ];
  let primaryResidentId = '';

  for (let i = 0; i < allUnits.length; i++) {
    const u = allUnits[i]!;
    const isVacant = i >= 132;
    const isTenant = !isVacant && i % 4 === 3;

    if (isVacant) continue;

    const fn = firstNames[i % firstNames.length]!;
    const ln = lastNames[(i * 3) % lastNames.length]!;
    const email = 'resident.' + u.num.toLowerCase() + '@demo.local';
    const phone = '+91882' + String(100000 + i).padStart(6, '0');

    const resUser = await db.user.upsert({
      where: { email },
      update: { displayName: fn + ' ' + ln, phone },
      create: {
        email,
        passwordHash: DEMO_PASSWORD_HASH,
        displayName: fn + ' ' + ln,
        phone,
        status: 'ACTIVE',
      },
    });

    if (residentRole) {
      const existingAssignment = await db.roleAssignment.findFirst({
        where: {
          userId: resUser.id,
          roleId: residentRole.id,
          scopeType: 'COMMUNITY',
          scopeId: community.id,
        },
      });
      if (!existingAssignment) {
        await db.roleAssignment.create({
          data: {
            userId: resUser.id,
            roleId: residentRole.id,
            scopeType: 'COMMUNITY',
            scopeId: community.id,
            status: 'ACTIVE',
          },
        });
      }
    }

    let hh = await db.household.findFirst({ where: { unitId: u.id } });
    if (!hh) {
      hh = await db.household.create({
        data: {
          organizationId: org.id,
          communityId: community.id,
          unitId: u.id,
          name: ln + ' Family (' + u.num + ')',
          status: 'ACTIVE',
          startDate: new Date('2024-01-01'),
        },
      });
    }

    let resident = await db.resident.findFirst({ where: { email } });
    if (!resident) {
      resident = await db.resident.create({
        data: {
          organizationId: org.id,
          communityId: community.id,
          userId: resUser.id,
          firstName: fn,
          lastName: ln,
          displayName: fn + ' ' + ln,
          email,
          phone,
          status: 'ACTIVE',
        },
      });

      if (!primaryResidentId) primaryResidentId = resident.id;

      await db.householdMember.upsert({
        where: { householdId_residentId: { householdId: hh.id, residentId: resident.id } },
        update: {},
        create: {
          organizationId: org.id,
          communityId: community.id,
          householdId: hh.id,
          residentId: resident.id,
          relationshipType: 'SELF',
          isPrimaryContact: true,
          status: 'ACTIVE',
        },
      });

      await db.unitOwnership.create({
        data: {
          organizationId: org.id,
          communityId: community.id,
          unitId: u.id,
          residentId: resident.id,
          ownershipType: 'SOLE',
          startDate: new Date('2024-01-01'),
          status: 'ACTIVE',
        },
      });

      await db.unitOccupancy.create({
        data: {
          organizationId: org.id,
          communityId: community.id,
          unitId: u.id,
          householdId: hh.id,
          occupancyType: isTenant ? 'TENANT_OCCUPIED' : 'OWNER_OCCUPIED',
          startDate: new Date('2024-01-01'),
          status: 'ACTIVE',
        },
      });
    } else {
      if (!primaryResidentId) primaryResidentId = resident.id;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. HELPDESK TICKETS (160+) & WORK ORDERS (110+)
  // ---------------------------------------------------------------------------
  console.log('🎫 [4/10] Seeding 160 Helpdesk Tickets & 110 Work Orders...');

  let ticketWf = await db.workflowDefinition.findFirst({ where: { entityType: 'TICKET' } });
  if (!ticketWf) {
    ticketWf = await db.workflowDefinition.create({
      data: {
        organizationId: org.id,
        communityId: community.id,
        key: 'workflow.ticket.standard',
        name: 'Standard Ticket Workflow',
        description: 'Standard resident ticket handling lifecycle',
        version: 1,
        status: 'PUBLISHED',
        scopeType: 'COMMUNITY',
        entityType: 'TICKET',
        initialStateKey: 'NEW',
        states: [
          { key: 'NEW', label: 'New', type: 'INITIAL' },
          { key: 'IN_PROGRESS', label: 'In Progress', type: 'INTERMEDIATE' },
          { key: 'RESOLVED', label: 'Resolved', type: 'TERMINAL' },
          { key: 'CLOSED', label: 'Closed', type: 'TERMINAL' },
        ],
        transitions: [],
      },
    });
  }

  let woWf = await db.workflowDefinition.findFirst({ where: { entityType: 'WORK_ORDER' } });
  if (!woWf) {
    woWf = await db.workflowDefinition.create({
      data: {
        organizationId: org.id,
        communityId: community.id,
        key: 'workflow.work_order.standard',
        name: 'Standard Work Order Execution Workflow',
        description: 'Standard work order execution lifecycle',
        version: 1,
        status: 'PUBLISHED',
        scopeType: 'COMMUNITY',
        entityType: 'WORK_ORDER',
        initialStateKey: 'DRAFT',
        states: [
          { key: 'DRAFT', label: 'Draft', type: 'INITIAL' },
          { key: 'ASSIGNED', label: 'Assigned', type: 'INTERMEDIATE' },
          { key: 'IN_PROGRESS', label: 'In Progress', type: 'INTERMEDIATE' },
          { key: 'COMPLETED', label: 'Completed', type: 'TERMINAL' },
        ],
        transitions: [],
      },
    });
  }

  let categories = await db.ticketCategory.findMany({ where: { communityId: community.id } });
  if (categories.length === 0) {
    categories = await db.ticketCategory.findMany();
  }

  const sampleIssues = [
    'Master bathroom ceiling seepage',
    'Corridor tube light flickering near doorway',
    'Elevator landing door slow opening',
    'Basement parking storm drain clogged',
    'Main gate intercom noise interference',
    'Clubhouse treadmill belt loose',
    'Balcony drain pipe blockage',
    'Main pressure booster pump low head pressure',
    'Visitor bay reserved slot occupied unauthorizedly',
    'Swimming pool chemical filtration balance check',
    'Staircase handrail loose fitting at Floor 4',
    'Fire hydrant valve slight weeping leak',
  ];

  for (let t = 1; t <= 160; t++) {
    const tNum = 'TKT-2026-' + String(3000 + t);
    const unit = allUnits[t % allUnits.length]!;
    const cat = categories[t % categories.length]!;
    const issue = sampleIssues[t % sampleIssues.length]!;

    const existingT = await db.ticket.findFirst({
      where: { ticketNumber: tNum, communityId: community.id },
    });
    if (!existingT && cat) {
      const isClosed = t % 3 === 0;
      const isInProgress = t % 3 === 1;
      const stateKey = isClosed ? 'RESOLVED' : isInProgress ? 'IN_PROGRESS' : 'NEW';
      const ticketResId = crypto.randomUUID();

      const _createdTicket = await db.ticket.create({
        data: {
          id: ticketResId,
          organization: { connect: { id: org.id } },
          community: { connect: { id: community.id } },
          category: { connect: { id: cat.id } },
          unit: { connect: { id: unit.id } },
          ticketNumber: tNum,
          title: issue + ' (' + unit.num + ')',
          description: 'Resident in ' + unit.num + ' reported: ' + issue,
          priority: t % 15 === 0 ? 'URGENT' : t % 4 === 0 ? 'HIGH' : 'NORMAL',
          currentState: stateKey,
          slaStatus: t % 12 === 0 ? 'BREACHED' : 'ACTIVE',
          workflowInstance: {
            create: {
              organizationId: org.id,
              communityId: community.id,
              workflowDefinitionId: ticketWf.id,
              workflowDefinitionKey: ticketWf.key,
              workflowVersion: ticketWf.version,
              resourceType: 'TICKET',
              resourceId: ticketResId,
              currentState: stateKey,
              status: isClosed ? 'COMPLETED' : 'RUNNING',
            },
          },
        },
      });

      if (t <= 110) {
        const woNum = 'WO-2026-' + String(3000 + t);
        const existingWo = await db.workOrder.findFirst({
          where: { workOrderNumber: woNum, communityId: community.id },
        });
        if (!existingWo) {
          const woState = isClosed ? 'COMPLETED' : isInProgress ? 'IN_PROGRESS' : 'ASSIGNED';
          const woResId = crypto.randomUUID();

          await db.workOrder.create({
            data: {
              id: woResId,
              organization: { connect: { id: org.id } },
              community: { connect: { id: community.id } },
              unit: { connect: { id: unit.id } },
              workOrderNumber: woNum,
              title: 'Corrective Action: ' + issue,
              description: 'Rectification task assigned to engineering technician for ' + unit.num,
              currentState: woState,
              priority: t % 15 === 0 ? 'URGENT' : 'NORMAL',
              workflowInstance: {
                create: {
                  organizationId: org.id,
                  communityId: community.id,
                  workflowDefinitionId: woWf.id,
                  workflowDefinitionKey: woWf.key,
                  workflowVersion: woWf.version,
                  resourceType: 'WORK_ORDER',
                  resourceId: woResId,
                  currentState: woState,
                  status: isClosed ? 'COMPLETED' : 'RUNNING',
                },
              },
            },
          });
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. 6 MONTHS OF BILLING RUNS, INVOICES & PAYMENTS (720+ Invoices)
  // ---------------------------------------------------------------------------
  console.log('💰 [5/10] Seeding 6 Months of Maintenance Billing & Payments (720+ Invoices)...');

  const months = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  for (let m = 0; m < months.length; m++) {
    const pCode = months[m]!;
    let bp = await db.billingPeriod.findFirst({
      where: { code: pCode, communityId: community.id },
    });
    if (!bp) {
      bp = await db.billingPeriod.create({
        data: {
          communityId: community.id,
          code: pCode,
          name: pCode + ' Maintenance Period',
          startDate: new Date(pCode + '-01'),
          endDate: new Date(pCode + '-28'),
          invoiceDate: new Date(pCode + '-01'),
          dueDate: new Date(pCode + '-15'),
          graceDate: new Date(pCode + '-20'),
          status: m < 5 ? 'CLOSED' : 'OPEN',
        },
      });
    }

    for (let u = 0; u < allUnits.length; u++) {
      const unit = allUnits[u]!;
      const invNum = 'INV-' + pCode + '-' + unit.num;

      let ba = await db.billableAccount.findFirst({
        where: { accountNumber: 'ACC-' + unit.num, communityId: community.id },
      });
      if (!ba) {
        ba = await db.billableAccount.create({
          data: {
            organizationId: org.id,
            communityId: community.id,
            accountNumber: 'ACC-' + unit.num,
            accountType: 'UNIT',
            displayName: 'Unit ' + unit.num,
            unitId: unit.id,
            status: 'ACTIVE',
          },
        });
      }

      const existingInv = await db.invoice.findFirst({
        where: { invoiceNumber: invNum, communityId: community.id },
      });
      if (!existingInv) {
        const amount = 4200 + (u % 4) * 450;
        const isPaid = m < 5 || u % 10 !== 9;
        const paidAmt = isPaid ? amount : 0;

        await db.invoice.create({
          data: {
            organization: { connect: { id: org.id } },
            community: { connect: { id: community.id } },
            billableAccount: { connect: { id: ba.id } },
            billingPeriod: { connect: { id: bp.id } },
            invoiceNumber: invNum,
            invoiceDate: new Date(pCode + '-01'),
            dueDate: new Date(pCode + '-15'),
            graceDate: new Date(pCode + '-20'),
            subtotal: amount,
            grandTotal: amount,
            allocatedAmount: paidAmt,
            outstandingAmount: amount - paidAmt,
            status: isPaid ? 'PAID' : 'OVERDUE',
          },
        });

        if (isPaid) {
          const payRec = await db.payment.create({
            data: {
              organization: { connect: { id: org.id } },
              community: { connect: { id: community.id } },
              billableAccount: { connect: { id: ba.id } },
              paymentNumber: 'PAY-' + pCode + '-' + unit.num,
              paymentDate: new Date(pCode + '-05'),
              receivedAmount: paidAmt,
              allocatedAmount: paidAmt,
              unallocatedAmount: 0,
              paymentMethod: 'UPI',
              referenceNumber: 'UPI/' + Date.now() + '/' + m + '/' + u,
              status: 'SUCCESS',
            },
          });

          await db.receipt.create({
            data: {
              community: { connect: { id: community.id } },
              payment: { connect: { id: payRec.id } },
              billableAccount: { connect: { id: ba.id } },
              receiptNumber: 'RCT-' + pCode + '-' + unit.num,
              receiptDate: new Date(pCode + '-05'),
              amount: paidAmt,
              status: 'SUCCESS',
            },
          });
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. 10 AMENITIES & BOOKINGS
  // ---------------------------------------------------------------------------
  console.log('🏊 [6/10] Seeding 10 Amenities & Historical Bookings...');

  const amenitiesMaster = [
    { code: 'AMN-CLUB-MAIN', name: 'Grand Central Clubhouse', capacity: 150, fee: 3500 },
    { code: 'AMN-POOL-LAP', name: 'Olympic Swimming Pool', capacity: 30, fee: 0 },
    { code: 'AMN-GYM-FIT', name: 'Fitness & Cardio Studio', capacity: 40, fee: 0 },
    { code: 'AMN-BADM-01', name: 'Badminton Court 1 (Maple Wood)', capacity: 6, fee: 0 },
    { code: 'AMN-BADM-02', name: 'Badminton Court 2 (Synthetic)', capacity: 6, fee: 0 },
    { code: 'AMN-HALL-BANQ', name: 'Community Banquet Hall', capacity: 100, fee: 5000 },
    { code: 'AMN-GUEST-01', name: 'Executive Guest Suite 1', capacity: 3, fee: 1800 },
    { code: 'AMN-GUEST-02', name: 'Executive Guest Suite 2', capacity: 3, fee: 1800 },
    { code: 'AMN-YOGA-DECK', name: 'Terrace Yoga & Meditation Lawn', capacity: 25, fee: 0 },
    { code: 'AMN-TENNIS-01', name: 'Floodlit Tennis Court', capacity: 4, fee: 0 },
  ];

  for (const a of amenitiesMaster) {
    await db.amenity.upsert({
      where: { communityId_code: { communityId: community.id, code: a.code } },
      update: { name: a.name, capacity: a.capacity },
      create: {
        organizationId: org.id,
        communityId: community.id,
        code: a.code,
        name: a.name,
        category: 'SPORTS',
        capacity: a.capacity,
        status: 'ACTIVE',
        isPaid: a.fee > 0,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 7. GOVERNANCE: 4 MEETINGS, RESOLUTIONS, 10 NOTICES & 6 POLICIES
  // ---------------------------------------------------------------------------
  console.log('🏛️ [7/10] Seeding Governance Meetings, Resolutions, Notices & Policies...');

  const term = await db.governanceCommittee.findFirst({
    where: { code: 'MC-2026', communityId: community.id },
  });
  if (term) {
    const meetings = [
      {
        num: 'EGM-2026-01',
        title: 'Extraordinary General Body Meeting (EGM) on Solar Capex',
        type: 'EGM',
      },
      {
        num: 'MCM-2026-04',
        title: 'Managing Committee Monthly Review - April 2026',
        type: 'MANAGING_COMMITTEE',
      },
      {
        num: 'MCM-2026-05',
        title: 'Managing Committee Monthly Review - May 2026',
        type: 'MANAGING_COMMITTEE',
      },
    ];

    for (const m of meetings) {
      const existingM = await db.governanceMeeting.findFirst({ where: { meetingNumber: m.num } });
      if (!existingM) {
        await db.governanceMeeting.create({
          data: {
            organization: { connect: { id: org.id } },
            community: { connect: { id: community.id } },
            meetingNumber: m.num,
            title: m.title,
            meetingType: m.type as any,
            scheduledStartAt: new Date('2026-05-10T11:00:00Z'),
            scheduledEndAt: new Date('2026-05-10T13:00:00Z'),
            status: 'NOTICE_PUBLISHED',
          },
        });
      }
    }

    const noticesData = [
      { num: 'NOT-2026-02', title: 'Quarterly Fire Drill & Evacuation Practice', prio: 'HIGH' },
      {
        num: 'NOT-2026-03',
        title: 'Pest Control Schedule in Common Basement & Shafts',
        prio: 'MEDIUM',
      },
      { num: 'NOT-2026-04', title: 'Swimming Pool Closed for Annual Tile Regrouting', prio: 'LOW' },
      {
        num: 'NOT-2026-05',
        title: 'Monsoon Preparedness & Balcony Drain Cleanliness',
        prio: 'HIGH',
      },
      {
        num: 'NOT-2026-06',
        title: 'Digital Maintenance Payment Portal UPI Guidelines',
        prio: 'LOW',
      },
    ];

    for (const nd of noticesData) {
      const existingN = await db.governanceNotice.findFirst({ where: { noticeNumber: nd.num } });
      if (!existingN) {
        await db.governanceNotice.create({
          data: {
            organization: { connect: { id: org.id } },
            community: { connect: { id: community.id } },
            noticeNumber: nd.num,
            noticeType: 'GENERAL',
            title: nd.title,
            summary: nd.title,
            body: nd.title + '. For inquiries, contact the estate management office.',
            status: 'PUBLISHED',
            priority: nd.prio as any,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 8. HISTORICAL VISITOR PASSES (500+)
  // ---------------------------------------------------------------------------
  console.log('🛡️ [8/10] Seeding Historical Visitor Passes (100+)...');

  const fallbackResident = await db.resident.findFirst({ where: { communityId: community.id } });
  if (fallbackResident) {
    for (let v = 1; v <= 100; v++) {
      const entryDate = new Date(Date.now() - v * 4 * 3600000);
      const exitDate = new Date(entryDate.getTime() + 1800000);
      const unit = allUnits[v % allUnits.length]!;

      const invNum = 'INVIT-2026-' + String(20000 + v);
      const existingInv = await db.visitorInvitation.findFirst({
        where: { invitationNumber: invNum },
      });
      if (!existingInv) {
        await db.visitorInvitation.create({
          data: {
            organization: { connect: { id: org.id } },
            community: { connect: { id: community.id } },
            destinationUnit: { connect: { id: unit.id } },
            hostResident: { connect: { id: fallbackResident.id } },
            invitationNumber: invNum,
            visitorName:
              'Visitor ' +
              firstNames[v % firstNames.length] +
              ' ' +
              lastNames[v % lastNames.length],
            phone: '+91884' + String(100000 + v).padStart(6, '0'),
            visitType: v % 3 === 0 ? 'GUEST' : v % 3 === 1 ? 'DELIVERY' : 'CAB',
            purpose: 'Scheduled Guest / Delivery',
            status: 'ACTIVE',
            expectedFrom: entryDate,
            expectedUntil: exitDate,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 9. ASSET METERS & DAILY READINGS
  // ---------------------------------------------------------------------------
  console.log('⚡ [9/10] Seeding Asset Meters & Daily Readings...');

  const allMeters = await db.assetMeter.findMany();
  for (const meter of allMeters) {
    for (let day = 60; day >= 0; day -= 2) {
      const recordedAt = new Date(Date.now() - day * 86400000);
      const delta = meter.meterType === 'KWH' ? 380 + (day % 5) * 15 : 8 + (day % 3);
      await db.assetMeterReading.create({
        data: {
          meterId: meter.id,
          reading: Number(meter.currentReading) + (60 - day) * delta,
          delta,
          recordedAt,
          source: 'MANUAL',
          notes: 'Automated telemetry ingestion',
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 10. GLOBAL SEARCH INDEX
  // ---------------------------------------------------------------------------
  console.log('🔍 [10/10] Seeding Global Search Documents...');

  const searchDocs = [
    {
      type: 'COMMUNITY',
      id: 'GVH',
      title: 'Green Valley Heights',
      text: 'Green Valley Heights Co-operative Housing Society Scheme 140 Indore',
    },
    {
      type: 'TICKET',
      id: 'TKT-2026-00001',
      title: 'Water leakage in master bathroom ceiling',
      text: 'Plumbing complaint Tower A unit A-102.',
    },
    {
      type: 'ASSET',
      id: 'AST-LIFT-A1',
      title: 'Tower A Passenger Lift 1 (Schindler 13-Pax)',
      text: 'Schindler passenger elevator Tower A Aspen.',
    },
    {
      type: 'POLICY',
      id: 'POL-PARKING-2026',
      title: 'Estate Visitor Parking Guidelines',
      text: 'Visitor vehicles may park in designated bays up to 4 hours free.',
    },
    {
      type: 'VENDOR',
      id: 'VND-ELEVATE',
      title: 'Elevate Lift Solutions India Pvt Ltd',
      text: 'Elevator OEM maintenance contractor 24x7 emergency response.',
    },
    {
      type: 'AMENITY',
      id: 'AMN-CLUB-MAIN',
      title: 'Grand Central Clubhouse',
      text: 'Multi-purpose clubhouse with badminton courts and banquet hall.',
    },
    {
      type: 'MEETING',
      id: 'AGM-2026',
      title: 'Annual General Body Meeting AGM 2026',
      text: 'General body meeting review of audited statements and budget.',
    },
  ];

  for (const s of searchDocs) {
    await db.searchDocument.upsert({
      where: { resourceType_resourceId: { resourceType: s.type, resourceId: s.id } },
      update: { title: s.title, searchText: s.text },
      create: {
        organizationId: org.id,
        communityId: community.id,
        resourceType: s.type,
        resourceId: s.id,
        title: s.title,
        keywords: s.title.toLowerCase().split(' '),
        searchText: s.text,
      },
    });
  }

  await seedExecutiveDemoChains(org.id, community.id);

  const durationSec = ((Date.now() - t0) / 1000).toFixed(2);
  console.log('✅ [COMPLETE] Full Enterprise Demo Dataset scaled up in ' + durationSec + 's!');
}

async function seedExecutiveDemoChains(organizationId: string, communityId: string) {
  console.log('🎬 [RC] Reconciling executive demo story chains...');

  const adminUser = await db.user.findFirst({ where: { email: 'admin@communityos.io' } });
  const residentUser = await db.user.findFirst({ where: { email: 'resident.a-301@demo.local' } });
  const plumberUser =
    (await db.user.findFirst({ where: { email: 'tech.plumb@northstar.demo' } })) ?? adminUser;
  const facilityUser =
    (await db.user.findFirst({ where: { email: 'facility.gvh@northstar.demo' } })) ?? adminUser;
  const safetyUser =
    (await db.user.findFirst({ where: { email: 'safety.compliance@northstar.demo' } })) ??
    adminUser;

  const waterTicket = await db.ticket.findFirst({
    where: {
      organizationId,
      communityId,
      ticketNumber: 'TKT-2026-3012',
    },
  });
  const waterWorkOrder = await db.workOrder.findFirst({
    where: {
      organizationId,
      communityId,
      workOrderNumber: 'WO-2026-3012',
    },
  });

  if (waterTicket && waterWorkOrder) {
    await db.ticket.update({
      where: { id: waterTicket.id },
      data: {
        currentState: 'RESOLVED',
        priority: 'HIGH',
        resolvedById: plumberUser?.id,
        resolvedAt: new Date('2026-04-12T11:30:00.000Z'),
        resolutionSummary:
          'Bathroom ceiling seepage isolated, pipe joint resealed, and affected area handed back after resident confirmation.',
        resolutionCode: 'PLUMBING_REPAIRED',
      },
    });

    await db.workOrder.update({
      where: { id: waterWorkOrder.id },
      data: {
        currentState: 'COMPLETED',
        priority: 'HIGH',
        source: 'HELPDESK_TICKET',
        primaryAssigneeId: plumberUser?.id,
        actualStartAt: new Date('2026-04-12T09:00:00.000Z'),
        actualEndAt: new Date('2026-04-12T11:15:00.000Z'),
        completionSummary:
          'Inspected ceiling seepage, resealed PVC joint, pressure-tested line, cleaned area, and confirmed no active leak.',
        resolutionCode: 'COMPLETED_FIRST_VISIT',
        verifiedById: facilityUser?.id,
        verifiedAt: new Date('2026-04-12T11:25:00.000Z'),
      },
    });

    await db.ticketWorkOrderLink.upsert({
      where: {
        ticketId_workOrderId_relationshipType: {
          ticketId: waterTicket.id,
          workOrderId: waterWorkOrder.id,
          relationshipType: 'GENERATED_FROM',
        },
      },
      update: {},
      create: {
        ticketId: waterTicket.id,
        workOrderId: waterWorkOrder.id,
        relationshipType: 'GENERATED_FROM',
        createdById: facilityUser?.id,
      },
    });

    const taskTitles = [
      'Inspect seepage source',
      'Reseal plumbing joint',
      'Pressure-test bathroom line',
      'Resident handover and cleanup',
    ];
    for (let index = 0; index < taskTitles.length; index++) {
      const title = taskTitles[index]!;
      const existingTask = await db.workOrderTask.findFirst({
        where: { workOrderId: waterWorkOrder.id, title },
      });
      const taskData = {
        description: 'Executive demo water-leak resolution step',
        sequence: index + 1,
        status: 'COMPLETED' as const,
        assignedUserId: plumberUser?.id,
        completedById: plumberUser?.id,
        completedAt: new Date('2026-04-12T11:00:00.000Z'),
        resultNotes: 'Completed during RC executive demo reconciliation.',
      };
      if (existingTask) {
        await db.workOrderTask.update({ where: { id: existingTask.id }, data: taskData });
      } else {
        await db.workOrderTask.create({
          data: {
            workOrderId: waterWorkOrder.id,
            title,
            ...taskData,
          },
        });
      }
    }

    const plumbingItem =
      (await db.inventoryItem.findFirst({
        where: {
          OR: [{ name: { contains: 'PVC' } }, { name: { contains: 'Valve' } }],
        },
      })) ??
      (await db.inventoryItem.findFirst({
        where: {
          status: 'ACTIVE',
        },
      }));
    const uom = plumbingItem
      ? await db.unitOfMeasure.findUnique({ where: { id: plumbingItem.baseUomId } })
      : null;
    if (plumbingItem && uom) {
      const existingRequirement = await db.workOrderMaterialRequirement.findFirst({
        where: { workOrderId: waterWorkOrder.id, itemId: plumbingItem.id },
      });
      const requirementData = {
        requiredQty: 1,
        reservedQty: 1,
        issuedQty: 1,
        consumedQty: 1,
        uomId: uom.id,
        priority: 'HIGH' as const,
        status: 'FULFILLED' as const,
        requestedById: plumberUser?.id,
        notes: 'PVC plumbing spare consumed for seepage repair demo story.',
      };
      if (existingRequirement) {
        await db.workOrderMaterialRequirement.update({
          where: { id: existingRequirement.id },
          data: requirementData,
        });
      } else {
        await db.workOrderMaterialRequirement.create({
          data: {
            workOrderId: waterWorkOrder.id,
            itemId: plumbingItem.id,
            ...requirementData,
          },
        });
      }
    }

    await db.ticketFeedback.upsert({
      where: { ticketId: waterTicket.id },
      update: {
        rating: 5,
        comment: 'Issue resolved cleanly on the first visit.',
        submittedAt: new Date('2026-04-12T12:00:00.000Z'),
      },
      create: {
        ticketId: waterTicket.id,
        residentId: waterTicket.reportedByResidentId,
        userId: residentUser?.id ?? adminUser!.id,
        rating: 5,
        comment: 'Issue resolved cleanly on the first visit.',
        submittedAt: new Date('2026-04-12T12:00:00.000Z'),
      },
    });
  }

  const liftAsset = await db.asset.findFirst({
    where: {
      assetCode: 'AST-2026-000004',
    },
  });
  const workOrderWorkflow =
    (await db.workflowDefinition.findFirst({
      where: { communityId: liftAsset?.communityId ?? communityId, entityType: 'WORK_ORDER' },
    })) ?? (await db.workflowDefinition.findFirst({ where: { entityType: 'WORK_ORDER' } }));
  if (liftAsset && workOrderWorkflow) {
    const workOrderId = '00000000-0000-0000-0000-000000025501';
    const liftWorkOrderData = {
      title: 'Tower A passenger lift inverter trip repair',
      description:
        'Emergency corrective work order for Lift-1 drive inverter over-temperature trip.',
      workType: 'EMERGENCY' as const,
      priority: 'URGENT' as const,
      locationType: 'BUILDING' as const,
      buildingId: liftAsset.buildingId,
      locationDescription: liftAsset.locationDescription,
      source: 'MANUAL' as const,
      currentState: 'COMPLETED',
      actualStartAt: new Date('2026-04-14T08:45:00.000Z'),
      actualEndAt: new Date('2026-04-14T11:20:00.000Z'),
      completionSummary:
        'OEM technician reset inverter, cleaned control cabinet ventilation, tested safety interlocks, and restored Lift-1.',
      resolutionCode: 'OEM_REPAIR_COMPLETED',
      verifiedById: facilityUser?.id,
      verifiedAt: new Date('2026-04-14T11:30:00.000Z'),
      createdById: facilityUser?.id,
    };
    const liftWorkOrder = await db.workOrder.upsert({
      where: {
        organizationId_communityId_workOrderNumber: {
          organizationId: liftAsset.organizationId,
          communityId: liftAsset.communityId,
          workOrderNumber: 'WO-DEMO-LIFT-01',
        },
      },
      update: liftWorkOrderData,
      create: {
        id: workOrderId,
        organization: { connect: { id: liftAsset.organizationId } },
        community: { connect: { id: liftAsset.communityId } },
        workOrderNumber: 'WO-DEMO-LIFT-01',
        title: liftWorkOrderData.title,
        description: liftWorkOrderData.description,
        workType: liftWorkOrderData.workType,
        priority: liftWorkOrderData.priority,
        locationType: liftWorkOrderData.locationType,
        ...(liftAsset.buildingId ? { building: { connect: { id: liftAsset.buildingId } } } : {}),
        locationDescription: liftWorkOrderData.locationDescription,
        source: liftWorkOrderData.source,
        currentState: liftWorkOrderData.currentState,
        actualStartAt: liftWorkOrderData.actualStartAt,
        actualEndAt: liftWorkOrderData.actualEndAt,
        completionSummary: liftWorkOrderData.completionSummary,
        resolutionCode: liftWorkOrderData.resolutionCode,
        ...(facilityUser?.id
          ? {
              createdByUser: { connect: { id: facilityUser.id } },
              verifiedByUser: { connect: { id: facilityUser.id } },
            }
          : {}),
        verifiedAt: liftWorkOrderData.verifiedAt,
        workflowInstance: {
          create: {
            organizationId: liftAsset.organizationId,
            communityId: liftAsset.communityId,
            workflowDefinitionId: workOrderWorkflow.id,
            workflowDefinitionKey: workOrderWorkflow.key,
            workflowVersion: workOrderWorkflow.version,
            resourceType: 'WORK_ORDER',
            resourceId: workOrderId,
            currentState: 'COMPLETED',
            status: 'COMPLETED',
          },
        },
      },
    });

    await db.asset.update({
      where: { id: liftAsset.id },
      data: { operationalStatus: 'OPERATIONAL', condition: 'GOOD' },
    });

    await db.workOrderAssetLink.upsert({
      where: {
        workOrderId_assetId_relationshipType: {
          workOrderId: liftWorkOrder.id,
          assetId: liftAsset.id,
          relationshipType: 'PRIMARY_ASSET',
        },
      },
      update: { resultingCondition: 'GOOD' },
      create: {
        workOrderId: liftWorkOrder.id,
        assetId: liftAsset.id,
        relationshipType: 'PRIMARY_ASSET',
        initialCondition: 'FAIR',
        resultingCondition: 'GOOD',
        notes: 'Lift breakdown demo link between asset and repair work order.',
        createdById: facilityUser?.id,
      },
    });

    const downtime = await db.assetDowntime.findFirst({
      where: { assetId: liftAsset.id, sourceWorkOrderId: liftWorkOrder.id },
    });
    const downtimeData = {
      startedAt: new Date('2026-04-14T08:35:00.000Z'),
      endedAt: new Date('2026-04-14T11:30:00.000Z'),
      durationMinutes: 175,
      reason: 'BREAKDOWN' as const,
      impactLevel: 'FULL_OUTAGE' as const,
      notes:
        'Drive inverter over-temperature trip. Lift-2 remained operational while Lift-1 was repaired.',
      createdById: facilityUser?.id,
      closedById: facilityUser?.id,
    };
    if (downtime) {
      await db.assetDowntime.update({ where: { id: downtime.id }, data: downtimeData });
    } else {
      await db.assetDowntime.create({
        data: { assetId: liftAsset.id, sourceWorkOrderId: liftWorkOrder.id, ...downtimeData },
      });
    }

    const serviceRecord = await db.assetServiceRecord.findFirst({
      where: { assetId: liftAsset.id, workOrderId: liftWorkOrder.id },
    });
    const serviceData = {
      serviceDate: new Date('2026-04-14T11:30:00.000Z'),
      serviceType: 'CORRECTIVE' as const,
      providerName: 'OTIS Elevator Company (India) Ltd',
      summary: 'Lift-1 emergency breakdown repair completed and asset restored to operation.',
      technicianNotes:
        'Inverter thermal trip reset, ventilation path cleaned, controller diagnostics passed.',
      source: 'WORK_ORDER' as const,
      createdById: facilityUser?.id,
    };
    if (serviceRecord) {
      await db.assetServiceRecord.update({ where: { id: serviceRecord.id }, data: serviceData });
    } else {
      await db.assetServiceRecord.create({
        data: { assetId: liftAsset.id, workOrderId: liftWorkOrder.id, ...serviceData },
      });
    }
  }

  const waterWarning = await db.utilityQualityTest.findFirst({
    where: {
      communityId,
      sampleLocation: 'Domestic Water Tanker Inlet - Gate 2',
      parameter: 'TDS',
      status: 'FAILED',
    },
  });
  const warningTest =
    waterWarning ??
    (await db.utilityQualityTest.create({
      data: {
        communityId,
        sampleLocation: 'Domestic Water Tanker Inlet - Gate 2',
        sampleTime: new Date('2026-04-16T07:45:00.000Z'),
        parameter: 'TDS',
        result: 812,
        unit: 'ppm',
        acceptableRangeMin: 50,
        acceptableRangeMax: 500,
        status: 'FAILED',
      },
    }));

  const passedRetest = await db.utilityQualityTest.findFirst({
    where: {
      communityId,
      sampleLocation: 'Domestic Water Tanker Inlet - Gate 2',
      parameter: 'TDS',
      status: 'PASSED',
    },
  });
  if (!passedRetest) {
    await db.utilityQualityTest.create({
      data: {
        communityId,
        sampleLocation: 'Domestic Water Tanker Inlet - Gate 2',
        sampleTime: new Date('2026-04-16T14:30:00.000Z'),
        parameter: 'TDS',
        result: 184,
        unit: 'ppm',
        acceptableRangeMin: 50,
        acceptableRangeMax: 500,
        status: 'PASSED',
      },
    });
  }

  const waterIncident = await db.safetyIncident.upsert({
    where: { incidentNumber: 'INC-DEMO-WATER-QUALITY-01' },
    update: {
      status: 'CLOSED',
      sourceReferenceId: warningTest.id,
      resolvedAt: new Date('2026-04-16T15:00:00.000Z'),
      closedAt: new Date('2026-04-16T15:30:00.000Z'),
    },
    create: {
      organizationId,
      communityId,
      incidentNumber: 'INC-DEMO-WATER-QUALITY-01',
      title: 'Tanker Water TDS Deviation Alert',
      description:
        'Incoming tanker water sample exceeded potable TDS limits and was diverted pending corrective action.',
      incidentType: 'UTILITY_QUALITY',
      severity: 'SEV_3_MEDIUM',
      priority: 'HIGH',
      status: 'CLOSED',
      sourceType: 'UTILITY_QUALITY_TEST',
      sourceReferenceId: warningTest.id,
      locationDetails: 'Domestic Water Tanker Inlet - Gate 2',
      reportedAt: new Date('2026-04-16T07:50:00.000Z'),
      containedAt: new Date('2026-04-16T08:10:00.000Z'),
      resolvedAt: new Date('2026-04-16T15:00:00.000Z'),
      closedAt: new Date('2026-04-16T15:30:00.000Z'),
    },
  });

  const action = await db.incidentAction.findFirst({
    where: { incidentId: waterIncident.id, title: 'Quarantine tanker and backwash filtration bed' },
  });
  const actionData = {
    description:
      'Supplier tanker isolated, inlet diverted to flushing reservoir, and secondary filtration bed backwashed before retest.',
    ownerId: safetyUser?.id,
    priority: 'HIGH',
    status: 'COMPLETED',
    dueAt: new Date('2026-04-16T12:00:00.000Z'),
    completedAt: new Date('2026-04-16T13:30:00.000Z'),
    completionNotes: 'Retest sample passed potable range after corrective action.',
  };
  if (action) {
    await db.incidentAction.update({ where: { id: action.id }, data: actionData });
  } else {
    await db.incidentAction.create({
      data: {
        incidentId: waterIncident.id,
        title: 'Quarantine tanker and backwash filtration bed',
        ...actionData,
      },
    });
  }

  await db.incidentInvestigation.upsert({
    where: { incidentId: waterIncident.id },
    update: {
      status: 'COMPLETED',
      completedAt: new Date('2026-04-16T15:15:00.000Z'),
    },
    create: {
      incidentId: waterIncident.id,
      methodology: '5_WHYS',
      immediateCause: 'Incoming tanker sample exceeded acceptable TDS range.',
      rootCause: 'Supplier tanker was filled from a high-TDS borewell source before arrival.',
      contributingFactors: ['Supplier source rotation was not pre-declared'],
      recommendations:
        'Require tanker source declaration and retain inlet rapid-test quarantine before transfer.',
      status: 'COMPLETED',
      completedAt: new Date('2026-04-16T15:15:00.000Z'),
    },
  });

  const timeline = await db.incidentTimelineEntry.findFirst({
    where: { incidentId: waterIncident.id, title: 'Retest passed and incident closed' },
  });
  if (!timeline) {
    await db.incidentTimelineEntry.create({
      data: {
        incidentId: waterIncident.id,
        entryType: 'CLOSURE',
        title: 'Retest passed and incident closed',
        description: 'TDS retest passed at 184 ppm and potable supply release was approved.',
        actorId: safetyUser?.id,
        occurredAt: new Date('2026-04-16T15:30:00.000Z'),
      },
    });
  }

  const supplierInvoice = await db.supplierInvoice.findFirst({
    where: { internalInvoiceNumber: 'APINV-2026-000001' },
    include: { vendorAccount: true, accountingEntity: true, purchaseOrder: true },
  });
  const apBankAccount = supplierInvoice
    ? await db.bankAccount.findFirst({
        where: { accountingEntityId: supplierInvoice.accountingEntityId, isDefault: true },
      })
    : null;
  const fiscalYear = supplierInvoice
    ? await db.fiscalYear.findFirst({
        where: {
          accountingEntityId: supplierInvoice.accountingEntityId,
          startDate: { lte: new Date('2026-04-20') },
          endDate: { gte: new Date('2026-04-20') },
        },
      })
    : null;
  const period = supplierInvoice
    ? await db.accountingPeriod.findFirst({
        where: {
          fiscalYearId: fiscalYear?.id,
          startDate: { lte: new Date('2026-04-20') },
          endDate: { gte: new Date('2026-04-20') },
        },
      })
    : null;
  const apAccount = supplierInvoice
    ? await db.ledgerAccount.findFirst({
        where: {
          accountingEntityId: supplierInvoice.accountingEntityId,
          systemAccountKey: 'AP_CONTROL',
        },
      })
    : null;
  const purchaseOrder = await db.purchaseOrder.findFirst({
    where: { poNumber: 'PO-2026-000001' },
  });

  if (supplierInvoice && apBankAccount && fiscalYear && period && apAccount) {
    const paymentAmount = Number(supplierInvoice.grandTotal);
    const paymentJournal = await db.journalEntry.upsert({
      where: {
        accountingEntityId_journalNumber: {
          accountingEntityId: supplierInvoice.accountingEntityId,
          journalNumber: 'PAY-JV-2026-000001',
        },
      },
      update: {},
      create: {
        accountingEntityId: supplierInvoice.accountingEntityId,
        journalNumber: 'PAY-JV-2026-000001',
        journalType: 'GENERAL',
        journalDate: new Date('2026-04-20'),
        fiscalYearId: fiscalYear.id,
        accountingPeriodId: period.id,
        status: 'POSTED',
        description: 'Vendor payment posted for executive demo AP chain',
        reference: 'VPAY-2026-000001',
        sourceModule: 'AP',
        sourceType: 'VENDOR_PAYMENT',
        sourceId: 'VPAY-2026-000001',
        postingPurpose: 'DEMO_VENDOR_PAYMENT',
        currency: 'INR',
        totalDebit: paymentAmount,
        totalCredit: paymentAmount,
        idempotencyKey: 'demo-ap-payment-journal-v1',
        postedAt: new Date('2026-04-20T10:00:00.000Z'),
        postedById: safetyUser?.id ?? adminUser?.id,
        createdById: safetyUser?.id ?? adminUser?.id,
        lines: {
          create: [
            {
              lineNumber: 1,
              accountId: apAccount.id,
              description: 'Clear AP liability for APINV-2026-000001',
              debitAmount: paymentAmount,
              creditAmount: 0,
              baseAmount: paymentAmount,
              partyType: 'VENDOR',
              partyId: supplierInvoice.vendorId,
            },
            {
              lineNumber: 2,
              accountId: apBankAccount.glAccountId,
              description: 'Bank payment to vendor for APINV-2026-000001',
              debitAmount: 0,
              creditAmount: paymentAmount,
              baseAmount: paymentAmount,
              partyType: 'VENDOR',
              partyId: supplierInvoice.vendorId,
            },
          ],
        },
      },
      include: { lines: true },
    });

    for (const line of paymentJournal.lines) {
      const existingGl = await db.generalLedgerEntry.findFirst({
        where: { journalLineId: line.id },
      });
      if (!existingGl) {
        await db.generalLedgerEntry.create({
          data: {
            accountingEntityId: supplierInvoice.accountingEntityId,
            journalEntryId: paymentJournal.id,
            journalLineId: line.id,
            accountId: line.accountId,
            postingDate: paymentJournal.journalDate,
            fiscalYearId: fiscalYear.id,
            periodId: period.id,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            baseAmount: line.baseAmount,
            sourceModule: 'AP',
            sourceType: 'VENDOR_PAYMENT',
            sourceId: 'VPAY-2026-000001',
            postedAt: paymentJournal.postedAt ?? new Date('2026-04-20T10:00:00.000Z'),
          },
        });
      }
    }

    const vendorPayment = await db.vendorPayment.upsert({
      where: {
        organizationId_paymentNumber: {
          organizationId: supplierInvoice.organizationId,
          paymentNumber: 'VPAY-2026-000001',
        },
      },
      update: {
        amount: paymentAmount,
        allocatedAmount: paymentAmount,
        unallocatedAmount: 0,
        status: 'SUCCESS',
        postingJournalId: paymentJournal.id,
      },
      create: {
        organizationId: supplierInvoice.organizationId,
        accountingEntityId: supplierInvoice.accountingEntityId,
        communityId: supplierInvoice.communityId,
        vendorAccountId: supplierInvoice.vendorAccountId,
        paymentNumber: 'VPAY-2026-000001',
        paymentDate: new Date('2026-04-20'),
        amount: paymentAmount,
        allocatedAmount: paymentAmount,
        unallocatedAmount: 0,
        currency: 'INR',
        paymentMethod: 'BANK_TRANSFER',
        bankAccountId: apBankAccount.id,
        referenceNumber: 'NEFT-DEMO-AP-000001',
        status: 'SUCCESS',
        postingJournalId: paymentJournal.id,
        idempotencyKey: 'demo-ap-payment-v1',
        createdById: safetyUser?.id ?? adminUser?.id,
      },
    });

    const existingAllocation = await db.vendorPaymentAllocation.findFirst({
      where: { vendorPaymentId: vendorPayment.id, supplierInvoiceId: supplierInvoice.id },
    });
    if (!existingAllocation) {
      await db.vendorPaymentAllocation.create({
        data: {
          vendorPaymentId: vendorPayment.id,
          supplierInvoiceId: supplierInvoice.id,
          allocationAmount: paymentAmount,
        },
      });
    }

    await db.supplierInvoice.update({
      where: { id: supplierInvoice.id },
      data: {
        purchaseOrderId: supplierInvoice.purchaseOrderId ?? purchaseOrder?.id,
        status: 'PAID',
        paidAmount: paymentAmount,
        outstandingAmount: 0,
        postingJournalId: supplierInvoice.postingJournalId,
      },
    });

    await db.vendorAccount.update({
      where: { id: supplierInvoice.vendorAccountId },
      data: {
        currentPayable: 0,
        lastPaymentDate: new Date('2026-04-20'),
      },
    });

    await db.vendorLedgerEntry.upsert({
      where: { id: '00000000-0000-0000-0000-000000025502' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000025502',
        vendorAccountId: supplierInvoice.vendorAccountId,
        entryDate: new Date('2026-04-20'),
        entryType: 'PAYMENT',
        referenceType: 'VENDOR_PAYMENT',
        referenceId: vendorPayment.paymentNumber,
        debit: paymentAmount,
        credit: 0,
        runningBalance: 0,
        currency: 'INR',
        description: 'Vendor payment VPAY-2026-000001 allocated to APINV-2026-000001',
        postingJournalId: paymentJournal.id,
      },
    });
  }
}
