const { chromium } = require('@playwright/test');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Logging in as Platform Admin...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500); // Wait for React hydration
  await page.fill('input[type="email"]', 'admin@communityos.io');
  await page.fill('input[type="password"]', 'Admin@CommunityOS2026!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/app**', { timeout: 25000 });
  console.log('✅ Logged in successfully!');

  const testRoutes = [
    { name: 'Organizations', href: '/app/organizations', expectedTitle: 'Organizations & Enterprise Accounts' },
    { name: 'Communities Master', href: '/app/communities', expectedTitle: 'Communities Master' },
    { name: 'Residents Roster', href: '/app/residents', expectedTitle: 'Residents Roster' },
    { name: 'Households', href: '/app/households', expectedTitle: 'Households Directory' },
  ];

  for (const item of testRoutes) {
    console.log(`\nTesting navigation to ${item.name} (${item.href})...`);
    // Click the sidebar link
    const link = page.locator(`aside nav a[href="${item.href}"]`).first();
    await link.click();
    await page.waitForURL(`**${item.href}**`, { timeout: 20000 });
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    if (!currentUrl.includes(item.href)) {
      throw new Error(`Expected URL to include ${item.href}, but got ${currentUrl}`);
    }

    // Verify page content
    const pageText = await page.textContent('body');
    if (!pageText.includes(item.expectedTitle)) {
      throw new Error(`Expected page text to include "${item.expectedTitle}"`);
    }
    console.log(`✅ Page content verified: "${item.expectedTitle}"`);

    // Verify active sidebar items (only 1 should be active!)
    const activeLinks = await page.locator('aside nav a.bg-primary').all();
    console.log(`Number of active links in sidebar: ${activeLinks.length}`);
    for (const a of activeLinks) {
      const activeHref = await a.getAttribute('href');
      const activeText = (await a.textContent()) || '';
      console.log(`   - Active item: ${activeText.trim()} (${activeHref})`);
    }

    if (activeLinks.length !== 1) {
      throw new Error(`Expected exactly 1 active link in sidebar, but found ${activeLinks.length}`);
    }
    const activeHref = await activeLinks[0].getAttribute('href');
    if (activeHref !== item.href) {
      throw new Error(`Expected active link to have href="${item.href}", but found "${activeHref}"`);
    }
    console.log(`✅ ONLY "${item.name}" is highlighted as active!`);
  }

  // Take screenshot of Communities Master
  await page.goto('http://localhost:3000/app/communities', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'communities-master.png', fullPage: true });
  console.log('Saved communities-master.png');

  // Take screenshot of Residents Roster
  await page.goto('http://localhost:3000/app/residents', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'residents-roster.png', fullPage: true });
  console.log('Saved residents-roster.png');

  // Take screenshot of Households Directory
  await page.goto('http://localhost:3000/app/households', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'households-directory.png', fullPage: true });
  console.log('Saved households-directory.png');

  await browser.close();
  console.log('\n🎉 ALL 4 SECTIONS AND SIDEBAR ACTIVE HIGHLIGHTS VERIFIED 100%!');
}

test().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
