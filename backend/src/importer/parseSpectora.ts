import type {
  ParsedField,
  ParsedSection,
  ParsedSubsection,
  ParsedTemplate,
} from "./types.js";

type SpectoraRow = Record<string, unknown>;
const SUPPORTED_ANSWER_TYPES = new Set([
  "boolean",
  "checkbox",
  "number",
  "text",
]);

export function parseSpectora(
  rows: SpectoraRow[],
  templateName: string,
): ParsedTemplate {
  const sections: ParsedSection[] = [];
  const issues: ParsedTemplate["issues"] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    if (!row) {
      continue;
    }

    const sectionName = String(row["Section Name"] ?? "").trim();
    const subsectionName = String(row["Item Name"] ?? "").trim();
    const fieldName = String(row["Comment Name"] ?? "").trim();

    if (!sectionName || !subsectionName || !fieldName) {
      const missingFields: string[] = [];

      if (!sectionName) {
        missingFields.push("Section Name");
      }

      if (!subsectionName) {
        missingFields.push("Item Name");
      }

      if (!fieldName) {
        missingFields.push("Comment Name");
      }

      issues.push({
        sourceRow: rowIndex + 2,
        type: "missing_from_export",
        message: `Required field(s) missing: ${missingFields.join(", ")}`,
        sourceData: row,
      });

      continue;
    }

    let section = sections.find(
      (existingSection) => existingSection.name === sectionName,
    );

    if (!section) {
      section = {
        name: sectionName,
        order: sections.length,
        subsections: [],
      };

      sections.push(section);
    }

    let subsection = section.subsections.find(
      (existingSubsection) => existingSubsection.name === subsectionName,
    );

    if (!subsection) {
      subsection = {
        name: subsectionName,
        order: section.subsections.length,
        fields: [],
      };

      section.subsections.push(subsection);
    }

    const answerType =
      String(
        row["Answer Type (boolean, checkbox, date, number, range, text)"] ?? "",
      ).trim() || null;

    if (answerType && !SUPPORTED_ANSWER_TYPES.has(answerType)) {
      issues.push({
        sourceRow: rowIndex + 2,
        type: "unsupported_by_importer",
        message: `Unsupported answer type: ${answerType}`,
        sourceData: row,
      });
    }

    const field: ParsedField = {
      name: fieldName,
      commentText: String(row["Comment Text"] ?? "").trim() || null,

      commentType: String(
        row["Comment Type (info, limit, defect)"] ?? "info",
      ).trim(),

      category:
        typeof row["Category (-1: Low, 0: Med, 1: High)"] === "number"
          ? row["Category (-1: Low, 0: Med, 1: High)"]
          : null,

      answerType,
      order: Number(row["Order (w/i item)"] ?? subsection.fields.length),

      options: parseCommaSeparated(
        row["Multiple Choice Options (comma-separated)"],
      ),

      unitOptions: parseCommaSeparated(
        row["Unit Type Options (numeric answers only, comma-separated)"],
      ),
      recommendation:
        String(row["Recommendation (from list)"] ?? "").trim() || null,

      defaultValue: String(row["Default Value"] ?? "").trim() || null,

      defaultValue2:
        String(row['Default Value 2 (for "range" types)'] ?? "").trim() || null,

      defaultUnitType:
        String(
          row['Default Unit Type (for "number" and "range" types)'] ?? "",
        ).trim() || null,

      estimateMin: parseNumber(row["Default Estimate Min"]),

      estimateMax: parseNumber(row["Default Estimate Max"]),

      locked: parseBoolean(row["Locked"]),
      simpleFormat: parseBoolean(row["Simple Format"]),
      disablePhotos: parseBoolean(row["Disable Photos"]),
      uses: String(row["Uses"] ?? "").trim() || null,

      photos: parsePhotos(row),
    };

    subsection.fields.push(field);
  }

  return {
    name: templateName,
    source: "Spectora",
    sections,
    issues,
  };
}

function parseCommaSeparated(value: unknown): string[] | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    return normalized === "true" || normalized === "1";
  }

  return false;
}

function parsePhotos(row: SpectoraRow): ParsedField["photos"] {
  const photos: ParsedField["photos"] = [];

  for (let i = 1; i <= 10; i++) {
    const url = row[`Default Photo ${i}`];
    const caption = row[`Default Photo ${i} Caption`];

    if (typeof url !== "string" || url.trim() === "") {
      continue;
    }

    photos.push({
      url: url.trim(),
      caption:
        typeof caption === "string" && caption.trim() !== ""
          ? caption.trim()
          : null,
    });
  }

  return photos;
}
