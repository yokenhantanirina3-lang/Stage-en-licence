import { expect, test } from '@playwright/test'

const ADMIN = { email: 'admin@fiscal.mg', password: 'admin123' }

async function getCodeSuivi(val: any) {
  const res = await val.request.get('/api/v1/reclamations/', {
    params: { search: 'REC-DEMO-000001', size: 1 },
    headers: {
      Authorization: `Bearer ${val.accessToken}`,
    },
    baseURL: 'http://127.0.0.1:8000',
  })
  expect(res.ok()).toBeTruthy()
  const data = await res.json()
  return data.items[0].code_suivi
}

test('connexion administrateur et tableau de bord', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('vous@exemple.mg').fill(ADMIN.email)
  await page.getByPlaceholder('••••••••').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page).toHaveURL(/\/app$/, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: /Bonjour, Administrateur/ })).toBeVisible()
  await expect(page.locator('text=Échéances proches — à relancer').first()).toBeVisible()
})

test('listage des réclamations après connexion', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('vous@exemple.mg').fill(ADMIN.email)
  await page.getByPlaceholder('••••••••').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await page.goto('/app/reclamations')
  await expect(page.getByRole('heading', { name: 'Réclamations' })).toBeVisible()
  await expect(page.locator('text=REC-DEMO-000001').first()).toBeVisible({ timeout: 20_000 })
})

test('portail contribuable : recherche par code de suivi', async ({ page }) => {
  const accessToken = await page.request.post('/api/v1/auth/login', {
    baseURL: 'http://127.0.0.1:8000',
    data: new URLSearchParams({ username: ADMIN.email, password: ADMIN.password }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then((r) => r.json().then((d) => d.access_token))

  const code = await getCodeSuivi({ request: page.request, accessToken })

  await page.goto('/suivi')
  await page.getByPlaceholder(/Ex : 202609/).fill(code)
  await page.getByRole('button', { name: 'Suivre mon dossier' }).click()

  await expect(page.locator('text=REC-DEMO-000001').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('text=Code de suivi').first()).toBeVisible()
})

test('portail contribuable : code inconnu', async ({ page }) => {
  await page.goto('/suivi')
  await page.getByPlaceholder(/Ex : 202609/).fill('299901-XXXXXX')
  await page.getByRole('button', { name: 'Suivre mon dossier' }).click()

  await expect(page.locator('text=Dossier introuvable').first()).toBeVisible({ timeout: 20_000 })
})