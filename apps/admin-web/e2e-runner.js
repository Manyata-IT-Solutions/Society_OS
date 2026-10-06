const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MODULE_TESTS = [
  {
    name: 'Dashboard Overview',
    url: '/app',
    verifySelector: 'body',
    expectedText: 'Platform Command Center',
  },
  {
    name: 'Organizations & Properties',
    url: '/app/organizations',
    verifySelector: 'body',
    expectedText: 'Organizations',
  },
  {
    name: 'Portfolios',
    url: '/app/portfolios',
    verifySelector: 'body',
    expectedText: 'Portfolios',
  },
  {
    name: 'User Directory',
    url: '/app/users',
    verifySelector: 'body',
    expectedText: 'User Directory',
  },
  {
    name: 'Tenant Memberships',
    url: '/app/memberships',
    verifySelector: 'body',
    expectedText: 'Tenant Memberships',
  },
  {
    name: 'Roles & Permissions',
    url: '/app/roles',
    verifySelector: 'body',
    expectedText: 'Roles',
  },
  {
    name: 'Role Assignments',
    url: '/app/role-assignments',
    verifySelector: 'body',
    expectedText: 'Role Assignments',
  },
  {
    name: 'Active Sessions',
    url: '/app/sessions',
    verifySelector: 'body',
    expectedText: 'Active Sessions',
  },
  {
    name: 'Finance: Chart of Accounts',
    url: '/app/finance/accounts',
    actionButton: 'Add Account',
    modalTitle: 'Add General Ledger Account',
    cancelButton: 'Cancel',
  },
  {
    name: 'Finance: Journal Vouchers',
    url: '/app/finance/journals',
    actionButton: 'New Journal Voucher',
    modalTitle: 'Record Journal Voucher',
    cancelButton: 'Cancel',
  },
  {
    name: 'Governance: Committees',
    url: '/app/governance/committees',
    actionButton: 'Create Committee',
    modalTitle: 'Create Society Committee',
    cancelButton: 'Cancel',
  },
  {
    name: 'Governance: Meetings',
    url: '/app/governance/meetings',
    actionButton: 'Schedule Meeting',
    modalTitle: 'Schedule Governance Meeting',
    cancelButton: 'Cancel',
  },
  {
    name: 'Workforce: Workers Directory',
    url: '/app/workforce/workers',
    actionButton: 'Add Worker',
    modalTitle: 'Add Operational Worker',
    cancelButton: 'Cancel',
  },
  {
    name: 'Workforce: Shift Roster',
    url: '/app/workforce/roster',
    actionButton: 'Create Roster Period',
    modalTitle: 'Create Roster Period',
    cancelButton: 'Cancel',
  },
  {
    name: 'Workforce: Skills & Licenses',
    url: '/app/workforce/skills',
    actionButton: 'Add Skill',
    modalTitle: 'Add Skill / Trade License',
    cancelButton: 'Cancel',
  },
  {
    name: 'Workforce: Routine Checklists',
    url: '/app/workforce/tasks',
    actionButton: 'Create Task Checklist',
    modalTitle: 'Create Task Checklist',
    cancelButton: 'Cancel',
  },
  {
    name: 'Utilities: Meter Registry',
    url: '/app/utilities/meters',
    actionButton: 'Register Meter',
    modalTitle: 'Register New Meter',
    cancelButton: 'Cancel',
  },
  {
    name: 'Utilities: Meter Readings',
    url: '/app/utilities/readings',
    actionButton: 'Record Reading',
    modalTitle: 'Record Meter Reading',
    cancelButton: 'Cancel',
  },
  {
    name: 'Utilities: DG Energy Management',
    url: '/app/utilities/energy',
    actionButton: 'Record DG Run',
    modalTitle: 'Record DG Run Log',
    cancelButton: 'Cancel',
  },
  {
    name: 'Utilities: Water & Tanker Deliveries',
    url: '/app/utilities/water',
    actionButton: 'Record Tanker',
    modalTitle: 'Record Water Tanker Receipt',
    cancelButton: 'Cancel',
  },
  {
    name: 'Utilities: Outages & Restorations',
    url: '/app/utilities/outages',
    actionButton: 'Report Outage',
    modalTitle: 'Schedule Utility Outage',
    cancelButton: 'Cancel',
  },
  {
    name: 'Utilities: Tariff Engine',
    url: '/app/utilities/tariffs',
    actionButton: 'Create Tariff Plan',
    modalTitle: 'Create Tariff Plan',
    cancelButton: 'Cancel',
  },
  {
    name: 'Safety: Compliance Requirements',
    url: '/app/safety/compliance',
    actionButton: 'Add Requirement',
    modalTitle: 'Add Compliance Requirement',
    cancelButton: 'Cancel',
  },
  {
    name: 'Safety: Licenses & Credentials',
    url: '/app/safety/credentials',
    actionButton: 'Register Credential',
    modalTitle: 'Register Safety Credential',
    cancelButton: 'Cancel',
  },
  {
    name: 'Safety: Emergency Drills',
    url: '/app/safety/drills',
    actionButton: 'Plan Drill',
    modalTitle: 'Plan Emergency Drill',
    cancelButton: 'Cancel',
  },
  {
    name: 'Safety: Evacuation Zones',
    url: '/app/safety/evacuation',
    actionButton: 'Add Evacuation Plan',
    modalTitle: 'Add Evacuation Zone Plan',
    cancelButton: 'Cancel',
  },
  {
    name: 'Safety: Hazards & Risks',
    url: '/app/safety/hazards-risks',
    actionButton: 'Report Hazard',
    modalTitle: 'Report Identified Hazard',
    cancelButton: 'Cancel',
  },
  {
    name: 'Safety: Incidents & Near-Misses',
    url: '/app/safety/incidents',
    actionButton: 'Report Incident',
    modalTitle: 'Report Incident or Near-Miss',
    cancelButton: 'Cancel',
  },
  {
    name: 'Safety: Physical Inspections',
    url: '/app/safety/inspections',
    actionButton: 'Schedule Inspection',
    modalTitle: 'Schedule Safety Inspection',
    cancelButton: 'Cancel',
  },
  {
    name: 'Safety: Emergency SOS Protocol',
    url: '/app/safety/sos',
    actionButton: 'Trigger Test SOS',
    modalTitle: 'Simulate Emergency SOS Dispatch',
    cancelButton: 'Cancel',
  },
  {
    name: 'Analytics & Custom Reporting',
    url: '/app/analytics/reports',
    actionButton: 'Build Custom Report',
    modalTitle: 'Build Custom Analytical Report',
    cancelButton: 'Cancel',
  },
  {
    name: 'Resident Helpdesk',
    url: '/app/helpdesk',
    verifySelector: 'body',
    expectedText: 'Helpdesk',
  },
  {
    name: 'Audit Trail',
    url: '/app/audit',
    verifySelector: 'body',
    expectedText: 'Audit Trail',
  },
  {
    name: 'Notifications Center',
    url: '/app/notifications',
    verifySelector: 'body',
    expectedText: 'Notifications',
  },
];

async function runE2ESuite() {
  console.log('====================================================');
  console.log('🚀 STARTING PLAYWRIGHT E2E SUITE: ALL MODULES & ACTIONS');
  console.log('Target Base URL:', BASE_URL);
  console.log('====================================================\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const results = [];
  const errors = [];

  page.on('pageerror', (err) => {
    errors.push(`PageError on ${page.url()}: ${err.message}`);
  });

  // STEP 1: AUTHENTICATION
  console.log('➡️ [Step 1/2] Authenticating via /login ...');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Allow React hydration
    
    // Fill credentials
    await page.fill('input[type="email"]', 'admin@communityos.io');
    await page.fill('input[type="password"]', 'Admin@CommunityOS2026!');
    
    // Click Sign In
    await page.click('button[type="submit"]');

    // Wait for redirect to /app
    await page.waitForURL('**/app**', { timeout: 20000 });
    console.log('✅ Authentication successful! Redirected to /app\n');
    results.push({ module: 'Authentication', action: 'Sign in to Console', status: 'PASSED' });
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    results.push({ module: 'Authentication', action: 'Sign in to Console', status: 'FAILED', error: err.message });
    await browser.close();
    process.exit(1);
  }

  // STEP 2: MODULE-BY-MODULE VERIFICATION & ACTION MODALS
  console.log(`➡️ [Step 2/2] Testing ${MODULE_TESTS.length} modules and action buttons ...\n`);

  for (let i = 0; i < MODULE_TESTS.length; i++) {
    const test = MODULE_TESTS[i];
    const indexStr = `[${i + 1}/${MODULE_TESTS.length}]`;

    try {
      // Navigate to route
      await page.goto(`${BASE_URL}${test.url}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1200); // Allow react hydrate and layout render

      // Verify page content
      if (test.expectedText) {
        const content = await page.content();
        if (!content.includes(test.expectedText)) {
          throw new Error(`Expected text "${test.expectedText}" not found on page`);
        }
      }

      // If test has an action button (modal)
      if (test.actionButton) {
        // Find button by text
        const actionBtn = page.getByRole('button', { name: test.actionButton }).first();
        const isVisible = await actionBtn.isVisible();
        if (!isVisible) {
          throw new Error(`Action button "${test.actionButton}" not visible on page`);
        }

        // Scroll and Click action button to open modal
        await actionBtn.scrollIntoViewIfNeeded();
        await actionBtn.click();
        await page.waitForTimeout(600);

        // Verify modal dialog appeared
        await page.getByText(test.modalTitle, { exact: false }).first().waitFor({ state: 'visible', timeout: 10000 });

        // Close modal
        const closeBtn = page.getByRole('button', { name: test.cancelButton || 'Cancel' }).last();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(400);
        }

        console.log(`✅ ${indexStr} ${test.name.padEnd(38)} Action: "${test.actionButton}" -> Modal Verified`);
        results.push({ module: test.name, action: test.actionButton, status: 'PASSED' });
      } else {
        console.log(`✅ ${indexStr} ${test.name.padEnd(38)} Route Verified`);
        results.push({ module: test.name, action: 'View Module', status: 'PASSED' });
      }
    } catch (err) {
      console.error(`❌ ${indexStr} ${test.name.padEnd(38)} ERROR: ${err.message}`);
      results.push({ module: test.name, action: test.actionButton || 'View Module', status: 'FAILED', error: err.message });
    }
  }

  await browser.close();

  console.log('\n====================================================');
  console.log('📊 TEST SUMMARY & SCORECARD');
  console.log('====================================================');
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  console.log(`Total Modules & Actions Tested: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Page Errors: ${errors.length}`);
  console.log('====================================================\n');

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter((r) => r.status === 'FAILED').forEach((f) => {
      console.log(` - ${f.module} (${f.action}): ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL 35 MODULES AND ACTIONS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runE2ESuite();
