import {
  type Color,
  PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import type { RecipeDocument } from "../queries";
import { formatIngredient, formatMeta, hasIngredients, hasSteps, nutritionRows } from "./format";

const PAGE_WIDTH_POINTS = 595.28;
const PAGE_HEIGHT_POINTS = 841.89;
const MARGIN_POINTS = 56;
const CONTENT_WIDTH_POINTS = PAGE_WIDTH_POINTS - MARGIN_POINTS * 2;
const DROPPED_CHARACTER = "\ue000";

const COLORS = {
  text: rgb(0.13, 0.12, 0.11),
  muted: rgb(0.45, 0.42, 0.4),
  accent: rgb(0.71, 0.3, 0.16),
  rule: rgb(0.88, 0.85, 0.82),
};

const WIN_ANSI_FALLBACKS = new Map([
  ["⅛", "1/8"],
  ["⅓", "1/3"],
  ["⅜", "3/8"],
  ["⅝", "5/8"],
  ["⅔", "2/3"],
  ["⅞", "7/8"],
  ["⅕", "1/5"],
  ["⅙", "1/6"],
  ["→", "->"],
  ["≈", "~"],
  ["−", "-"],
  ["×", "x"],
  ["℃", "°C"],
  ["℉", "°F"],
  ["\u00a0", " "],
  ["\u2009", " "],
  ["\u202f", " "],
]);

export type PdfPicture = { bytes: Uint8Array; contentType: string };

type TextStyle = { font: PDFFont; fontSize: number; color?: Color; lineHeight?: number };

class PdfLayout {
  private page!: PDFPage;
  private cursorPoints = 0;
  private readonly supportedCodePoints: Set<number>;

  constructor(
    private readonly document: PDFDocument,
    private readonly fonts: { regular: PDFFont; bold: PDFFont },
  ) {
    this.supportedCodePoints = new Set(fonts.regular.getCharacterSet());
    this.addPage();
  }

  private addPage() {
    this.page = this.document.addPage([PAGE_WIDTH_POINTS, PAGE_HEIGHT_POINTS]);
    this.cursorPoints = PAGE_HEIGHT_POINTS - MARGIN_POINTS;
  }

  ensure(heightPoints: number) {
    if (this.cursorPoints - heightPoints < MARGIN_POINTS + 16) this.addPage();
  }

  space(points: number) {
    this.cursorPoints -= points;
  }

  sanitize(text: string) {
    let output = "";

    for (const character of text) {
      if (character === "\n" || this.supportedCodePoints.has(character.codePointAt(0)!)) {
        output += character;
      } else if (WIN_ANSI_FALLBACKS.has(character)) {
        output += WIN_ANSI_FALLBACKS.get(character);
      } else {
        const base = character.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

        if (Array.from(base).every((part) => this.supportedCodePoints.has(part.codePointAt(0)!))) {
          output += base;
        } else if (/\p{Extended_Pictographic}|\p{M}|\u200d|\ufe0f/u.test(character)) {
          output += DROPPED_CHARACTER;
        } else {
          output += "?";
        }
      }
    }

    return output
      .replace(new RegExp(` *${DROPPED_CHARACTER}+(?=[.,!?;:)]|$)`, "gm"), "")
      .replace(new RegExp(`${DROPPED_CHARACTER}+ ?`, "g"), "");
  }

  wrap(text: string, font: PDFFont, fontSize: number, widthPoints: number) {
    const lines: string[] = [];

    for (const paragraph of this.sanitize(text).split("\n")) {
      let line = "";

      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;

        if (font.widthOfTextAtSize(candidate, fontSize) <= widthPoints) {
          line = candidate;
          continue;
        }

        if (line) lines.push(line);
        line = "";

        for (const character of word) {
          if (font.widthOfTextAtSize(line + character, fontSize) > widthPoints && line) {
            lines.push(line);
            line = "";
          }

          line += character;
        }
      }

      lines.push(line);
    }

    return lines;
  }

  text(
    text: string,
    style: TextStyle,
    options: { indentPoints?: number; prefix?: { text: string; style: TextStyle } } = {},
  ) {
    const indentPoints = options.indentPoints ?? 0;
    const lineHeightPoints = style.fontSize * (style.lineHeight ?? 1.4);
    const lines = this.wrap(text, style.font, style.fontSize, CONTENT_WIDTH_POINTS - indentPoints);
    lines.forEach((line, index) => {
      this.ensure(index === 0 ? lineHeightPoints * Math.min(lines.length, 2) : lineHeightPoints);
      this.cursorPoints -= lineHeightPoints;

      if (index === 0 && options.prefix) {
        this.page.drawText(this.sanitize(options.prefix.text), {
          x: MARGIN_POINTS,
          y: this.cursorPoints,
          font: options.prefix.style.font,
          size: options.prefix.style.fontSize,
          color: options.prefix.style.color ?? COLORS.text,
        });
      }

      this.page.drawText(line, {
        x: MARGIN_POINTS + indentPoints,
        y: this.cursorPoints,
        font: style.font,
        size: style.fontSize,
        color: style.color ?? COLORS.text,
      });
    });
  }

  heading(text: string) {
    this.ensure(60);
    this.space(18);
    this.text(text.toUpperCase(), {
      font: this.fonts.bold,
      fontSize: 11,
      color: COLORS.accent,
      lineHeight: 1.2,
    });
    this.space(5);
    this.rule(CONTENT_WIDTH_POINTS, 0.75);
    this.space(4);
  }

  subheading(text: string) {
    this.ensure(40);
    this.space(8);
    this.text(text, { font: this.fonts.bold, fontSize: 11.5 });
    this.space(1);
  }

  rule(widthPoints: number, thickness: number) {
    this.page.drawLine({
      start: { x: MARGIN_POINTS, y: this.cursorPoints },
      end: { x: MARGIN_POINTS + widthPoints, y: this.cursorPoints },
      thickness,
      color: COLORS.rule,
    });
  }

  image(image: PDFImage, maxHeightPoints: number) {
    const scale = Math.min(CONTENT_WIDTH_POINTS / image.width, maxHeightPoints / image.height);
    this.ensure(image.height * scale);
    this.cursorPoints -= image.height * scale;
    this.page.drawImage(image, {
      x: MARGIN_POINTS + (CONTENT_WIDTH_POINTS - image.width * scale) / 2,
      y: this.cursorPoints,
      width: image.width * scale,
      height: image.height * scale,
    });
  }

  table(rows: { label: string; value: string }[], widthPoints: number) {
    const fontSize = 10.5;

    for (const row of rows) {
      this.ensure(fontSize * 1.6);
      this.cursorPoints -= fontSize * 1.6;
      this.page.drawText(this.sanitize(row.label), {
        x: MARGIN_POINTS,
        y: this.cursorPoints,
        font: this.fonts.regular,
        size: fontSize,
        color: COLORS.text,
      });
      const value = this.sanitize(row.value);
      this.page.drawText(value, {
        x: MARGIN_POINTS + widthPoints - this.fonts.bold.widthOfTextAtSize(value, fontSize),
        y: this.cursorPoints,
        font: this.fonts.bold,
        size: fontSize,
        color: COLORS.text,
      });
      this.space(5);
      this.rule(widthPoints, 0.5);
      this.space(-5);
    }
  }

  footer(title: string) {
    const pages = this.document.getPages();
    pages.forEach((page, index) => {
      const text =
        pages.length > 1
          ? `${this.sanitize(title)}  ·  ${index + 1}/${pages.length}`
          : this.sanitize(title);

      page.drawText(text, {
        x: PAGE_WIDTH_POINTS - MARGIN_POINTS - this.fonts.regular.widthOfTextAtSize(text, 8.5),
        y: MARGIN_POINTS / 2,
        font: this.fonts.regular,
        size: 8.5,
        color: COLORS.muted,
      });
    });
  }
}

export async function recipeToPdf(recipe: RecipeDocument, picture?: PdfPicture | null) {
  const document = await PDFDocument.create();
  document.setTitle(recipe.title);
  document.setCreator("Lardon");
  document.setProducer("Lardon");

  const [regular, bold, italic] = await Promise.all([
    document.embedFont(StandardFonts.Helvetica),
    document.embedFont(StandardFonts.HelveticaBold),
    document.embedFont(StandardFonts.HelveticaOblique),
  ]);

  const layout = new PdfLayout(document, { regular, bold });
  const body: TextStyle = { font: regular, fontSize: 10.5, lineHeight: 1.45 };
  const marker: TextStyle = { font: bold, fontSize: 10.5, color: COLORS.accent };

  let image: PDFImage | null = null;

  try {
    if (picture?.contentType === "image/jpeg") image = await document.embedJpg(picture.bytes);

    if (picture?.contentType === "image/png") image = await document.embedPng(picture.bytes);
  } catch {
    image = null;
  }

  if (image) {
    layout.image(image, 250);
    layout.space(18);
  }

  layout.text(recipe.title, { font: bold, fontSize: 24, lineHeight: 1.2 });
  const meta = formatMeta(recipe);

  if (meta) {
    layout.space(4);
    layout.text(meta, { font: regular, fontSize: 10.5, color: COLORS.muted });
  }

  if (recipe.tags.length > 0) {
    layout.space(2);
    layout.text(recipe.tags.map((tag) => `#${tag}`).join("  "), {
      font: regular,
      fontSize: 9.5,
      color: COLORS.accent,
    });
  }

  if (hasIngredients(recipe)) {
    layout.heading("Ingredients");

    for (const section of recipe.ingredients) {
      if (section.ingredients.length === 0) continue;

      if (section.title) layout.subheading(section.title);

      for (const ingredient of section.ingredients) {
        layout.text(formatIngredient(ingredient), body, {
          indentPoints: 14,
          prefix: { text: "•", style: marker },
        });
      }
    }
  }

  if (hasSteps(recipe)) {
    layout.heading("Steps");

    for (const section of recipe.steps) {
      if (section.steps.length === 0) continue;

      if (section.title) layout.subheading(section.title);
      section.steps.forEach((step, index) => {
        layout.text(step.text, body, {
          indentPoints: 22,
          prefix: { text: `${index + 1}.`, style: marker },
        });
        layout.space(5);
      });
    }
  }

  const nutrition = nutritionRows(recipe.nutrition);

  if (nutrition.length > 0) {
    layout.heading("Nutrition per serving");
    layout.table(nutrition, 220);
  }

  if (recipe.notes) {
    layout.heading("Notes");
    layout.text(recipe.notes, body);
  }

  if (recipe.sourceUrl) {
    layout.space(12);
    layout.text(`Source: ${recipe.sourceUrl}`, { font: italic, fontSize: 9, color: COLORS.muted });
  }

  layout.footer(recipe.title);

  return document.save();
}
