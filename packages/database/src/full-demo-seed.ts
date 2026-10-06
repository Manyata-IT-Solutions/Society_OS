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
    allComms.find((c) => c.slug === 'green-valley-township' || c.code === 'GVH') || allComms[0]!;

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

  const durationSec = ((Date.now() - t0) / 1000).toFixed(2);
  console.log('✅ [COMPLETE] Full Enterprise Demo Dataset scaled up in ' + durationSec + 's!');
}
