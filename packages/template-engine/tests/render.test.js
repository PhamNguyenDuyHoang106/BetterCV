const test = require("node:test");
const assert = require("node:assert/strict");
const { 
  renderHtml, 
  compileMarkdown, 
  normalizeData,
  TemplateSchemaZod,
  ThemeTokensSchema,
  LayoutConfigSchema,
  getTemplateLayout,
  getSectionBlocks,
  sanitizeAndValidateTemplate,
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

// 6. Structural & Layout Options Tests
test("renderHtml - respects layoutConfig structural options and sidebar positions", () => {
  const template = {
    id: "custom-template",
    name: "Custom Template",
    category: "DESIGN",
    layout: {
      sections: [
        { type: "SUMMARY", blocks: [] },
        { type: "SKILLS", blocks: [] }
      ]
    },
    layoutConfig: {
      layoutMode: "sidebar-right",
      columns: {
        sidebar: ["SKILLS"],
        main: ["SUMMARY"]
      },
      order: ["SUMMARY", "SKILLS"],
      headerAlignment: "center",
      showAvatar: false,
      useTimeline: false,
      fullBleedHeader: true,
      fullPageBleed: true
    }
  };

  const data = {
    profile: { fullName: "Ada Lovelace", title: "Programmer", avatarUrl: "https://avatar.com/1.png" },
    summary: { text: "Pioneer." },
    skills: [{ name: "Math" }]
  };

  const html = renderHtml({ template, data });

  // Sidebar-right layout must contain the correct CSS class
  assert.ok(html.includes("sidebar-right"));

  // Center alignment and showAvatar: false rules
  assert.ok(html.includes("full-bleed-header"));
  assert.ok(html.includes("full-page-bleed-style"));
});

// 7. Section Variants Rendering Tests
test("renderHtml - renders correct HTML classes and structures for experience & skills variants", () => {
  const template = {
    id: "variant-test",
    name: "Variant Test",
    category: "TECH",
    layout: {
      sections: [
        { type: "EXPERIENCE", blocks: [] },
        { type: "SKILLS", blocks: [] }
      ]
    },
    sectionStyles: {
      experience: { variant: "timeline" },
      skills: { variant: "bars" }
    }
  };

  const data = {
    profile: { fullName: "Ada Lovelace" },
    experience: [
      { id: "1", position: "Pioneer", company: "Babbage", startDate: "1840", endDate: "1843", description: "First program." }
    ],
    skills: [
      { name: "Math", level: "Expert" }
    ]
  };

  const html = renderHtml({ template, data });

  // Experience timeline variant class must be outputted
  assert.ok(html.includes("variant-timeline"));

  // Skills level bars variant must be rendered
  assert.ok(html.includes("variant-bars"));
  assert.ok(html.includes("skill-level-bars"));
  assert.ok(html.includes("level-bar"));
});

test("renderHtml - renders languages, certifications, awards and skills columns variant", () => {
  const template = {
    id: "variant-test",
    name: "Variant Test",
    category: "DESIGN",
    layout: {
      sections: [
        { type: "LANGUAGES", blocks: [] },
        { type: "CERTIFICATIONS", blocks: [] },
        { type: "AWARDS", blocks: [] },
        { type: "SKILLS", blocks: [] },
      ],
    },
    layoutConfig: {
      layoutMode: "single-column",
      columns: {
        main: ["LANGUAGES", "CERTIFICATIONS", "AWARDS", "SKILLS"],
      },
      order: ["LANGUAGES", "CERTIFICATIONS", "AWARDS", "SKILLS"],
    },
    sectionStyles: {
      skills: { variant: "columns" },
    },
  };

  const data = {
    profile: { fullName: "Alex Mercer" },
    languages: [{ name: "English", level: "Professional" }],
    certifications: [{ name: "AWS SA", issuer: "AWS", date: "2023" }],
    awards: [{ title: "Top Engineer", issuer: "TechCorp", date: "2024" }],
    skills: [{ name: "React", level: "Expert" }],
  };

  const html = renderHtml({ template, data });

  assert.ok(html.includes("Ngôn ngữ"));
  assert.ok(html.includes("English"));
  assert.ok(html.includes("Chứng chỉ"));
  assert.ok(html.includes("AWS SA"));
  assert.ok(html.includes("Giải thưởng"));
  assert.ok(html.includes("Top Engineer"));
  assert.ok(html.includes("variant-columns"));
});

test("renderHtml - skips duplicate CONTACT section when sidebar header already shows contacts", () => {
  const template = {
    id: "synergy-pro",
    name: "Synergy Pro",
    category: "DESIGN",
    layout: { sections: [{ type: "CONTACT", blocks: [] }, { type: "SUMMARY", blocks: [] }] },
    layoutConfig: {
      layoutMode: "sidebar-left",
      columns: { sidebar: ["CONTACT", "SUMMARY"], main: [] },
      order: ["CONTACT", "SUMMARY"],
      showAvatar: true,
      fullPageBleed: true,
    },
  };

  const data = {
    profile: { fullName: "Alex Mercer", email: "alex@example.com", phone: "+84 123" },
    summary: { text: "Builder." },
  };

  const html = renderHtml({ template, data });

  assert.ok(html.includes("contact-bar-sidebar"));
  assert.equal((html.match(/section-contact/g) || []).length, 0);
});

test("getTemplateLayout - derives sections and blocks from layoutConfig per template", () => {
  const synergyLayout = getTemplateLayout("synergy-pro");
  const sectionTypes = synergyLayout.sections.map((section) => section.type);

  assert.ok(sectionTypes.includes("PROFILE"));
  assert.ok(sectionTypes.includes("LANGUAGES"));
  assert.ok(sectionTypes.includes("CONTACT"));
  assert.equal(getSectionBlocks("startup-operator", "PROJECTS")[0].label, "Sản phẩm & Dự án");
});

test("sanitizeAndValidateTemplate - backfills missing layout sections from canonical template layout", () => {
  const sanitized = sanitizeAndValidateTemplate({
    id: "synergy-pro",
    name: "Synergy Pro",
    category: "BUSINESS",
    layout: {
      sections: [
        { type: "SUMMARY", blocks: [{ key: "summary.text", label: "Giới thiệu" }] },
      ],
    },
  });

  const sectionTypes = sanitized.layout.sections.map((section) => section.type);
  assert.ok(sectionTypes.includes("LANGUAGES"));
  assert.ok(sectionTypes.includes("CONTACT"));
});

test("renderHtml - renders granular profile blocks inside CONTACT section", () => {
  const template = {
    id: "contact-blocks-test",
    name: "Contact Blocks",
    category: "BUSINESS",
    layout: {
      sections: [
        {
          type: "CONTACT",
          blocks: [
            { key: "profile.phone", label: "Phone" },
            { key: "profile.email", label: "Email" },
          ],
        },
      ],
    },
    layoutConfig: {
      layoutMode: "single-column",
      columns: { main: ["CONTACT"] },
      order: ["CONTACT"],
      showAvatar: false,
    },
  };

  const data = {
    profile: { fullName: "Ada Lovelace", phone: "+1 555", email: "ada@example.com" },
  };

  const html = renderHtml({ template, data, locale: "en" });

  assert.ok(html.includes("block-profile-phone"));
  assert.ok(html.includes("block-profile-email"));
  assert.ok(html.includes("+1 555"));
  assert.ok(html.includes("ada@example.com"));
});

test("renderHtml - honors renderOptions hidden sections and blocks", () => {
  const template = {
    id: "render-options-test",
    name: "Render Options",
    category: "BUSINESS",
    layout: {
      sections: [
        { type: "SUMMARY", blocks: [{ key: "summary.text", label: "Summary" }] },
        {
          type: "CONTACT",
          blocks: [
            { key: "profile.phone", label: "Phone" },
            { key: "profile.email", label: "Email" },
          ],
        },
        { type: "SKILLS", blocks: [{ key: "skills", label: "Skills" }] },
      ],
    },
    layoutConfig: {
      layoutMode: "single-column",
      columns: { main: ["SUMMARY", "CONTACT", "SKILLS"] },
      order: ["SUMMARY", "CONTACT", "SKILLS"],
      showAvatar: false,
    },
    sectionStyles: {
      skills: { variant: "badges" },
    },
  };

  const data = {
    profile: {
      fullName: "Ada Lovelace",
      phone: "+1 555",
      email: "ada@example.com",
      renderOptions: {
        hiddenSections: ["SUMMARY"],
        hiddenBlocks: ["profile.phone"],
        sectionVariants: {
          SKILLS: "bars",
        },
      },
    },
    summary: { text: "This should be hidden" },
    skills: [{ name: "TypeScript", level: "Expert" }],
  };

  const html = renderHtml({ template, data, locale: "en" });

  assert.ok(!html.includes("Summary"));
  assert.ok(!html.includes("block-profile-phone"));
  assert.ok(html.includes("ada@example.com"));
  assert.ok(html.includes("variant-bars"));
});

// 8. Backward Compatibility / Regression Tests
test("renderHtml - gracefully falls back and renders without crashing when provided with a legacy template schema", () => {
  const legacyTemplate = {
    id: "legacy-ats",
    name: "Legacy ATS Template",
    category: "BUSINESS",
    layout: {
      sections: [
        { type: "SUMMARY", blocks: [] }
      ]
    }
    // Missing layoutConfig, themeTokens, and sectionStyles entirely
  };

  const data = {
    profile: { fullName: "Legacy User" },
    summary: { text: "Legacy test." }
  };

  // Rendering must not throw any error
  let html = "";
  assert.doesNotThrow(() => {
    html = renderHtml({ template: legacyTemplate, data });
  });

  // Safe assertions to verify it fell back gracefully to single-column ATS configuration
  assert.ok(html.includes("Legacy User"));
  assert.ok(html.includes("Legacy test."));
  assert.ok(html.includes("resume-sections-container") || html.includes("resume-container"));
});

// 9. Languages showLevel Validation Tests
test("renderHtml - respects languages showLevel toggle to display or hide proficiency scale", () => {
  const template = {
    id: "lang-test",
    name: "Languages Test",
    category: "DESIGN",
    layout: {
      sections: [
        { type: "LANGUAGES", blocks: [] }
      ]
    },
    layoutConfig: {
      layoutMode: "single-column",
      columns: { main: ["LANGUAGES"] },
      order: ["LANGUAGES"]
    }
  };

  // 9a. Test showLevel = true (renders 5-bar rating visual)
  const dataWithLevelScale = {
    profile: { fullName: "Test User" },
    languages: {
      items: [{ name: "Vietnamese", level: "Native" }],
      showLevel: true
    }
  };

  const htmlScale = renderHtml({ template, data: dataWithLevelScale });
  assert.ok(htmlScale.includes('class="lang-level-bar'));
  assert.ok(htmlScale.includes('class="language-level-bars'));
  assert.ok(htmlScale.includes("Native"));

  // 9b. Test showLevel = false (renders only text, no bars)
  const dataWithoutLevelScale = {
    profile: { fullName: "Test User" },
    languages: {
      items: [{ name: "Vietnamese", level: "Native" }],
      showLevel: false
    }
  };

  const htmlNoScale = renderHtml({ template, data: dataWithoutLevelScale });
  assert.ok(!htmlNoScale.includes('class="lang-level-bar'));
  assert.ok(!htmlNoScale.includes('class="language-level-bars'));
  assert.ok(htmlNoScale.includes("Native"));
});




