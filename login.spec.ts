const { chromium, Page, Download } = require('playwright'); // Añadido 'Download' aquí
const fs = require('fs');
const pdf = require('pdf-parse');

// Función auxiliar para crear una pausa
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para esperar hasta que un archivo sea legible sin error
async function waitForFileReady(filePath: string, timeout: number = 15000, interval: number = 500): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      // Intenta leer el archivo. Si tiene éxito, significa que está listo.
      fs.readFileSync(filePath);
      return true; // El archivo es legible
    } catch (e: unknown) {
      // Si hay un error al leer, el archivo aún no está listo o está corrupto.
      // Espera un intervalo antes de reintentar.
      await delay(interval);
    }
  }
  console.error(`Tiempo de espera agotado (${timeout}ms) para que el archivo esté listo: ${filePath}`);
  return false; // El archivo no estuvo listo dentro del tiempo de espera
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();

  // Login - quedamos en la página de manuscritos
  await page.goto('https://pruebatecnica-sherpa-production.up.railway.app/login');
  await delay(1000); // Pausa después de ir a la página
  await page.fill('input[type="email"]', 'monje@sherpa.local');
  await delay(1000); // Pausa después de llenar el email
  await page.fill('input[type="password"]', 'cript@123');
  await delay(1000); // Pausa después de llenar la contraseña
  await page.click('button:has-text("Acceder")');
  await delay(1000); // Pausa después de hacer clic en Acceder
  await page.waitForLoadState('networkidle');
  await delay(1000); // Pausa después de esperar la carga de la red

  let codigoAcceso: string | null = null; // Variable para almacenar el código del manuscrito anterior
  const MAX_ACTION_RETRIES = 3; // Número máximo de reintentos para cada acción de manuscrito

  // --- PRIMER MANUSCRITO: Codex Aureus de Echternach (Siglo XIV) ---
  const manuscrito1 = 'Codex Aureus de Echternach';
  const pdfPath1 = `./${manuscrito1.replace(/ /g, '_')}.pdf`;

  for (let retry1 = 0; retry1 < MAX_ACTION_RETRIES; retry1++) {
    try {
      console.log(`\n--- Procesando ${manuscrito1} (Intento: ${retry1 + 1}/${MAX_ACTION_RETRIES}) ---`);
      const cardLocator1 = page.locator(`.bg-sherpa-surface\\/10:has-text("${manuscrito1}")`).first();
      await cardLocator1.scrollIntoViewIfNeeded();
      await delay(1000); // Pausa después de hacer scroll

      console.log(`Descargando PDF del manuscrito: ${manuscrito1}`);
      const downloadButtonLocator1 = cardLocator1.locator('button:has-text("Descargar PDF")');
      await downloadButtonLocator1.waitFor({ state: 'visible' });
      await delay(1000); // Pausa después de esperar el botón de descarga

      const downloadPromise1 = page.waitForEvent('download');
      const errorDownloadMessageLocator1 = page.locator('p.text-sm.text-red-400:has-text("Error al descargar el archivo")').first();

      await downloadButtonLocator1.click();
      await delay(1000); // Pausa después de hacer clic en Descargar PDF

      const result1 = await Promise.race([
        downloadPromise1.then((d: typeof Download) => ({ type: 'download', data: d })), // Tipo corregido aquí
        errorDownloadMessageLocator1.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error_message' }))
      ]);

      if (result1.type === 'error_message') {
        console.error(`Mensaje de error en la web: "Error al descargar el archivo" para ${manuscrito1}.`);
        throw new Error('Error al descargar el archivo desde la web.');
      }

      const download1 = result1.data; // Esto será el objeto de descarga si el tipo es 'download'

      await download1.saveAs(pdfPath1);
      console.log(`PDF del manuscrito 1 guardado en: ${pdfPath1}`);

      const fileIsReady1 = await waitForFileReady(pdfPath1);
      if (!fileIsReady1) {
        throw new Error('El archivo PDF del manuscrito 1 no estuvo listo para ser leído a tiempo.');
      }

      const dataBuffer1 = fs.readFileSync(pdfPath1);
      const pdfData1 = await pdf(dataBuffer1);
      const match1 = pdfData1.text.match(/Cˆ‡digo(?: de acceso)?:\s*(\S+)/i); // Regex corregida
      if (match1) {
        codigoAcceso = match1[1];
        console.log(`Código extraído del manuscrito 1: ${codigoAcceso}`);
        break; // Salir del bucle de reintento si tiene éxito
      } else {
        console.error('No se encontró ningún código en el PDF del manuscrito 1.');
        throw new Error('Código no encontrado en el PDF.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error al procesar ${manuscrito1} (Intento ${retry1 + 1}):`, error.message);
        if (error.message.includes('bad XRef entry') || error.message.includes('Código no encontrado') || error.message.includes('El archivo PDF no estuvo listo') || error.message.includes('Error al descargar el archivo')) {
          if (retry1 < MAX_ACTION_RETRIES - 1) {
            console.log('Reintentando acción para este manuscrito...');
            if (fs.existsSync(pdfPath1)) {
              fs.unlinkSync(pdfPath1); // Eliminar archivo corrupto
            }
            await delay(2000); // Pausa antes de reintentar
            continue;
          }
        }
      } else {
        console.error(`Ocurrió un error desconocido al procesar ${manuscrito1}:`, error);
      }
      codigoAcceso = null; // Asegurarse de que el código sea null si falla
      break; // Salir del bucle de reintento si se agotaron o el error es fatal
    }
  }
  await delay(1000); // Pausa después de analizar el primer PDF

  // --- SEGUNDO MANUSCRITO: Libro de Kells (Siglo XV) ---
  if (codigoAcceso) {
    const manuscrito2 = 'Libro de Kells'; // CORREGIDO: Siglo XV
    const pdfPath2 = `./${manuscrito2.replace(/ /g, '_')}.pdf`;

    for (let retry2 = 0; retry2 < MAX_ACTION_RETRIES; retry2++) {
      try {
        console.log(`\n--- Procesando ${manuscrito2} (Intento: ${retry2 + 1}/${MAX_ACTION_RETRIES}) ---`);
        const cardLocator2 = page.locator(`.bg-sherpa-surface\\/10:has-text("${manuscrito2}")`).first();
        await cardLocator2.scrollIntoViewIfNeeded();
        await delay(1000);

        const inputLocator2 = cardLocator2.locator('input[type="text"]');
        const unlockButtonLocator2 = cardLocator2.locator('button:has-text("Desbloquear")');

        await inputLocator2.fill(codigoAcceso);
        console.log(`Código ${codigoAcceso} ingresado para el manuscrito 2.`);
        await delay(1000);

        await unlockButtonLocator2.click();
        console.log('Botón "Desbloquear" clickeado para el manuscrito 2.');
        await delay(1000);
        await page.waitForLoadState('networkidle');
        await delay(1000);

        const incorrectCodeMessage2 = page.locator('text="Código incorrecto"').first();
        const isCodeIncorrect2 = await incorrectCodeMessage2.isVisible();
        if (isCodeIncorrect2) {
          console.error(`Error: El código ${codigoAcceso} es incorrecto para el manuscrito ${manuscrito2}.`);
          codigoAcceso = null;
          break; // No reintentar con código incorrecto
        }

        const downloadButtonLocator2 = cardLocator2.locator('button:has-text("Descargar PDF")');
        await downloadButtonLocator2.waitFor({ state: 'visible' });
        await delay(1000);

        console.log(`Descargando PDF del manuscrito: ${manuscrito2}`);
        const downloadPromise2 = page.waitForEvent('download');
        const errorDownloadMessageLocator2 = page.locator('p.text-sm.text-red-400:has-text("Error al descargar el archivo")').first();

        await downloadButtonLocator2.click();
        await delay(1000);

        const result2 = await Promise.race([
          downloadPromise2.then((d: typeof Download) => ({ type: 'download', data: d })), // Tipo corregido aquí
          errorDownloadMessageLocator2.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error_message' }))
        ]);

        if (result2.type === 'error_message') {
          console.error(`Mensaje de error en la web: "Error al descargar el archivo" para ${manuscrito2}.`);
          throw new Error('Error al descargar el archivo desde la web.');
        }

        const download2 = result2.data;

        await download2.saveAs(pdfPath2);
        console.log(`PDF del manuscrito 2 guardado en: ${pdfPath2}`);

        const fileIsReady2 = await waitForFileReady(pdfPath2);
        if (!fileIsReady2) {
          throw new Error('El archivo PDF del manuscrito 2 no estuvo listo para ser leído a tiempo.');
        }

        const dataBuffer2 = fs.readFileSync(pdfPath2);
        const pdfData2 = await pdf(dataBuffer2);
        const match2 = pdfData2.text.match(/Cˆ‡digo(?: de acceso)?:\s*(\S+)/i); // Regex corregida
        if (match2) {
          codigoAcceso = match2[1];
          console.log(`Código extraído del manuscrito 2: ${codigoAcceso}`);
          break;
        } else {
          console.error('No se encontró ningún código en el PDF del manuscrito 2.');
          throw new Error('Código no encontrado en el PDF.');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Error al procesar ${manuscrito2} (Intento ${retry2 + 1}):`, error.message);
          if (error.message.includes('bad XRef entry') || error.message.includes('Código no encontrado') || error.message.includes('El archivo PDF no estuvo listo') || error.message.includes('Error al descargar el archivo')) {
            if (retry2 < MAX_ACTION_RETRIES - 1) {
              console.log('Reintentando acción para este manuscrito...');
              if (fs.existsSync(pdfPath2)) {
                fs.unlinkSync(pdfPath2);
              }
              await delay(2000);
              continue;
            }
          }
        } else {
          console.error(`Ocurrió un error desconocido al procesar ${manuscrito2}:`, error);
        }
        codigoAcceso = null;
        break;
      }
    }
  } else {
    console.warn('No se pudo procesar el segundo manuscrito porque no se obtuvo un código válido del primero.');
  }
  await delay(1000);

  // --- TERCER MANUSCRITO: Codex Seraphinianus (Siglo XVI) ---
  if (codigoAcceso) {
    const manuscrito3 = 'Codex Seraphinianus'; // CORREGIDO: Siglo XVI
    const pdfPath3 = `./${manuscrito3.replace(/ /g, '_')}.pdf`;

    for (let retry3 = 0; retry3 < MAX_ACTION_RETRIES; retry3++) {
      try {
        console.log(`\n--- Procesando ${manuscrito3} (Intento: ${retry3 + 1}/${MAX_ACTION_RETRIES}) ---`);
        const cardLocator3 = page.locator(`.bg-sherpa-surface\\/10:has-text("${manuscrito3}")`).first();
        await cardLocator3.scrollIntoViewIfNeeded();
        await delay(1000);

        const inputLocator3 = cardLocator3.locator('input[type="text"]');
        const unlockButtonLocator3 = cardLocator3.locator('button:has-text("Desbloquear")');

        await inputLocator3.fill(codigoAcceso);
        console.log(`Código ${codigoAcceso} ingresado para el manuscrito 3.`);
        await delay(1000);

        await unlockButtonLocator3.click();
        console.log('Botón "Desbloquear" clickeado para el manuscrito 3.');
        await delay(1000);
        await page.waitForLoadState('networkidle');
        await delay(1000);

        const incorrectCodeMessage3 = page.locator('text="Código incorrecto"').first();
        const isCodeIncorrect3 = await incorrectCodeMessage3.isVisible();
        if (isCodeIncorrect3) {
          console.error(`Error: El código ${codigoAcceso} es incorrecto para el manuscrito ${manuscrito3}.`);
          codigoAcceso = null;
          break; // No reintentar con código incorrecto
        }

        const downloadButtonLocator3 = cardLocator3.locator('button:has-text("Descargar PDF")');
        await downloadButtonLocator3.waitFor({ state: 'visible' });
        await delay(1000);

        console.log(`Descargando PDF del manuscrito: ${manuscrito3}`);
        const downloadPromise3 = page.waitForEvent('download');
        const errorDownloadMessageLocator3 = page.locator('p.text-sm.text-red-400:has-text("Error al descargar el archivo")').first();

        await downloadButtonLocator3.click();
        await delay(1000);

        const result3 = await Promise.race([
          downloadPromise3.then((d: typeof Download) => ({ type: 'download', data: d })), // Tipo corregido aquí
          errorDownloadMessageLocator3.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error_message' }))
        ]);

        if (result3.type === 'error_message') {
          console.error(`Mensaje de error en la web: "Error al descargar el archivo" para ${manuscrito3}.`);
          throw new Error('Error al descargar el archivo desde la web.');
        }

        const download3 = result3.data;

        await download3.saveAs(pdfPath3);
        console.log(`PDF del manuscrito 3 guardado en: ${pdfPath3}`);

        const fileIsReady3 = await waitForFileReady(pdfPath3);
        if (!fileIsReady3) {
          throw new Error('El archivo PDF del manuscrito 3 no estuvo listo para ser leído a tiempo.');
        }

        const dataBuffer3 = fs.readFileSync(pdfPath3);
        const pdfData3 = await pdf(dataBuffer3);
        const match3 = pdfData3.text.match(/Cˆ‡digo(?: de acceso)?:\s*(\S+)/i); // Regex corregida
        if (match3) {
          codigoAcceso = match3[1];
          console.log(`Código extraído del manuscrito 3: ${codigoAcceso}`);
          break;
        } else {
          console.error('No se encontró ningún código en el PDF del manuscrito 3.');
          throw new Error('Código no encontrado en el PDF.');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Error al procesar ${manuscrito3} (Intento ${retry3 + 1}):`, error.message);
          if (error.message.includes('bad XRef entry') || error.message.includes('Código no encontrado') || error.message.includes('El archivo PDF no estuvo listo') || error.message.includes('Error al descargar el archivo')) {
            if (retry3 < MAX_ACTION_RETRIES - 1) {
              console.log('Reintentando acción para este manuscrito...');
              if (fs.existsSync(pdfPath3)) {
                fs.unlinkSync(pdfPath3);
              }
              await delay(2000);
              continue;
            }
          }
        } else {
          console.error(`Ocurrió un error desconocido al procesar ${manuscrito3}:`, error);
        }
        codigoAcceso = null;
        break;
      }
    }
  } else {
    console.warn('No se pudo procesar el tercer manuscrito porque no se obtuvo un código válido del anterior.');
  }
  await delay(1000);

  console.log('\nProceso de manuscritos completado.');
  // --- NAVEGAR A LA PÁGINA 2 ---
  console.log('\n--- Navegando a la página 2 ---');
  const page2Button = page.locator('button.w-8.h-8.text-sm.rounded-md.transition-all.flex.items-center.justify-center:has-text("2")').first();
  await page2Button.click();
  await delay(1000); // Pausa después de hacer clic en la página 2
  await page.waitForLoadState('networkidle');
  await delay(1000); // Pausa después de esperar la carga de la red en la página 2

  console.log('\nProceso de manuscritos completado y navegado a la página 2.');
  await browser.close();
})();
