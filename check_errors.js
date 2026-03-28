import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url() + ' ' + request.failure().errorText)
  );

  await page.goto('http://localhost:4174/DH6034/', { waitUntil: 'networkidle' });

  await page.waitForTimeout(2000);
  await browser.close();
})();
