import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOTS_DIR = 'C:\\Users\\ryana\\.gemini\\antigravity\\brain\\49f629e5-eae4-4ff3-bb65-7f52d1bd2f34\\screenshots';
const BASE_URL = 'http://localhost:4173/';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching Edge for comprehensive verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Initial load
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await delay(800);

  // Set explicit Light mode first
  console.log('Setting Light mode...');
  await page.click('button[title="Settings"]');
  await delay(400);
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.trim() === 'Light');
    if (btn) btn.click();
  });
  await delay(300);
  await page.click('button[aria-label="Close dialog"]');
  await delay(400);

  // 1. Desktop 1440px - Light, Blue Palette (Initial)
  console.log('Capturing Desktop 1440px Light Blue...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_desktop_1440_light_blue.png') });

  // 2. Switch to Colorful Palette
  console.log('Switching to Colorful Palette...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.trim() === 'Colorful');
    if (btn) btn.click();
  });
  await delay(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_desktop_1440_light_colorful.png') });

  // 3. Switch to Individual Spinner Style
  console.log('Switching to Individual Spinner Style...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.trim() === 'Individual');
    if (btn) btn.click();
  });
  await delay(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_desktop_1440_individual_style.png') });

  // Switch back to Grouped style & Blue palette
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const gBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Grouped');
    if (gBtn) gBtn.click();
    const bBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Blue');
    if (bBtn) bBtn.click();
  });
  await delay(300);

  // 4. Test Settings Sheet & Dark Mode
  console.log('Opening Settings and enabling Dark Appearance...');
  await page.click('button[title="Settings"]');
  await delay(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_settings_sheet_open.png') });

  // Click "Dark" appearance
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.trim() === 'Dark');
    if (btn) btn.click();
  });
  await delay(300);
  await page.click('button[aria-label="Close dialog"]');
  await delay(400);

  // Screenshot Desktop 1440px Dark Mode Blue
  console.log('Capturing Desktop 1440px Dark Mode Blue...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_desktop_1440_dark_blue.png') });

  // Switch to Colorful in Dark Mode
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.trim() === 'Colorful');
    if (btn) btn.click();
  });
  await delay(400);
  console.log('Capturing Desktop 1440px Dark Mode Colorful...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_desktop_1440_dark_colorful.png') });

  // Switch back to light mode and blue palette
  await page.click('button[title="Settings"]');
  await delay(300);
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const lightBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Light');
    if (lightBtn) lightBtn.click();
    const blueBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Blue');
    if (blueBtn) blueBtn.click();
  });
  await delay(300);
  await page.click('button[aria-label="Close dialog"]');
  await delay(400);

  // 5. Test Add / Edit Prize Dialog
  console.log('Testing Add / Edit Prize Dialog...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Add prize'));
    if (btn) btn.click();
  });
  await delay(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_add_prize_dialog.png') });
  await page.click('button[aria-label="Close dialog"]');
  await delay(300);

  // 6. Test Space Key Spin & Result Dialog
  console.log('Testing Space Key trigger and Spin...');
  await page.click('body');
  await page.keyboard.press('Space');
  await delay(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_wheel_spinning_in_action.png') });

  console.log('Waiting for spin to complete and result dialog to open...');
  await delay(6500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_result_dialog_with_dimmed_slices.png') });

  // Type a winner name and confirm
  console.log('Entering winner name and confirming...');
  const winnerInput = await page.$('input[placeholder="Example: Budi Santoso or T-084"]');
  if (winnerInput) {
    await winnerInput.type('Budi Santoso (T-084)');
    await delay(300);
  }
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.trim() === 'Confirm');
    if (btn) btn.click();
  });
  await delay(500);

  // 7. Tablet 768px View
  console.log('Capturing Tablet 768px View...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_tablet_768_light.png') });

  // 8. Mobile 375px View - Wheel Tab
  console.log('Capturing Mobile 375px View (Wheel Tab)...');
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_mobile_375_wheel_tab.png') });

  // 9. Mobile 375px View - Prizes Tab via Mobile Navigation
  console.log('Capturing Mobile 375px View (Prizes Tab)...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav[aria-label="Mobile Navigation"] button'));
    const prizesBtn = navButtons.find(b => b.textContent && b.textContent.includes('Prizes'));
    if (prizesBtn) prizesBtn.click();
  });
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_mobile_375_prizes_tab.png') });

  // 10. Mobile 375px View - History Tab via Mobile Navigation
  console.log('Capturing Mobile 375px View (History Tab)...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav[aria-label="Mobile Navigation"] button'));
    const histBtn = navButtons.find(b => b.textContent && b.textContent.includes('History'));
    if (histBtn) histBtn.click();
  });
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_mobile_375_history_tab.png') });

  // 11. Mobile 375px View - Dark Mode
  console.log('Capturing Mobile 375px View (Dark Mode)...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await delay(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_mobile_375_dark_mode.png') });

  // 12. Presentation Mode (Fullscreen Key F)
  console.log('Testing Presentation Mode...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });
  await delay(300);
  await page.keyboard.press('KeyF');
  await delay(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_presentation_mode_fullscreen.png') });

  console.log('All verification scenarios and screenshots completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
