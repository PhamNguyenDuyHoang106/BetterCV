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
