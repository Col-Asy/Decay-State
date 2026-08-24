import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Polyfill global browser context constructors if missing in Node environment
    if (typeof globalThis.DOMMatrix === "undefined") {
      globalThis.DOMMatrix = class DOMMatrix {} as any;
    }
    if (typeof globalThis.ImageData === "undefined") {
      globalThis.ImageData = class ImageData {} as any;
    }
    if (typeof globalThis.Path2D === "undefined") {
      globalThis.Path2D = class Path2D {} as any;
    }

    // Custom text-only parser to avoid loading the canvas-based page renderer
    const renderPageTextOnly = async (pageData: any) => {
      const textContent = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });
      
      let lastY: number | undefined;
      let text = "";
      for (const item of textContent.items) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += "\n" + item.str;
        }
        lastY = item.transform[5];
      }
      return text;
    };

    const pdfModule = require("pdf-parse");
    let pdfFunc: any;
    if (typeof pdfModule === "function") {
      pdfFunc = pdfModule;
    } else if (pdfModule && typeof pdfModule.PDFParse === "function") {
      pdfFunc = async (buff: Buffer, opts: any) => {
        const parser = new pdfModule.PDFParse({ data: new Uint8Array(buff) });
        return await parser.getText(opts);
      };
    } else if (pdfModule && typeof pdfModule.default === "function") {
      pdfFunc = pdfModule.default;
    }

    if (typeof pdfFunc !== "function") {
      throw new Error("Unable to resolve a valid PDF parsing function from pdf-parse.");
    }

    const data = await pdfFunc(buffer, {
      pagerender: renderPageTextOnly
    });

    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error("Error parsing document:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to parse document" },
      { status: 500 }
    );
  }
}
