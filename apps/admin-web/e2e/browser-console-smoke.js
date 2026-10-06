const { chromium } = require('@playwright/test');

const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const LOGIN_EMAIL = process.env.SMOKE_LOGIN_EMAIL || 'admin@communityos.io';
const LOGIN_PASSWORD = process.env.SMOKE_LOGIN_PASSWORD || 'Admin@CommunityOS2026!';

const routes = [
  '/login',
  '/app',
  '/app/organizations',
  '/app/communities',
  '/app/residents',
  '/app/households',
  '/app/helpdesk/tickets',
  '/app/facility/work-orders',
  '/app/facility/preventive',
  '/app/finance',
  '/app/budget',
  '/app/procurement',
  '/app/security/gate-app',
  '/app/utilities',
  '/app/analytics',
];

async function login() {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Smoke login failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const tokens = payload.data?.tokens || payload.tokens;

  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error('Smoke login response did not include access and refresh tokens');
  }

  return tokens;
}

function shouldIgnoreConsoleMessage(message) {
  const text = message.text();
  return (
    text.includes('Download the React DevTools') ||
    text.includes('Fast Refresh') ||
    text.includes('[HMR]')
  );
}

async function main() {
  const tokens = await login();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const failures = [];

  page.on('console', (message) => {
    if (message.type() === 'error' && !shouldIgnoreConsoleMessage(message)) {
      failures.push(`console.error: ${message.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    failures.push(`pageerror: ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText || '';
    const url = request.url();

    if (failure === 'net::ERR_ABORTED' && url.includes('_rsc=')) {
      return;
    }

    failures.push(`requestfailed: ${request.method()} ${url} ${failure}`);
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 500) {
      failures.push(`http ${status}: ${response.url()}`);
    }
  });

  await page.goto(`${WEB_BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(({ accessToken, refreshToken }) => {
    localStorage.setItem('community_os_access_token', accessToken);
    localStorage.setItem('community_os_refresh_token', refreshToken);
  }, tokens);

  for (const route of routes) {
    const response = await page.goto(`${WEB_BASE_URL}${route}`, { waitUntil: 'networkidle' });
    if (!response || response.status() >= 400) {
      failures.push(`navigation ${response?.status() || 'NO_RESPONSE'}: ${route}`);
      continue;
    }

    const notFound = await page.locator('text=This page could not be found.').count();
    if (notFound > 0) {
      failures.push(`next 404 content rendered: ${route}`);
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
  }

  console.log(`Browser console smoke passed for ${routes.length} routes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
