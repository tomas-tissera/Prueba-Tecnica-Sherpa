const { firefox, Page, Download } = require('playwright');
const fs = require('fs');
const pdf = require('pdf-parse');
const axios = require('axios'); // Importación de axios usando CommonJS

const claves: (string | null)[] = []; // Array para almacenar las claves, ahora puede contener null

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

// La función de búsqueda binaria (no necesita ser exportada si solo se usa aquí).
const binarySearch = (vault: string[], target: number): string | null => {
    let low = 0;
    let high = vault.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const guess = vault[mid];

        if (mid === target) {
            return guess;
        }

        if (mid < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return null;
};

// Función para encontrar la contraseña final (ya no es exportada, es interna del archivo)
const findFinalPassword = async (bookTitle: string, claves: string[]): Promise<string | null> => {
    // Asegurarse de que haya al menos una clave antes de intentar acceder al último elemento
    if (claves.length === 0) {
        console.error("No hay claves disponibles para el desafío final.");
        return null;
    }

    const unlockCode: string = claves[claves.length - 1]; // Usar la última clave obtenida
    const endpoint: string = 'https://backend-production-9d875.up.railway.app/api/cipher/challenge';

    try {
        const response = await axios.get(endpoint, {
            params: {
                bookTitle: bookTitle,
                unlockCode: unlockCode
            }
        });

        const { vault, targets } = response.data.challenge;

        let finalPassword = '';
        for (const target of targets) {
            const char = binarySearch(vault, target);
            if (char) {
                finalPassword += char;
            } else {
                console.warn(`No se encontró el carácter para el objetivo ${target} en el vault.`);
                // Decide si quieres romper aquí o continuar con caracteres faltantes
            }
        }
        return finalPassword;

    } catch (error: unknown) { // Explicitly type error as unknown
        if (axios.isAxiosError(error)) {
            // Se asume que 'error' es un AxiosError aquí
            console.error("Error al completar el desafío:");
        } else if (error instanceof Error) { // Narrow to Error type
            console.error("Un error inesperado ocurrió:", error.message);
        } else {
            console.error("Un error inesperado ocurrió:", String(error)); // Convert to string for unknown types
        }
        return null;
    }
};


(async () => {
  const browser = await firefox.launch({ headless: false }); // Cambiado a firefox.launch
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
      console.log(`\n--- Procesando ${manuscrito1} (Siglo XIV - Intento: ${retry1 + 1}/${MAX_ACTION_RETRIES}) ---`);
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
          downloadPromise1.then((d: typeof Download) => ({ type: 'download', data: d })),
          errorDownloadMessageLocator1.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error_message' }))
      ]);

      if (result1.type === 'error_message') {
        console.error(`Mensaje de error en la web: "Error al descargar el archivo" para ${manuscrito1}.`);
        throw new Error('Error al descargar el archivo desde la web.');
      }

      const download1 = result1.data;

      await download1.saveAs(pdfPath1);
      console.log(`PDF del manuscrito 1 guardado en: ${pdfPath1}`);

      const fileIsReady1 = await waitForFileReady(pdfPath1);
      if (!fileIsReady1) {
        throw new Error('El archivo PDF del manuscrito 1 no estuvo listo para ser leído a tiempo.');
      }

      const dataBuffer1 = fs.readFileSync(pdfPath1);
      const pdfData1 = await pdf(dataBuffer1);
      const match1 = pdfData1.text.match(/Cˆ‡digo(?: de acceso)?:\s*(\S+)/i);
      if (match1) {
        codigoAcceso = match1[1];
        console.log(`Código extraído del manuscrito 1: ${codigoAcceso}`);
        claves.push(codigoAcceso); // Almacenar en el array de claves
        break; // Salir del bucle de reintento si tiene éxito
      } else {
        console.error('No se encontró ningún código en el PDF del manuscrito 1.');
        throw new Error('Código no encontrado en el PDF.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error al procesar ${manuscrito1} (Intento ${retry1 + 1}):`, error.message);
        
        if (retry1 < MAX_ACTION_RETRIES - 1) { // Reintentar si no es el último intento
          console.log('Reintentando acción para este manuscrito...');
          if (fs.existsSync(pdfPath1)) {
            fs.unlinkSync(pdfPath1); // Eliminar archivo corrupto
          }
          await delay(2000); // Pausa antes de reintentar
          continue; // Continuar con el siguiente intento
        } else { // Último intento o error no reintentable
          codigoAcceso = null; // Establecer a null ya que el procesamiento falló para este manuscrito
          break; // Salir del bucle
        }
      } else { // Objeto no-Error lanzado
        console.error(`Ocurrió un error desconocido al procesar ${manuscrito1}:`, error);
        codigoAcceso = null; // Establecer a null ya que el procesamiento falló
        break; // Salir del bucle
      }
    }
  }
  await delay(1000); // Pausa después de analizar el primer PDF

  // --- SEGUNDO MANUSCRITO: Libro de Kells (Siglo XV) ---
  if (codigoAcceso) {
    const manuscrito2 = 'Libro de Kells'; // CORREGIDO: Siglo XV
    const pdfPath2 = `./${manuscrito2.replace(/ /g, '_')}.pdf`;

    for (let retry2 = 0; retry2 < MAX_ACTION_RETRIES; retry2++) {
      try {
        console.log(`\n--- Procesando ${manuscrito2} (Siglo XV - Intento: ${retry2 + 1}/${MAX_ACTION_RETRIES}) ---`);
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
          downloadPromise2.then((d: typeof Download) => ({ type: 'download', data: d })),
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
        const match2 = pdfData2.text.match(/Cˆ‡digo(?: de acceso)?:\s*(\S+)/i);
        if (match2) {
          codigoAcceso = match2[1];
          console.log(`Código extraído del manuscrito 2: ${codigoAcceso}`);
          claves.push(codigoAcceso); // Almacenar en el array de claves
          break;
        } else {
          console.error('No se encontró ningún código en el PDF del manuscrito 2.');
          throw new Error('Código no encontrado en el PDF.');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Error al procesar ${manuscrito2} (Intento ${retry2 + 1}):`, error.message);
          
          if (retry2 < MAX_ACTION_RETRIES - 1) {
            console.log('Reintentando acción para este manuscrito...');
            if (fs.existsSync(pdfPath2)) {
              fs.unlinkSync(pdfPath2);
            }
            await delay(2000);
            continue;
          } else {
            codigoAcceso = null;
            break;
          }
        } else {
          console.error(`Ocurrió un error desconocido al procesar ${manuscrito2}:`, error);
          codigoAcceso = null;
          break;
        }
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
        console.log(`\n--- Procesando ${manuscrito3} (Siglo XVI - Intento: ${retry3 + 1}/${MAX_ACTION_RETRIES}) ---`);
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
          downloadPromise3.then((d: typeof Download) => ({ type: 'download', data: d })),
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
        const match3 = pdfData3.text.match(/Cˆ‡digo(?: de acceso)?:\s*(\S+)/i);
        if (match3) {
          codigoAcceso = match3[1];
          console.log(`Código extraído del manuscrito 3: ${codigoAcceso}`);
          claves.push(codigoAcceso); // Almacenar en el array de claves
          break;
        } else {
          console.error('No se encontró ningún código en el PDF del manuscrito 3.');
          throw new Error('Código no encontrado en el PDF.');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Error al procesar ${manuscrito3} (Intento ${retry3 + 1}):`, error.message);
          
          if (retry3 < MAX_ACTION_RETRIES - 1) {
            console.log('Reintentando acción para este manuscrito...');
            if (fs.existsSync(pdfPath3)) {
              fs.unlinkSync(pdfPath3);
            }
            await delay(2000);
            continue;
          } else {
            codigoAcceso = null;
            break;
          }
        } else {
          console.error(`Ocurrió un error desconocido al procesar ${manuscrito3}:`, error);
          codigoAcceso = null;
          break;
        }
      }
    }
  } else {
    console.warn('No se pudo procesar el tercer manuscrito porque no se obtuvo un código válido del anterior.');
  }
  await delay(1000);

  // --- NAVEGAR A LA PÁGINA 2 ---
  console.log('\n--- Navegando a la página 2 ---');
  const page2Button = page.locator('button.w-8.h-8.text-sm.rounded-md.transition-all.flex.items-center.justify-center:has-text("2")').first();
  await page2Button.click();
  await delay(1000); // Pausa después de hacer clic en la página 2
  await page.waitForLoadState('networkidle');
  await delay(1000); // Pausa después de esperar la carga de la red en la página 2

  // --- CUARTO MANUSCRITO: Desafío del Necronomicon (Siglo XVII) ---
  const necronomiconTitle = 'Necronomicon'; // Título del manuscrito
  const necronomiconPdfPath = `./${necronomiconTitle.replace(/ /g, '_')}.pdf`;
  const necronomiconCardLocator = page.locator(`.bg-sherpa-surface\\/10:has-text("${necronomiconTitle}")`).first();

  // Parte 1: Hacer clic en "Ver Documentación" para el Necronomicon, extraer y cerrar modal
  for (let retryNecroDoc = 0; retryNecroDoc < MAX_ACTION_RETRIES; retryNecroDoc++) {
    try {
      console.log(`\n--- Procesando ${necronomiconTitle} (Siglo XVII - Documentación - Intento: ${retryNecroDoc + 1}/${MAX_ACTION_RETRIES}) ---`);
      await necronomiconCardLocator.scrollIntoViewIfNeeded();
      await delay(1000);

      // Hacer clic en "Ver Documentación" para el Necronomicon
      const verDocumentacionNecroButton = necronomiconCardLocator.locator('button:has-text("Ver Documentación")').first();
      await verDocumentacionNecroButton.waitFor({ state: 'visible' });
      await delay(1000);
      await verDocumentacionNecroButton.click();
      await delay(1000); // Pausa después de hacer clic en Ver Documentación

      const docModalLocator = page.locator('div[role="dialog"]').first();
      await docModalLocator.waitFor({ state: 'visible' });
      await delay(1000);

      const docModalContent = await docModalLocator.innerText();
      console.log('\n--- Contenido del modal "Ver Documentación" del Necronomicon ---');
      console.log(docModalContent);
      await delay(1000);

      const closeDocModalButton = docModalLocator.locator('button[aria-label="Cerrar modal"]').first();
      if (await closeDocModalButton.isVisible()) {
        await closeDocModalButton.click();
        await delay(1000);
        await docModalLocator.waitFor({ state: 'hidden' });
        await delay(1000);
      } else {
        console.warn('No se encontró el botón de cerrar el modal de documentación del Necronomicon. Continuando...');
      }
      break; // Salir del bucle de reintento si tiene éxito
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error al hacer clic en "Ver Documentación" del Necronomicon o procesar su modal (Intento ${retryNecroDoc + 1}):`, error.message);
        const isRetryableError = error.message.includes('visible did not resolve') || error.message.includes('state: "hidden" did not resolve') || error.message.includes('No se encontró el botón de cerrar');
        
        if (isRetryableError && retryNecroDoc < MAX_ACTION_RETRIES - 1) {
          console.log('Reintentando acción para "Ver Documentación" del Necronomicon...');
          await delay(2000);
          continue;
        } else {
          break;
        }
      } else {
        console.error(`Ocurrió un error desconocido al procesar "Ver Documentación" del Necronomicon:`, error);
        break;
      }
    }
  }

  // --- DESAFÍO FINAL: Obtener la contraseña final y desbloquear el Necronomicon ---
  console.log('\n--- Resolviendo el Desafío Final ---');
  let finalPassword: string | null = null;
  try {
    // Se llama a findFinalPassword con el título del libro y las claves recolectadas
    // Filtramos las claves para asegurarnos de que no haya valores null antes de pasarlas
    const filteredClaves = claves.filter((clave): clave is string => clave !== null);
    finalPassword = await findFinalPassword(necronomiconTitle, filteredClaves); 
    console.log(`Contraseña final obtenida: ${finalPassword}`);

    // --- INGRESAR Y DESBLOQUEAR EL NECRONOMICON CON LA CONTRASEÑA FINAL ---
    if (finalPassword) {
      console.log(`\n--- Desbloqueando ${necronomiconTitle} con la contraseña final ---`);
      await necronomiconCardLocator.scrollIntoViewIfNeeded(); // Asegurarse de que esté visible
      await delay(1000);

      const inputLocatorNecroFinal = necronomiconCardLocator.locator('input[type="text"]');
      const unlockButtonLocatorNecroFinal = necronomiconCardLocator.locator('button:has-text("Desbloquear")');

      await inputLocatorNecroFinal.fill(finalPassword);
      console.log(`Contraseña final "${finalPassword}" ingresada para el Necronomicon.`);
      await delay(1000);

      await unlockButtonLocatorNecroFinal.click();
      console.log('Botón "Desbloquear" clickeado para el Necronomicon con contraseña final.');
      await delay(1000);
      await page.waitForLoadState('networkidle');
      await delay(1000);

      const incorrectCodeMessageNecroFinal = page.locator('text="Código incorrecto"').first();
      const isCodeIncorrectNecroFinal = await incorrectCodeMessageNecroFinal.isVisible();
      if (isCodeIncorrectNecroFinal) {
        console.error(`Error: La contraseña final "${finalPassword}" es incorrecta para el Necronomicon.`);
        throw new Error('Contraseña final incorrecta para el Necronomicon.');
      }
      console.log(`Manuscrito ${necronomiconTitle} desbloqueado exitosamente con la contraseña final.`);
      

      // CERRAR EL MODAL
      const closeButtonModalNecro = page.locator('button[aria-label="Cerrar modal"]').first();
      if (await closeButtonModalNecro.isVisible()) {
        await closeButtonModalNecro.click();
        console.log('Modal del Necronomicon cerrado.');
        await delay(1000);
        await closeButtonModalNecro.waitFor({ state: 'hidden' });
        await delay(1000);
      } else {
        console.warn('No se encontró el botón de cerrar el modal del Necronomicon. Continuando...');
      }


      // Opcional: Descargar el PDF después de un desbloqueo exitoso
      const downloadButtonLocatorNecro = necronomiconCardLocator.locator('button:has-text("Descargar PDF")');
      await downloadButtonLocatorNecro.waitFor({ state: 'visible' });
      await delay(1000);

      console.log(`Descargando PDF del manuscrito: ${necronomiconTitle} (después del desafío final)`);
      const downloadPromiseNecro = page.waitForEvent('download');
      const errorDownloadMessageLocatorNecro = page.locator('p.text-sm.text-red-400:has-text("Error al descargar el archivo")').first();

      await downloadButtonLocatorNecro.click();
      await delay(1000);

      const resultNecro = await Promise.race([
        downloadPromiseNecro.then((d: typeof Download) => ({ type: 'download', data: d })),
        errorDownloadMessageLocatorNecro.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error_message' }))
      ]);

      if (resultNecro.type === 'error_message') {
        console.error(`Mensaje de error en la web: "Error al descargar el archivo" para ${necronomiconTitle} (después del desafío final).`);
        throw new Error('Error al descargar el archivo desde la web (después del desafío final).');
      }

      const downloadNecro = resultNecro.data;

      await downloadNecro.saveAs(necronomiconPdfPath);
      console.log(`PDF del Necronomicon guardado en: ${necronomiconPdfPath} (después del desafío final)`);

      const fileIsReadyNecro = await waitForFileReady(necronomiconPdfPath);
      if (!fileIsReadyNecro) {
        throw new Error('El archivo PDF del Necronomicon no estuvo listo para ser leído a tiempo (después del desafío final).');
      }

      const dataBufferNecro = fs.readFileSync(necronomiconPdfPath);
      const pdfDataNecro = await pdf(dataBufferNecro);
      const matchNecro = pdfDataNecro.text.match(/Cˆ‡digo(?: de acceso)?:\s*(\S+)/i);
      if (matchNecro) {
        // Almacenar el código del Necronomicon si es necesario para futuros pasos
        // necronomiconCode = matchNecro[1]; // Ya está declarado arriba
        // claves.push(necronomiconCode); // Si se necesita para otros desafíos
        console.log(`Código extraído del Necronomicon: ${matchNecro[1]} (después del desafío final)`);
      } else {
        console.error('No se encontró ningún código en el PDF del Necronomicon (después del desafío final).');
        throw new Error('Código no encontrado en el PDF del Necronomicon (después del desafío final).');
      }

    } else {
      console.warn('No se pudo desbloquear el Necronomicon porque no se obtuvo una contraseña final válida.');
    }

  } catch (error: unknown) { // Explicitly type error as unknown
    if (error instanceof Error) {
      console.error('Error al resolver el desafío final o desbloquear el Necronomicon:', error.message);
    } else {
      console.error('Ocurrió un error desconocido al resolver el desafío final o desbloquear el Necronomicon:', String(error));
    }
  }
  // Fin de la sección del desafío final y desbloqueo del Necronomicon
  
  // --- QUINTO MANUSCRITO: Ver Documentación del Siglo XVIII ---
  const siglo18Title = 'Manuscrito del Siglo XVIII'; // Asumiendo un título para el manuscrito del Siglo XVIII
  
  for (let retry18 = 0; retry18 < MAX_ACTION_RETRIES; retry18++) {
    try {
      console.log(`\n--- Procesando ${siglo18Title} (Siglo XVIII - Intento: ${retry18 + 1}/${MAX_ACTION_RETRIES}) ---`);
      // Localizar la tarjeta del manuscrito del Siglo XVIII.
      // Ajusta este selector si el texto exacto del manuscrito del Siglo XVIII es diferente.
      const siglo18CardLocator = page.locator(`.bg-sherpa-surface\\/10:has-text("Siglo XVIII")`).first();
      await siglo18CardLocator.scrollIntoViewIfNeeded();
      await delay(1000);

      // Hacer clic en "Ver Documentación" para el manuscrito del Siglo XVIII
      const verDocumentacion18Button = siglo18CardLocator.locator('button:has-text("Ver Documentación")').first();
      await verDocumentacion18Button.waitFor({ state: 'visible' });
      await delay(1000);
      await verDocumentacion18Button.click();
      await delay(1000); // Pausa después de hacer clic en Ver Documentación

      const docModal18Locator = page.locator('div[role="dialog"]').first();
      await docModal18Locator.waitFor({ state: 'visible' });
      await delay(1000);

      const docModal18Content = await docModal18Locator.innerText();
      console.log('\n--- Contenido del modal "Ver Documentación" del Siglo XVIII ---');
      console.log(docModal18Content);
      await delay(1000);

      const closeDocModal18Button = docModal18Locator.locator('button[aria-label="Cerrar modal"]').first();
      if (await closeDocModal18Button.isVisible()) {
        await closeDocModal18Button.click();
        await delay(1000);
        await docModal18Locator.waitFor({ state: 'hidden' });
        await delay(1000);
      } else {
        console.warn('No se encontró el botón de cerrar el modal de documentación del Siglo XVIII. Continuando...');
      }
      break; // Salir del bucle de reintento si tiene éxito
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error al procesar "Ver Documentación" del Siglo XVIII (Intento ${retry18 + 1}):`, error.message);
        const isRetryableError = error.message.includes('visible did not resolve') || error.message.includes('state: "hidden" did not resolve') || error.message.includes('No se encontró el botón de cerrar');
        
        if (isRetryableError && retry18 < MAX_ACTION_RETRIES - 1) {
          console.log('Reintentando acción para "Ver Documentación" del Siglo XVIII...');
          await delay(2000);
          continue;
        } else {
          break;
        }
      } else {
        console.error(`Ocurrió un error desconocido al procesar "Ver Documentación" del Siglo XVIII:`, error);
        break;
      }
    }
  }


  console.log('\nProceso de manuscritos completado y navegado a la página 2.');
  await browser.close();
})();
