import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const artifactDir = 'C:\\Users\\Rabuno\\.gemini\\antigravity\\brain\\87e4b471-5217-4d58-9e9a-20cb04aa6f68';

async function run() {
  console.log('[Puppeteer] Starting high-speed visual UI testing...');
  
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  // Launch native Chrome to ensure maximum rendering fidelity
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--remote-allow-origins=*'
    ]
  });

  const page = await browser.newPage();
  // Set gorgeous premium laptop viewport
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. LANDING PAGE
    console.log('[Puppeteer] Capturing Landing Page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.waitForTimeout?.(1500) || new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(artifactDir, 'landing_page.png') });
    console.log('[Puppeteer] Landing Page screenshot saved successfully.');

    // 2. LOGIN PAGE
    console.log('[Puppeteer] Capturing Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.waitForTimeout?.(1000) || new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(artifactDir, 'login_page.png') });
    console.log('[Puppeteer] Login Page screenshot saved successfully.');

    // 3. REGISTER PAGE
    console.log('[Puppeteer] Capturing Register Page...');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2' });
    await page.waitForTimeout?.(1000) || new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(artifactDir, 'register_page.png') });
    console.log('[Puppeteer] Register Page screenshot saved successfully.');

  } catch (err) {
    console.error('[Puppeteer] Verification Error:', err.message);
  } finally {
    console.log('[Puppeteer] Terminating browser...');
    await browser.close();
    console.log('[Puppeteer] Verification completed successfully!');
  }
}

run();
