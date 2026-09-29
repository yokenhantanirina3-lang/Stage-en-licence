import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

const ADMIN = { email: 'admin@fiscal.mg', password: 'admin123' }
const API_URL = 'http://127.0.0.1:8000'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('vous@exemple.mg').fill(ADMIN.email)
  await page.getByPlaceholder('••••••••').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/app$/, { timeout: 20_000 })
  await expect
    .poll(() => page.evaluate(() => Boolean(localStorage.getItem('access_token'))), {
      timeout: 20_000,
    })
    .toBe(true)
}

async function adminToken(request: APIRequestContext) {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    form: { username: ADMIN.email, password: ADMIN.password },
  })
  expect(res.ok(), `login API: ${res.status()}`).toBeTruthy()
  return (await res.json()).access_token
}

async function getCodeSuivi(request: APIRequestContext, accessToken: string) {
  const res = await request.get(`${API_URL}/api/v1/reclamations/`, {
    params: { search: 'REC-DEMO-000001', size: 1 },
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  expect(res.ok(), `liste API: ${res.status()}`).toBeTruthy()
  const data = await res.json()
  expect(data.items.length).toBeGreaterThan(0)
  return data.items[0].code_suivi
}

test('connexion administrateur et tableau de bord', async ({ page }) => {
  await login(page)

  await expect(page.getByRole('heading', { name: /Bonjour, Administrateur/ })).toBeVisible()
  await expect(page.locator('text=Échéances proches — à relancer').first()).toBeVisible()
})

test('listage des réclamations après connexion', async ({ page }) => {
  await login(page)

  await page.goto('/app/reclamations')
  await expect(page).toHaveURL(/\/app\/reclamations$/)
  await expect(page.getByRole('heading', { name: 'Réclamations', level: 1 })).toBeVisible()

  await page.getByPlaceholder('Rechercher par numéro ou référence...').fill('REC-DEMO-000001')
  await expect(page.locator('text=REC-DEMO-000001').first()).toBeVisible({ timeout: 20_000 })
})

test('portail contribuable : recherche par code de suivi', async ({ page }) => {
  const code = await getCodeSuivi(page.request, await adminToken(page.request))

  await page.goto('/suivi')
  await page.getByPlaceholder(/Ex : 202609/).fill(code)
  await page.getByRole('button', { name: 'Suivre mon dossier' }).click()

  await expect(page.locator('text=REC-DEMO-000001').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('heading', { name: /Chronologie du dossier/ })).toBeVisible()
})

test('portail contribuable : code inconnu', async ({ page }) => {
  await page.goto('/suivi')
  await page.getByPlaceholder(/Ex : 202609/).fill('299901-XXXXXX')
  await page.getByRole('button', { name: 'Suivre mon dossier' }).click()

  await expect(page.locator('text=Dossier introuvable').first()).toBeVisible({ timeout: 20_000 })
})
