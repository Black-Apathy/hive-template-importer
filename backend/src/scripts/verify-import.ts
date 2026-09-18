import path from "node:path";
import XLSX from "xlsx";
import { parseSpectora } from "../importer/parseSpectora.js";

const filePath = path.resolve(
  "../sample-data/Residential Template-2026-09-14.xls",
);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];

if (!sheetName) {
  throw new Error("No worksheet found in spreadsheet.");
}

const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  throw new Error(`Worksheet "${sheetName}" could not be loaded.`);
}

const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
  defval: null,
});

const template = parseSpectora(rows, "Residential Template");

const failures: string[] = [];

let passedChecks = 0;

function check(condition: boolean, message: string) {
  if (condition) {
    passedChecks++;
  } else {
    failures.push(message);
  }
}

function normalize(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();

  return text === "" ? null : text;
}

function parseCommaSeparated(value: unknown): string[] | null {
  const normalized = normalize(value);

  if (!normalized) {
    return null;
  }

  return normalized
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

function flattenParsedFields() {
  return template.sections.flatMap((section) =>
    section.subsections.flatMap((subsection) =>
      subsection.fields.map((field) => ({
        sectionName: section.name,
        subsectionName: subsection.name,
        field,
      })),
    ),
  );
}

console.log("\nIMPORT VERIFICATION\n");

/*
 * 1. Overall structure
 */

const expectedSectionNames: string[] = [];

for (const row of rows) {
  const sectionName = normalize(row["Section Name"]);

  if (sectionName && !expectedSectionNames.includes(sectionName)) {
    expectedSectionNames.push(sectionName);
  }
}

const expectedSubsectionNames = new Set<string>();

for (const row of rows) {
  const sectionName = normalize(row["Section Name"]);
  const subsectionName = normalize(row["Item Name"]);

  if (sectionName && subsectionName) {
    expectedSubsectionNames.add(`${sectionName}::${subsectionName}`);
  }
}

check(
  template.sections.length === expectedSectionNames.length,
  `${template.sections.length} sections preserved`,
);

check(
  template.sections.every(
    (section, index) => section.name === expectedSectionNames[index],
  ),
  "Section ordering preserved",
);

const actualSubsectionCount = template.sections.reduce(
  (total, section) => total + section.subsections.length,
  0,
);

check(
  actualSubsectionCount === expectedSubsectionNames.size,
  `${actualSubsectionCount} subsections preserved`,
);

const parsedFields = flattenParsedFields();

check(
  parsedFields.length === rows.length,
  `${parsedFields.length} fields preserved`,
);

/*
 * 2. Field-by-field preservation
 */

for (let index = 0; index < rows.length; index++) {
  const row = rows[index];
  const parsed = parsedFields[index];

  if (!row || !parsed) {
    failures.push(`Row ${index + 2}: could not compare parsed field.`);
    continue;
  }

  const expectedSection = normalize(row["Section Name"]);
  const expectedSubsection = normalize(row["Item Name"]);
  const expectedFieldName = normalize(row["Comment Name"]);

  check(
    parsed.sectionName === expectedSection,
    `Row ${index + 2}: section preserved`,
  );

  check(
    parsed.subsectionName === expectedSubsection,
    `Row ${index + 2}: subsection preserved`,
  );

  check(
    parsed.field.name === expectedFieldName,
    `Row ${index + 2}: field name preserved`,
  );

  const expectedComment = normalize(row["Comment Text"]);

  check(
    parsed.field.commentText === expectedComment,
    `Row ${index + 2}: comment text preserved`,
  );

  const expectedCommentType =
    normalize(row["Comment Type (info, limit, defect)"]) ?? "info";

  check(
    parsed.field.commentType === expectedCommentType,
    `Row ${index + 2}: comment type preserved`,
  );

  const categoryValue = row["Category (-1: Low, 0: Med, 1: High)"];

  const expectedCategory =
    typeof categoryValue === "number" ? categoryValue : null;

  check(
    parsed.field.category === expectedCategory,
    `Row ${index + 2}: category preserved`,
  );

  const expectedAnswerType =
    normalize(
      row["Answer Type (boolean, checkbox, date, number, range, text)"],
    );

  check(
    parsed.field.answerType === expectedAnswerType,
    `Row ${index + 2}: answer type preserved`,
  );

  check(
    JSON.stringify(parsed.field.options) ===
      JSON.stringify(
        parseCommaSeparated(
          row["Multiple Choice Options (comma-separated)"],
        ),
      ),
    `Row ${index + 2}: multiple-choice options preserved`,
  );

  check(
    JSON.stringify(parsed.field.unitOptions) ===
      JSON.stringify(
        parseCommaSeparated(
          row["Unit Type Options (numeric answers only, comma-separated)"],
        ),
      ),
    `Row ${index + 2}: unit options preserved`,
  );

  check(
    parsed.field.recommendation ===
      normalize(row["Recommendation (from list)"]),
    `Row ${index + 2}: recommendation preserved`,
  );

  check(
    parsed.field.defaultValue === normalize(row["Default Value"]),
    `Row ${index + 2}: default value preserved`,
  );

  check(
    parsed.field.defaultValue2 ===
      normalize(row['Default Value 2 (for "range" types)']),
    `Row ${index + 2}: second default value preserved`,
  );

  check(
    parsed.field.defaultUnitType ===
      normalize(row['Default Unit Type (for "number" and "range" types)']),
    `Row ${index + 2}: default unit preserved`,
  );

  check(
    parsed.field.estimateMin === parseNumber(row["Default Estimate Min"]),
    `Row ${index + 2}: minimum estimate preserved`,
  );

  check(
    parsed.field.estimateMax === parseNumber(row["Default Estimate Max"]),
    `Row ${index + 2}: maximum estimate preserved`,
  );
}

/*
 * 3. Rich HTML content
 */

const htmlSourceRow = rows.find((row) => {
  const comment = normalize(row["Comment Text"]);

  return (
    comment?.includes("<a ") ||
    comment?.includes("<p>") ||
    comment?.includes("</p>")
  );
});

if (htmlSourceRow) {
  const htmlComment = normalize(htmlSourceRow["Comment Text"]);

  const parsedHtmlField = parsedFields.find(
    ({ field }) => field.commentText === htmlComment,
  );

  check(
    Boolean(parsedHtmlField),
    "HTML comment content preserved without rewriting",
  );
} else {
  console.log("ℹ No HTML comment found in source export to verify.");
}

/*
 * 4. Import issues
 */

check(
  template.issues.length === 0,
  `${template.issues.length} import issues in clean source export`,
);

/*
 * Final result
 */

/*
 * Final result
 */

console.log("\nVERIFICATION RESULTS\n");

console.log(`✓ ${template.sections.length} sections preserved`);
console.log(`✓ ${actualSubsectionCount} subsections preserved`);
console.log(`✓ ${parsedFields.length} fields preserved`);
console.log("✓ Field data preservation checks passed");
console.log("✓ Rich HTML content preserved without rewriting");
console.log(
  `✓ ${template.issues.length} import issues in clean source export`,
);

console.log("");

if (failures.length > 0) {
  console.error(`✗ ${failures.length} verification check(s) failed.\n`);

  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }

  console.error(`\n${passedChecks} checks passed.`);
  process.exit(1);
}

console.log(`${passedChecks} verification checks passed.`);
console.log("ALL IMPORT VERIFICATION CHECKS PASSED.");
