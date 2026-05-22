"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHtml = void 0;
const escapeHtml = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const renderHtml = ({ template, data }) => {
    const sections = template.layout.sections
        .map((section) => {
        const blocks = section.blocks
            .map((block) => {
            const raw = getValue(data, block.key);
            const value = typeof raw === "string" ? escapeHtml(raw) : JSON.stringify(raw ?? "");
            return `<div class="block"><h4>${escapeHtml(block.label)}</h4><div class="value">${value}</div></div>`;
        })
            .join("");
        return `<section class="section"><h3>${escapeHtml(section.type)}</h3>${blocks}</section>`;
    })
        .join("");
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; color: #111; }
      .section { margin-bottom: 16px; }
      .block { margin-bottom: 8px; }
      h3 { margin: 0 0 8px 0; font-size: 16px; }
      h4 { margin: 0 0 4px 0; font-size: 13px; }
      .value { font-size: 12px; }
    </style>
  </head>
  <body>
    ${sections}
  </body>
</html>`;
};
exports.renderHtml = renderHtml;
const getValue = (data, path) => {
    return path.split(".").reduce((acc, key) => {
        if (acc && typeof acc === "object" && key in acc) {
            return acc[key];
        }
        return undefined;
    }, data);
};
//# sourceMappingURL=index.js.map