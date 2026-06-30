const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { TEMPLATE_REGISTRY } = require("../../shared/dist/index.js");
const { renderHtml, getGalleryDemoData, getTemplateStyles, getLayoutConfig, getTemplateSectionStyles, getTemplateLayout } = require("../dist/index.js");

const TEMPLATES = TEMPLATE_REGISTRY.map((entry) => ({
  id: entry.id,
  name: entry.name,
  category: entry.categoryCode,
}));

async function main() {
  const outputDir = path.join(__dirname, "..", "..", "..", "apps", "web", "public", "thumbnails");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-clipboard',
    '--no-zygote',
  ];

  let browser;
  try {
    console.log("Launching Puppeteer...");
    browser = await puppeteer.launch({
      headless: true,
      args: launchArgs,
    });
  } catch (err) {
    console.warn("Native Chrome launch failed. Trying system Chrome fallback...");
    const standardPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Local\\Google\\Chrome\\Application\\chrome.exe',
    ];
    let systemChromePath = null;
    for (const p of standardPaths) {
      if (fs.existsSync(p)) {
        systemChromePath = p;
        break;
      }
    }
    if (systemChromePath) {
      console.log(`Launching system Chrome: ${systemChromePath}`);
      browser = await puppeteer.launch({
        headless: true,
        executablePath: systemChromePath,
        args: launchArgs,
      });
    } else {
      throw new Error("No Chrome revision or local installation found.");
    }
  }

  const page = await browser.newPage();

  for (const tpl of TEMPLATES) {
    console.log(`Generating thumbnails for ${tpl.name}...`);
    
    // Construct template schema
    const templateSchema = {
      id: tpl.id,
      name: tpl.name,
      category: tpl.category,
      layout: getTemplateLayout(tpl.id),
      themeTokens: getTemplateStyles(tpl.id),
      layoutConfig: getLayoutConfig(tpl.id),
      sectionStyles: getTemplateSectionStyles(tpl.id),
    };

    const html = renderHtml({
      template: templateSchema,
      data: getGalleryDemoData(tpl.id),
    });

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch (e) {
      console.warn(`Warning: setContent timeout or error for ${tpl.name}, continuing anyway: ${e.message}`);
    }

    // A4 dimensions: 794x1123px at 96 DPI
    // Generate 1x Standard: 380x538px
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    const outPath1x = path.join(outputDir, `${tpl.id}.webp`);
    await page.screenshot({
      path: outPath1x,
      type: "webp",
      quality: 85
    });

    // Generate 2x Retina: 760x1076px
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    const outPath2x = path.join(outputDir, `${tpl.id}@2x.webp`);
    await page.screenshot({
      path: outPath2x,
      type: "webp",
      quality: 85
    });
  }

  await browser.close();
  console.log("All thumbnails generated successfully!");
}

main().catch(err => {
  console.error("Failed to generate thumbnails:", err);
  process.exit(1);
});
