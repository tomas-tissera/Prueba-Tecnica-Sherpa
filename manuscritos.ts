import { chromium, Page, Download } from 'playwright';
import * as fs from 'fs-extra';
import * as pdfParse from 'pdf-parse';

async function extraerCodigo(pdfPath: string): Promise<string | null> {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);
    const match = data.text.match(/Código de acceso:\s*(\S+)/);
    return match ? match[1] : null;
}

async function descargarYExtraerCodigo(page: Page, botonSelector: string, outputPath: string): Promise<string | null> {
    const downloadPromise = page.waitForEvent('download');
    await page.click(botonSelector);
    const download = await downloadPromise;

    await download.saveAs(outputPath);
    console.log(`PDF descargado en: ${outputPath}`);
    return await extraerCodigo(outputPath);
}

async function desbloquearManuscrito(page: Page, cardSelector: string, codigo: string) {
    await page.fill(`${cardSelector} input[type="password"]`, codigo);
    await page.click(`${cardSelector} button:has-text("Desbloquear")`);
    await page.waitForTimeout(1000); // esperar a que se desbloquee
}

async function procesarPagina(page: Page, sigloInicial: number, rutaDescargas: string) {
    const cards = await page.$$('div:has-text("Siglo")');

    let codigoActual: string | null = null;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const texto = await card.textContent() || "";

        if (texto.includes("Descargar PDF")) {
            const botonDescarga = await card.$('button:has-text("Descargar PDF")');
            if (!botonDescarga) continue;

            const outputPath = `${rutaDescargas}/manuscrito_${sigloInicial + i}.pdf`;
            codigoActual = await descargarYExtraerCodigo(page, await botonDescarga.evaluate(el => el.getAttribute('selector') || ''), outputPath);
            console.log(`[Siglo ${sigloInicial + i}] Código extraído: ${codigoActual}`);

        } else if (texto.includes("Desbloquear")) {
            if (!codigoActual) throw new Error("No hay código disponible para desbloquear.");

            const cardSelector = (await card.evaluate(el => el.getAttribute('selector') || ''));
            await desbloquearManuscrito(page, cardSelector, codigoActual);

            const botonDescarga = await card.$('button:has-text("Descargar PDF")');
            if (!botonDescarga) continue;

            const outputPath = `${rutaDescargas}/manuscrito_${sigloInicial + i}.pdf`;
            codigoActual = await descargarYExtraerCodigo(page, await botonDescarga.evaluate(el => el.getAttribute('selector') || ''), outputPath);
            console.log(`[Siglo ${sigloInicial + i}] Código extraído: ${codigoActual}`);
        }
    }
}

(async () => {
    const rutaDescargas = './descargas';
    await fs.ensureDir(rutaDescargas);

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    await page.goto('https://tu-url-del-sitio.com/manuscritos-sagrados');

    // Primera página (siglos XIV, XV, XVI)
    await procesarPagina(page, 14, rutaDescargas);

    // Ir a la segunda página si existe
    const botonPagina2 = await page.$('button:has-text("2")');
    if (botonPagina2) {
        await botonPagina2.click();
        await page.waitForTimeout(1000);
        await procesarPagina(page, 17, rutaDescargas);
    }

    console.log('✅ Proceso completado');
    await browser.close();
})();
