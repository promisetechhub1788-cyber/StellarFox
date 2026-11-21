import { expect, test, type Page } from '@playwright/test';

const MARKET = {
  market_id: 'mkt-visual-1',
  match_id: 'match-visual-1',
  fighter_a: 'Canelo Alvarez',
  fighter_b: 'Gennady Golovkin',
  weight_class: 'Super Middleweight',
  title_fight: true,
  venue: 'T-Mobile Arena',
  scheduled_at: '2099-01-01T20:00:00.000Z',
  status: 'open',
  outcome: null,
  pool_a: '500000000',
  pool_b: '300000000',
  pool_draw: '200000000',
  total_pool: '1000000000',
  odds_a: 5000,
  odds_b: 3000,
  odds_draw: 2000,
  fee_bps: 200,
};

async function mockVisualData(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bankerchanger_theme', 'dark');
  });

  await page.route('http://localhost:3001/api/markets*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        markets: [MARKET],
        total: 1,
        page: 1,
        limit: 20,
      }),
    }),
  );

  await page.route('**/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_markets: 1,
        total_volume: '1000000000',
        active_markets: 1,
      }),
    }),
  );

  await page.route(`**/api/markets/${MARKET.market_id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MARKET),
    }),
  );

  await page.route(`**/api/markets/${MARKET.market_id}/bets`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
}

test.describe('Visual regression', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('home page', async ({ page }) => {
    await mockVisualData(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'BANKERCHANGER' })).toBeVisible();

    await expect(page).toHaveScreenshot('home-page.png', {
      mask: [page.getByText(/days|hours|minutes|seconds/i)],
      fullPage: true,
    });
  });

  test('market detail page', async ({ page }) => {
    await mockVisualData(page);
    await page.goto(`/markets/${MARKET.market_id}`);
    await expect(page.getByText(/failed to load market/i)).toBeVisible();

    await expect(page).toHaveScreenshot('market-detail-page.png', {
      mask: [page.getByText(/days|hours|minutes|seconds/i)],
      fullPage: true,
    });
  });

  test('portfolio page', async ({ page }) => {
    await mockVisualData(page);
    await page.goto('/portfolio');
    await expect(page.getByText(/connect/i).first()).toBeVisible();

    await expect(page).toHaveScreenshot('portfolio-page.png', {
      fullPage: true,
    });
  });
});
