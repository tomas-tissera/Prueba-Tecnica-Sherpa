
// --- NAVEGAR A LA PÁGINA 2 ---
console.log('\n--- Navegando a la página 2 ---');
const page2Button = page.locator('button.w-8.h-8.text-sm.rounded-md.transition-all.flex.items-center.justify-center:has-text("2")').first();
await page2Button.click();
await delay(1000); // Pausa después de hacer clic en la página 2
await page.waitForLoadState('networkidle');
await delay(1000); // Pausa después de esperar la carga de la red en la página 2

// --- CUARTO MANUSCRITO: Desafío del Necronomicon (Siglo XVII) ---
let necronomiconCode: string | null = null;
const necronomiconTitle = 'Necronomicon'; // Título del manuscrito
const necronomiconPdfPath = `./${necronomiconTitle.replace(/ /g, '_')}.pdf`;

// Parte 1: Hacer clic en "Ver Documentación" para el Necronomicon, extraer y cerrar modal
for (let retryNecroDoc = 0; retryNecroDoc < MAX_ACTION_RETRIES; retryNecroDoc++) {
  try {
    console.log(`\n--- Procesando ${necronomiconTitle} (Siglo XVII - Documentación - Intento: ${retryNecroDoc + 1}/${MAX_ACTION_RETRIES}) ---`);
    const necronomiconCardLocator = page.locator(`.bg-sherpa-surface\\/10:has-text("${necronomiconTitle}")`).first();
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
      if (retryNecroDoc < MAX_ACTION_RETRIES - 1) {
        console.log('Reintentando acción para "Ver Documentación" del Necronomicon...');
        await delay(2000);
        continue;
      }
    } else {
      console.error(`Ocurrió un error desconocido al procesar "Ver Documentación" del Necronomicon:`, error);
    }
    break; // Salir del bucle de reintento si se agotaron o el error es fatal
  }
}

// Parte 2: Procesar el desafío principal del Necronomicon (después de ver la documentación)
for (let retryNecroChallenge = 0; retryNecroChallenge < MAX_ACTION_RETRIES; retryNecroChallenge++) {
  try {
    console.log(`\n--- Procesando ${necronomiconTitle} (Siglo XVII - Desafío - Intento: ${retryNecroChallenge + 1}/${MAX_ACTION_RETRIES}) ---`);
    const necronomiconCardLocator = page.locator(`.bg-sherpa-surface\\/10:has-text("${necronomiconTitle}")`).first();
    await necronomiconCardLocator.scrollIntoViewIfNeeded();
    await delay(1000);

    // Hacer clic en "Ver Documento" para abrir el modal del desafío
    const viewDocumentButton = necronomiconCardLocator.locator('button:has-text("Ver Documento")').first();
    await viewDocumentButton.click();
    await delay(1000); // Pausa después de abrir el modal

    // Esperar a que el modal de desafío sea visible
    const modalLocator = page.locator('div[role="dialog"]').first();
    await modalLocator.waitFor({ state: 'visible' });
    await delay(1000);

    // Extraer y mostrar el "MENSAJE CIFRADO DEL CUSTODIO"
    const mensajeCifradoLocator = modalLocator.locator('p:has-text("MENSAJE CIFRADO DEL CUSTODIO") + p').first();
    const mensajeCifrado = await mensajeCifradoLocator.innerText();
    console.log('\n--- MENSAJE CIFRADO DEL CUSTODIO ---');
    console.log(mensajeCifrado);
    await delay(1000);

    // Extraer y mostrar "Información de la API"
    const apiInfoLocator = modalLocator.locator('h3:has-text("Información de la API") + div').first();
    const apiInfo = await apiInfoLocator.innerText();
    console.log('\n--- Información de la API ---');
    console.log(apiInfo);
    await delay(1000);

    // Extraer y mostrar "Instrucciones del Ritual"
    const ritualInstructionsLocator = modalLocator.locator('h3:has-text("Instrucciones del Ritual") + ol').first();
    const ritualInstructions = await ritualInstructionsLocator.innerText();
    console.log('\n--- Instrucciones del Ritual ---');
    console.log(ritualInstructions);
    await delay(1000);

    // Extraer información de la API del modal para el desafío
    const apiInfoText = await modalLocator.locator('div.p-4.rounded-md.bg-sherpa-surface\\/5').innerText();
    
    const endpointMatch = apiInfoText.match(/Endpoint:\s*(https:\/\/[^\s]+)/);
    const bookTitleMatch = apiInfoText.match(/bookTitle:\s*\[([^\]]+)\]/);
    const unlockCodeParamMatch = apiInfoText.match(/unlockCode:\s*\[([^\]]+)\]/);

    if (!endpointMatch || !bookTitleMatch || !unlockCodeParamMatch) {
      throw new Error('No se pudo extraer la información de la API del modal.');
    }

    const apiEndpoint = endpointMatch[1];
    const apiBookTitle = bookTitleMatch[1]; // "Nombre del libro a desbloquear"
    // El unlockCode para la API es el código del manuscrito anterior (Codex Seraphinianus)
    const apiUnlockCode = codigoAcceso; 

    if (!apiUnlockCode) {
      throw new Error('No se obtuvo el código de desbloqueo del manuscrito anterior para la API del Necronomicon.');
    }

    console.log(`Información de API extraída para el desafío: Endpoint=${apiEndpoint}, bookTitle=${apiBookTitle}, unlockCode=${apiUnlockCode}`);
    await delay(1000);

    // --- Resolver el Desafío de Búsqueda Binaria ---
    let password = null;
    let min = 0; // Asumimos un rango inicial, la API debería confirmarlo
    let max = 1000000; // Asumimos un rango inicial grande

    // Primera llamada para obtener el rango inicial del desafío (si la API lo proporciona)
    // O para iniciar la búsqueda si el rango es fijo y la API da feedback
    let challengeUrl = new URL(apiEndpoint);
    challengeUrl.searchParams.append('bookTitle', apiBookTitle);
    challengeUrl.searchParams.append('unlockCode', apiUnlockCode);

    console.log(`Realizando llamada inicial a la API de desafío: ${challengeUrl.toString()}`);
    const initialResponse = await fetch(challengeUrl.toString());
    const initialData = await initialResponse.json();

    if (initialData.min !== undefined && initialData.max !== undefined) {
        min = initialData.min;
        max = initialData.max;
        console.log(`Rango de desafío obtenido: min=${min}, max=${max}`);
    } else {
        console.warn('La API no proporcionó un rango min/max explícito. Usando rango por defecto.');
    }
    await delay(1000);

    // Búsqueda binaria
    while (min <= max) {
      const guess = Math.floor((min + max) / 2);
      let guessUrl = new URL(apiEndpoint);
      guessUrl.searchParams.append('bookTitle', apiBookTitle);
      guessUrl.searchParams.append('unlockCode', apiUnlockCode);
      guessUrl.searchParams.append('guess', guess.toString());

      console.log(`Intentando adivinar: ${guess} (Rango: ${min}-${max})`);
      const guessResponse = await fetch(guessUrl.toString());
      const guessData = await guessResponse.json();
      await delay(500); // Pequeña pausa entre cada intento de adivinanza

      if (guessData.result === 'correct') {
        password = guessData.password;
        console.log(`Desafío resuelto. Contraseña: ${password}`);
        break;
      } else if (guessData.result === 'too_high') {
        max = guess - 1;
      } else if (guessData.result === 'too_low') {
        min = guess + 1;
      } else {
        throw new Error(`Respuesta inesperada de la API de desafío: ${JSON.stringify(guessData)}`);
      }
    }

    if (!password) {
      throw new Error('No se pudo resolver el desafío de búsqueda binaria o no se obtuvo la contraseña.');
    }
    await delay(1000);

    // Cerrar el modal antes de interactuar con la página principal
    const closeButton = modalLocator.locator('button[aria-label="Cerrar modal"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await delay(1000);
      await modalLocator.waitFor({ state: 'hidden' });
      await delay(1000);
    } else {
      console.warn('No se encontró el botón de cerrar modal. Continuando...');
    }
    
    // Llenar el campo de entrada del Necronomicon con la contraseña
    const necronomiconInputLocator = necronomiconCardLocator.locator('input[type="text"]');
    const necronomiconUnlockButtonLocator = necronomiconCardLocator.locator('button:has-text("Desbloquear")');

    await necronomiconInputLocator.fill(password);
    console.log(`Contraseña ${password} ingresada para el Necronomicon.`);
    await delay(1000);

    await necronomiconUnlockButtonLocator.click();
    console.log('Botón "Desbloquear" clickeado para el Necronomicon.');
    await delay(1000);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    const incorrectCodeMessageNecro = page.locator('text="Código incorrecto"').first();
    const isCodeIncorrectNecro = await incorrectCodeMessageNecro.isVisible();
    if (isCodeIncorrectNecro) {
      console.error(`Error: La contraseña ${password} es incorrecta para el Necronomicon.`);
      throw new Error('Contraseña incorrecta para el Necronomicon.');
    }

    // Descargar el PDF del Necronomicon
    const downloadButtonLocatorNecro = necronomiconCardLocator.locator('button:has-text("Descargar PDF")');
    await downloadButtonLocatorNecro.waitFor({ state: 'visible' });
    await delay(1000);

    console.log(`Descargando PDF del manuscrito: ${necronomiconTitle}`);
    const downloadPromiseNecro = page.waitForEvent('download');
    const errorDownloadMessageLocatorNecro = page.locator('p.text-sm.text-red-400:has-text("Error al descargar el archivo")').first();

    await downloadButtonLocatorNecro.click();
    await delay(1000);

    const resultNecro = await Promise.race([
      downloadPromiseNecro.then((d: typeof Download) => ({ type: 'download', data: d })),
      errorDownloadMessageLocatorNecro.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error_message' }))
    ]);

    if (resultNecro.type === 'error_message') {
      console.error(`Mensaje de error en la web: "Error al descargar el archivo" para ${necronomiconTitle}.`);
      throw new Error('Error al descargar el archivo desde la web.');
    }

    const downloadNecro = resultNecro.data;

    await downloadNecro.saveAs(necronomiconPdfPath);
    console.log(`PDF del Necronomicon guardado en: ${necronomiconPdfPath}`);

    const fileIsReadyNecro = await waitForFileReady(necronomiconPdfPath);
    if (!fileIsReadyNecro) {
      throw new Error('El archivo PDF del Necronomicon no estuvo listo para ser leído a tiempo.');
    }

    const dataBufferNecro = fs.readFileSync(necronomiconPdfPath);
    const pdfDataNecro = await pdf(dataBufferNecro);
    const matchNecro = pdfDataNecro.text.match(/Código(?: de acceso)?:\s*(\S+)/i);
    if (matchNecro) {
      necronomiconCode = matchNecro[1];
      console.log(`Código extraído del Necronomicon: ${necronomiconCode}`);
    } else {
      console.error('No se encontró ningún código en el PDF del Necronomicon.');
      throw new Error('Código no encontrado en el PDF del Necronomicon.');
    }
    break; // Salir del bucle de reintento si tiene éxito
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error al procesar ${necronomiconTitle} (Intento ${retryNecroChallenge + 1}):`, error.message);
      if (retryNecroChallenge < MAX_ACTION_RETRIES - 1) {
        console.log('Reintentando acción para este manuscrito...');
        if (fs.existsSync(necronomiconPdfPath)) {
          fs.unlinkSync(necronomiconPdfPath);
        }
        await delay(3000); // Pausa más larga para reintentos de Necronomicon
        continue;
      }
    } else {
      console.error(`Ocurrió un error desconocido al procesar ${necronomiconTitle}:`, error);
    }
    necronomiconCode = null;
    break;
  }
}

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
      console.log(codigoAcceso);
      console.log(codigoAcceso);
      console.log(codigoAcceso);
      console.log(codigoAcceso);
      console.log(codigoAcceso);
      
    } else {
      console.warn('No se encontró el botón de cerrar el modal de documentación del Siglo XVIII. Continuando...');
    }
    break; // Salir del bucle de reintento si tiene éxito
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error al procesar "Ver Documentación" del Siglo XVIII (Intento ${retry18 + 1}):`, error.message);
      if (retry18 < MAX_ACTION_RETRIES - 1) {
        console.log('Reintentando acción para "Ver Documentación" del Siglo XVIII...');
        await delay(2000);
        continue;
      }
    } else {
      console.error(`Ocurrió un error desconocido al procesar "Ver Documentación" del Siglo XVIII:`, error);
    }
    break; // Salir del bucle de reintento si se agotaron o el error es fatal
  }
}


console.log('\nProceso de manuscritos completado y navegado a la página 2.');