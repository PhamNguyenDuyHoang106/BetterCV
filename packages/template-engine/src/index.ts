export type TemplateSchema = {
  id: string;
  name: string;
  category: "TECH" | "BUSINESS" | "DESIGN";
  layout: {
    sections: Array<{
      type: string;
      blocks: Array<{
        key: string;
        label: string;
      }>;
    }>;
  };
};

export type RenderInput = {
  template: TemplateSchema;
  data: Record<string, unknown>;
  localFontsDir?: string; // Optional local path for Puppeteer offline rendering
};

/**
 * A fast, lightweight, zero-dependency Markdown-to-HTML compiler.
 * Correctly compiles standard resume markdown including bold, italics, bullets, and paragraphs.
 */
export const compileMarkdown = (markdown: string): string => {
  if (!markdown) return "";
  
  let html = markdown
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italics: *text*
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Bullet items: - item or * item
    .replace(/^\s*[-*]\s+(.*)$/gm, "<li>$1</li>");

  // Group continuous <li> elements into <ul> containers
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  // Handle double newlines as paragraphs and single newlines as line breaks
  html = html
    .split("\n\n")
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<ul>")) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .filter(Boolean)
    .join("");

  return html;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const renderHtml = ({ template, data, localFontsDir }: RenderInput): string => {
  const sections = template.layout.sections
    .map((section) => {
      const blocks = section.blocks
        .map((block) => {
          const raw = getValue(data, block.key);
          
          let value = "";
          if (typeof raw === "string") {
            const isRichText = block.key.endsWith(".description") || 
                               block.key.endsWith(".summary") || 
                               block.key === "summary";
            value = isRichText ? compileMarkdown(raw) : escapeHtml(raw);
          } else if (Array.isArray(raw)) {
            // Check key to render lists and sub-blocks beautifully
            if (block.key === "experience") {
              value = raw.map((item: any) => `
                <div class="experience-item" style="margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">
                  <div style="display: flex; justify-content: space-between; font-weight: 600; color: #0f172a; font-size: 13px;">
                    <span>${escapeHtml(item.position || '')}</span>
                    <span style="font-weight: 400; color: #64748b; font-size: 12px;">${escapeHtml(item.startDate || '')} - ${item.current ? 'Hiện tại' : escapeHtml(item.endDate || '')}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; font-style: italic; margin-bottom: 4px;">
                    <span>${escapeHtml(item.company || '')} ${item.location ? `| ${escapeHtml(item.location)}` : ''}</span>
                  </div>
                  <div style="font-size: 12px; color: #334155;">${compileMarkdown(item.description || '')}</div>
                </div>
              `).join("");
            } else if (block.key === "education") {
              value = raw.map((item: any) => `
                <div class="education-item" style="margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid;">
                  <div style="display: flex; justify-content: space-between; font-weight: 600; color: #0f172a; font-size: 13px;">
                    <span>${escapeHtml(item.institution || '')}</span>
                    <span style="font-weight: 400; color: #64748b; font-size: 12px;">${escapeHtml(item.startDate || '')} - ${escapeHtml(item.endDate || '')}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569;">
                    <span>${escapeHtml(item.degree || '')} ${item.fieldOfStudy ? `| Chuyên ngành: ${escapeHtml(item.fieldOfStudy)}` : ''}</span>
                    ${item.gpa ? `<span>GPA: ${escapeHtml(item.gpa)}</span>` : ''}
                  </div>
                </div>
              `).join("");
            } else if (block.key === "skills") {
              value = `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">${
                raw.map((item: any) => `
                  <span style="background-color: #f8fafc; color: #334155; font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; display: inline-block;">
                    ${escapeHtml(item.name || '')}${item.level ? ` (${escapeHtml(item.level)})` : ''}
                  </span>
                `).join("")
              }</div>`;
            } else if (block.key === "projects") {
              value = raw.map((item: any) => `
                <div class="project-item" style="margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">
                  <div style="display: flex; justify-content: space-between; font-weight: 600; color: #0f172a; font-size: 13px;">
                    <span>${escapeHtml(item.name || '')} ${item.role ? `(${escapeHtml(item.role)})` : ''}</span>
                    ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" style="color: #3b82f6; text-decoration: underline; font-size: 11px;">Link dự án</a>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #334155; margin-top: 2px;">${compileMarkdown(item.description || '')}</div>
                  ${item.technologies && item.technologies.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                      ${item.technologies.map((t: string) => `<span style="font-size: 10px; background-color: #f1f5f9; color: #475569; padding: 1px 4px; border-radius: 2px; font-weight: 500; border: 1px solid #e2e8f0;">${escapeHtml(t)}</span>`).join("")}
                    </div>
                  ` : ''}
                </div>
              `).join("");
            } else {
              value = `<pre class="json-value">${escapeHtml(JSON.stringify(raw, null, 2))}</pre>`;
            }
          } else if (raw !== null && raw !== undefined) {
            value = `<pre class="json-value">${escapeHtml(JSON.stringify(raw, null, 2))}</pre>`;
          }

          return `<div class="block">
            <h4>${escapeHtml(block.label)}</h4>
            <div class="value">${value}</div>
          </div>`;
        })
        .join("");

      return `<section class="section">
        <h3>${escapeHtml(section.type)}</h3>
        <div class="section-content">${blocks}</div>
      </section>`;
    })
    .join("");

  // Determine standard font loaders: Local file paths for Puppeteer offline vs. Google Fonts CDN for live Web preview
  const fontCss = localFontsDir
    ? `
      @font-face {
        font-family: 'Inter';
        src: url('file://${localFontsDir}/Inter.ttf') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Merriweather';
        src: url('file://${localFontsDir}/Merriweather.ttf') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }
      body { font-family: 'Inter', sans-serif; }
      h1, h2, h3 { font-family: 'Merriweather', serif; }
      `
    : `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
      body { font-family: 'Inter', sans-serif; }
      h1, h2, h3 { font-family: 'Merriweather', serif; }
      `;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      ${fontCss}
      
      /* Global Resets and Core Styles */
      body { 
        color: #1e293b; 
        line-height: 1.6;
        font-size: 13px;
        margin: 0;
        padding: 40px;
        background-color: #ffffff;
      }
      
      .section { 
        margin-bottom: 24px; 
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      h3 { 
        margin: 0 0 12px 0; 
        font-size: 14px; 
        color: #0f172a; 
        border-bottom: 1.5px solid #cbd5e1;
        padding-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        page-break-after: avoid;
        break-after: avoid;
      }
      
      .section-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .block { 
        margin-bottom: 6px; 
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      h4 { 
        margin: 0 0 4px 0; 
        font-size: 13px; 
        color: #334155; 
        font-weight: 600;
        page-break-after: avoid;
        break-after: avoid;
      }
      
      .value { 
        font-size: 12px; 
        color: #475569;
      }
      
      .value p {
        margin: 0 0 8px 0;
      }
      
      .value p:last-child {
        margin-bottom: 0;
      }
      
      .value ul {
        margin: 4px 0 8px 0;
        padding-left: 20px;
      }
      
      .value li {
        margin-bottom: 4px;
      }
      
      .json-value {
        margin: 0;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 8px;
        overflow-x: auto;
      }

      /* Strict Printing Rules for Perfect A4 page cuts */
      @media print {
        body { 
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        h3, h4 {
          page-break-after: avoid;
          break-after: avoid;
        }
      }
    </style>
  </head>
  <body>
    ${sections}
  </body>
</html>`;
};

const getValue = (data: Record<string, unknown>, path: string) => {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, data);
};
