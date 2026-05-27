const puppeteer = require('puppeteer');
const fs = require('fs');

const standardPaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Local\\Google\\Chrome\\Application\\chrome.exe',
];

async function test() {
  console.log('Testing Puppeteer launch...');
  
  // Try locating system Chrome first
  let systemChromePath = null;
  for (const p of standardPaths) {
    if (fs.existsSync(p)) {
      systemChromePath = p;
      console.log(`Found system Chrome executable at: ${p}`);
      break;
    }
  }

  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-zygote',
    ],
  };

  if (systemChromePath) {
    launchOptions.executablePath = systemChromePath;
  }

  try {
    const browser = await puppeteer.launch(launchOptions);
    console.log('Puppeteer launched successfully!');
    const page = await browser.newPage();
    await page.setContent('<h1>Hello World from System Chrome</h1>');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF rendered successfully, buffer length:', pdf.length);
    await browser.close();
    console.log('Puppeteer closed successfully!');
  } catch (err) {
    console.error('Puppeteer launch failed with error:', err);
  }
}

test();
