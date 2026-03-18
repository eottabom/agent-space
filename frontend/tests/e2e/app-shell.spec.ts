import { expect, test, type Locator, type Page } from '@playwright/test'

const TEST_CWD = '/tmp'
const LONG_OUTPUT_COMMAND = `printf 'x%.0s' {1..700}; echo "__PLAYWRIGHT_OUTPUT__"`
const IDLE_TIMEOUT_MS = 6000

async function openCreateSessionModal(page: Page): Promise<void> {
  await page.getByTestId('launch-agent-bash').click()
  await expect(page.getByTestId('create-session-modal')).toBeVisible()
}

async function launchBashSession(page: Page, alias: string): Promise<void> {
  await openCreateSessionModal(page)
  await page.getByTestId('session-alias-input').fill(alias)
  await page.getByTestId('submit-session-button').click()
  await terminalCard(page, alias)
}

async function terminalCard(page: Page, alias: string): Promise<Locator> {
  const card = page.locator('[data-testid^="terminal-card-"]').filter({ hasText: alias }).first()
  await expect(card).toBeVisible()
  return card
}

async function sessionIdForAlias(page: Page, alias: string): Promise<string> {
  const card = await terminalCard(page, alias)
  const testId = await card.getAttribute('data-testid')
  if (!testId) {
    throw new Error(`세션 test id를 찾지 못했습니다: ${alias}`)
  }
  return testId.replace('terminal-card-', '')
}

async function terminalStatus(page: Page, alias: string): Promise<Locator> {
  const card = await terminalCard(page, alias)
  return card.locator('[data-testid^="terminal-status-"]').first()
}

async function terminalTextarea(page: Page, alias: string): Promise<Locator> {
  const card = await terminalCard(page, alias)
  const textarea = card.locator('.xterm-helper-textarea')
  await expect(textarea).toBeAttached()
  return textarea
}

async function avatar(page: Page, alias: string): Promise<Locator> {
  const sessionId = await sessionIdForAlias(page, alias)
  const locator = page.getByTestId(`avatar-${sessionId}`)
  await expect(locator).toBeVisible()
  return locator
}

async function runCommand(page: Page, alias: string, command: string): Promise<void> {
  const textarea = await terminalTextarea(page, alias)
  await textarea.click()
  await page.keyboard.type(command)
  await page.keyboard.press('Enter')
}

async function killSession(page: Page, alias: string): Promise<void> {
  const card = page.locator('[data-testid^="terminal-card-"]').filter({ hasText: alias }).first()
  if (await card.count() === 0) {
    return
  }
  await card.locator('[data-testid^="kill-terminal-"]').click()
  await expect(card).toHaveCount(0, { timeout: 12000 })
}

test.describe('Agent Space E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
    })
  })

  test.afterEach(async ({ page }, testInfo) => {
    const alias = testInfo.title.replace(/\s+/g, '-').toLowerCase()
    await killSession(page, alias)
  })

  test('favicon uses the shared png asset', async ({ page }) => {
    await page.goto('/')

    const favicon = page.locator('link[rel="icon"]')
    await expect(favicon).toHaveAttribute('href', '/favicon.png')

    const response = await page.request.get('/favicon.png')
    expect(response.ok()).toBeTruthy()
  })

  test('bash session launches and shows working UI', async ({ page }) => {
    const alias = 'bash-session-launches-and-shows-working-ui'

    await page.goto('/')
    await expect(page.getByText('online')).toBeVisible()
    await page.getByTestId('cwd-input').fill(TEST_CWD)

    await launchBashSession(page, alias)

    const status = await terminalStatus(page, alias)
    await expect(status).toHaveText('working')

    const currentAvatar = await avatar(page, alias)
    await expect(currentAvatar).toHaveAttribute('data-zone', 'WORKING_ZONE')
  })

  test('session returns to idle zone after output becomes quiet', async ({ page }) => {
    const alias = 'session-returns-to-idle-zone-after-output-becomes-quiet'

    await page.goto('/')
    await page.getByTestId('cwd-input').fill(TEST_CWD)
    await launchBashSession(page, alias)

    await runCommand(page, alias, LONG_OUTPUT_COMMAND)

    const status = await terminalStatus(page, alias)
    await expect(status).toHaveText('working')

    const currentAvatar = await avatar(page, alias)
    await expect(currentAvatar).toHaveAttribute('data-zone', 'WORKING_ZONE')

    await page.waitForTimeout(IDLE_TIMEOUT_MS)

    await expect(status).toHaveText('idle')
    await expect(currentAvatar).toHaveAttribute('data-zone', 'IDLE_ZONE')
  })

  test('avatar movement keeps the slower transition duration', async ({ page }) => {
    const alias = 'avatar-movement-keeps-the-slower-transition-duration'

    await page.goto('/')
    await page.getByTestId('cwd-input').fill(TEST_CWD)
    await launchBashSession(page, alias)

    const currentAvatar = await avatar(page, alias)
    await expect(currentAvatar).toHaveAttribute('style', /transition: transform 8s steps\(30\)/)
  })
})
