const test = require("node:test");
const assert = require("node:assert/strict");
const { renderHtml } = require("../src");

test("renderHtml supports nested keys", () => {
  const template = {
    id: "tech-classic",
    name: "Tech Classic",
    category: "TECH",
    layout: {
      sections: [
        {
          type: "PROFILE",
          blocks: [
            { key: "profile.name", label: "Name" },
            { key: "profile.title", label: "Title" }
          ]
        }
      ]
    }
  };

  const html = renderHtml({
    template,
    data: { profile: { name: "Ada Lovelace", title: "Engineer" } }
  });

  assert.ok(html.includes("Ada Lovelace"));
  assert.ok(html.includes("Engineer"));
});

test("renderHtml maintains absolute consistency between live preview and offline print modes", () => {
  const template = {
    id: "tech-classic",
    name: "Tech Classic",
    category: "TECH",
    layout: {
      sections: [
        {
          type: "PROFILE",
          blocks: [
            { key: "profile.fullName", label: "Name" },
            { key: "profile.title", label: "Title" }
          ]
        }
      ]
    }
  };

  const data = { profile: { fullName: "Ada Lovelace", title: "Engineer" } };

  // Render for live web preview (CDN fonts)
  const previewHtml = renderHtml({ template, data });

  // Render for offline Puppeteer export (local filesystem fonts)
  const exportHtml = renderHtml({ template, data, localFontsDir: "/var/fonts" });

  // Verify that the body contents are exactly identical down to the character
  const previewBody = previewHtml.split("<body>")[1].split("</body>")[0].trim();
  const exportBody = exportHtml.split("<body>")[1].split("</body>")[0].trim();

  assert.equal(previewBody, exportBody);

  // Verify that correct font linking styles are injected
  assert.ok(previewHtml.includes("@import url('https://fonts.googleapis.com"));
  assert.ok(exportHtml.includes("@font-face"));
  assert.ok(exportHtml.includes("file:///var/fonts/Inter.ttf"));
});
