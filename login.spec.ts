// login.spec.ts
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // headless: false para ver el navegador
  const context = await browser.newContext();
  const page = await context.newPage();

  // Ir a la página de login
  await page.goto('https://pruebatecnica-sherpa-production.up.railway.app/login');

  // Llenar el campo de correo
  await page.fill('input[type="email"]', 'monje@sherpa.local');

  // Llenar el campo de contraseña
  await page.fill('input[type="password"]', 'cript@123');

  // Hacer clic en el botón de login
  await page.click('button:has-text("Acceder")');

  // Esperar a que cargue el siguiente estado de la página
  await page.waitForLoadState('networkidle');

  // Esperar 3 segundos para ver el resultado
  await page.waitForTimeout(3000);

  await browser.close();
})();
