import puppeteer, { type Browser } from 'puppeteer';

export interface RenderPdfOptions {
  html: string;
  /** PDF page width, e.g. '8.5in' or '1440px' */
  width?: string;
  /** PDF page height, e.g. '11in' or '810px' */
  height?: string;
  /** Use landscape orientation */
  landscape?: boolean;
  /** Print background colors/images */
  printBackground?: boolean;
}

/**
 * Detect the Chromium executable path.
 * In Docker the env var PUPPETEER_EXECUTABLE_PATH or /usr/bin/chromium is used.
 * Locally, puppeteer's bundled browser is used (returns undefined to let puppeteer find it).
 */
function getExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  // Common Docker / Linux path
  try {
    // We check existence at runtime; if it doesn't exist puppeteer uses its own bundled browser
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    if (fs.existsSync('/usr/bin/chromium')) {
      return '/usr/bin/chromium';
    }
    if (fs.existsSync('/usr/bin/chromium-browser')) {
      return '/usr/bin/chromium-browser';
    }
  } catch {
    // Ignore — let puppeteer use its bundled browser
  }
  return undefined;
}

/**
 * Renders an HTML string to a PDF buffer using Puppeteer.
 */
export async function renderPdf(options: RenderPdfOptions): Promise<Buffer> {
  const {
    html,
    width = '8.5in',
    height = '11in',
    landscape = false,
    printBackground = true,
  } = options;

  let browser: Browser | null = null;

  try {
    const executablePath = getExecutablePath();

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      ...(executablePath ? { executablePath } : {}),
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width,
      height,
      landscape,
      printBackground,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
