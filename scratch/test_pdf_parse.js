const { PDFParse } = require('pdf-parse');

async function main() {
  try {
    const mockPdfBuffer = Buffer.from("%PDF-1.4 ..."); // Just a dummy buffer
    const parser = new PDFParse({ data: mockPdfBuffer });
    console.log("Successfully instantiated PDFParse!");
    console.log("Calling getText()...");
    const textResult = await parser.getText();
    console.log("Text:", textResult.text);
  } catch (err) {
    console.error("Caught expected error from parsing bad PDF:", err.message);
  }
}

main();
