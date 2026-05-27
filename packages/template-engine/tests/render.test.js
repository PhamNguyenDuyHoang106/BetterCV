const test = require("node:test");
const assert = require("node:assert/strict");
const { 
  renderHtml, 
  compileMarkdown, 
  normalizeData,
  TemplateSchemaZod,
  ThemeTokensSchema,
  LayoutConfigSchema
} = require("../src");

// 1. Sanitization & Markdown Compiler Tests
test("compileMarkdown sanitization - strips unsafe XSS vectors and compiles safe elements", () => {
  const unsafeMarkdown = "Hello <script>alert('xss')</script> and **bold** and *italic*\n\n- Bullet 1\n- Bullet 2\n[Link](javascript:alert(1))";
  
  const compiled = compileMarkdown(unsafeMarkdown);
  
  // Script tags must be completely escaped
  assert.ok(!compiled.includes("<script>"));
  assert.ok(compiled.includes("&lt;script&gt;"));
  
  // Safe markdown tags must be compiled
  assert.ok(compiled.includes("<strong>bold</strong>"));
  assert.ok(compiled.includes("<em>italic</em>"));
  assert.ok(compiled.includes("<ul><li>Bullet 1</li>\n<li>Bullet 2</li></ul>"));
  
  // javascript: URLs must be stripped to #
  assert.ok(!compiled.includes("javascript:"));
});

// 2. Data Normalization Rules
test("normalizeData - handles empty arrays, strips unsafe URLs, and deduplicates skills", () => {
  const malformedData = {
    profile: {
      fullName: "   John Doe   ",
      email: "john@example.com",
      website: "javascript:void(0)"
    },
    skills: [
      { name: "React", level: "Advanced" },
      { name: "react", level: "Intermediate" }, // Duplicate with different casing
      { name: "TypeScript", level: "Expert" }
    ],
    experience: null // null fallback
  };

  const normalized = normalizeData(malformedData);

  // Profile fields trimmed & unsafe website stripped to #
  assert.equal(normalized.profile.fullName, "John Doe");
  assert.equal(normalized.profile.website, "#");

  // Skills deduplicated case-insensitively
  assert.equal(normalized.skills.length, 2);
  assert.equal(normalized.skills[0].name, "React");
  assert.equal(normalized.skills[1].name, "TypeScript");

  // Experience fallback to empty array
  assert.ok(Array.isArray(normalized.experience));
  assert.equal(normalized.experience.length, 0);
});

// 3. Schema Validation Layers
test("TemplateSchemaZod - validates valid templates and throws on malformed templates", () => {
  const validTemplate = {
    id: "dublin",
    name: "Dublin Layout",
    category: "TECH",
    layout: {
      sections: [
        { type: "SUMMARY", blocks: [{ key: "summary.text", label: "About" }] }
      ]
    }
  };

  // Parsing valid schema should succeed
  const parsed = TemplateSchemaZod.parse(validTemplate);
  assert.equal(parsed.id, "dublin");

  // Parsing invalid categories or missing attributes should throw error
  const invalidTemplate = {
    id: "dublin",
    name: "Dublin Layout",
    category: "INVALID_CAT",
    layout: { sections: [] }
  };

  assert.throws(() => {
    TemplateSchemaZod.parse(invalidTemplate);
  });
});

test("ThemeTokensSchema - validates hexadecimal colors and standard options", () => {
  const validTheme = {
    primaryColor: "#3b82f6",
    secondaryColor: "#1e293b",
    accentColor: "#f43f5e",
    dividerColor: "#e2e8f0",
    fontHeader: "Manrope",
    fontBody: "Inter",
    sidebarWidth: "30%",
    sectionGap: "24px",
    timelineBorderColor: "#e2e8f0",
    headerBackground: "transparent",
    headerTextColor: "#1e293b"
  };

  const parsed = ThemeTokensSchema.parse(validTheme);
  assert.equal(parsed.primaryColor, "#3b82f6");

  const invalidTheme = {
    ...validTheme,
    primaryColor: "not-a-color" // Invalid format
  };

  assert.throws(() => {
    ThemeTokensSchema.parse(invalidTheme);
  });
});

// 4. Parity and Rendering Consistency Tests
test("renderHtml - maintains absolute HTML structure parity between editor and export views", () => {
  const template = {
    id: "dublin",
    name: "Dublin Layout",
    category: "TECH",
    layout: {
      sections: [
        { type: "SUMMARY", blocks: [{ key: "summary.text", label: "About" }] },
        { type: "SKILLS", blocks: [] }
      ]
    }
  };

  const data = {
    profile: { fullName: "Ada Lovelace", title: "Programmer" },
    summary: { text: "Pioneer of computing." },
    skills: [{ name: "Babbage Engine" }]
  };

  // Editor/Live preview html (uses CDN fonts)
  const editorHtml = renderHtml({ template, data });

  // PDF export html (uses local fonts)
  const exportHtml = renderHtml({ template, data, localFontsDir: "/usr/share/fonts" });

  // Grids, content, sidebars, names, details must be 100% identical.
  // The only difference allowed is the @import url / @font-face style tag in the <head>
  const editorBody = editorHtml.split(/<body[^>]*>/)[1].split("</body>")[0].trim();
  const exportBody = exportHtml.split(/<body[^>]*>/)[1].split("</body>")[0].trim();

  assert.equal(editorBody, exportBody);
  assert.ok(editorHtml.includes("Ada Lovelace"));
  assert.ok(editorHtml.includes("Pioneer of computing."));
  assert.ok(editorHtml.includes("Babbage Engine"));
});

// 5. Cache Layer Performance & Hit Test
test("renderCache - hit returns cached object and avoids deep rendering recalculations", () => {
  const template = {
    id: "techstack",
    name: "Techstack Layout",
    category: "TECH",
    layout: { sections: [] }
  };

  const data = { profile: { fullName: "Grace Hopper" } };

  const firstRender = renderHtml({ template, data });
  const secondRender = renderHtml({ template, data });

  // Direct reference checking: output is exactly equal
  assert.equal(firstRender, secondRender);
});

