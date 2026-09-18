import path from "node:path";
import XLSX from "xlsx";
import { parseSpectora } from "../importer/parseSpectora.js";

const filePath = path.resolve(
  "/tmp/spectora-failure-test.xls",
);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];

if (!sheetName) {
  throw new Error("No sheets found in workbook");
}

const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  throw new Error(`Sheet "${sheetName}" not found`);
}

const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
  defval: null,
});

const template = parseSpectora(rows, "Residential Template");

console.log(`Sections: ${template.sections.length}`);

// for (const section of template.sections) {
//   console.log(
//     `${section.order}: ${section.name} (${section.subsections.length} subsections)`,
//   );
// }

for (const section of template.sections.slice(0, 3)) {
  console.log(`\nSection: ${section.name}`);

  for (const subsection of section.subsections.slice(0, 2)) {
    console.log(`  Subsection: ${subsection.name}`);

    for (const field of subsection.fields.slice(0, 4)) {
      console.log(`    Field: ${field.name}`);
      console.log(`      Type: ${field.answerType}`);
      console.log(`      Comment Type: ${field.commentType}`);
      console.log(`      Category: ${field.category}`);
      console.log(`      Comment: ${field.commentText ? "present" : "none"}`);
      console.log(`      Options: ${field.options?.length ?? 0}`);
      console.log(`      Units: ${field.unitOptions?.length ?? 0}`);
      console.log(`      Recommendation: ${field.recommendation ?? "none"}`);
      console.log(`      Default: ${field.defaultValue ?? "none"}`);
      console.log(`      Estimate: ${field.estimateMin} - ${field.estimateMax}`);
      console.log(`      Locked: ${field.locked}`);
      console.log(`      Simple Format: ${field.simpleFormat}`);
      console.log(`      Photos: ${field.photos.length}`);
    }
  }
}

console.log("\nImport issues:");

for (const issue of template.issues) {
  console.log(`\nRow ${issue.sourceRow}: ${issue.type}`);
  console.log(`Message: ${issue.message}`);
  console.log("Source data:");
  console.dir(issue.sourceData, { depth: null });
}
