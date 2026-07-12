const { renderHtml } = require("../packages/template-engine/src");

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

const dataWithScale = {
  profile: { fullName: "Test User" },
  languages: {
    items: [{ name: "Vietnamese", level: "Native" }],
    showLevel: true
  }
};

const dataWithoutScale = {
  profile: { fullName: "Test User" },
  languages: {
    items: [{ name: "Vietnamese", level: "Native" }],
    showLevel: false
  }
};

console.log("Running renderHtml with showLevel: true...");
const htmlScale = renderHtml({ template, data: dataWithScale });
console.log("Has scale output?", htmlScale.includes("lang-level-bar"));

console.log("Running renderHtml with showLevel: false...");
const htmlNoScale = renderHtml({ template, data: dataWithoutScale });
console.log("Has scale output?", htmlNoScale.includes("lang-level-bar"));
