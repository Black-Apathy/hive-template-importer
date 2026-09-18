import path from "node:path";
import XLSX from "xlsx";

const filePath = path.resolve(
  "../sample-data/Residential Template-2026-09-14.xls",
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

function countNonEmpty(column: string) {
  return rows.filter((row) => {
    const value = row[column];

    return value !== null && value !== "";
  }).length;
}

const columnsToCheck = [
  "Comment Text",
  "Multiple Choice Options (comma-separated)",
  "Unit Type Options (numeric answers only, comma-separated)",
  "Recommendation (from list)",
  "Default Value",
  "Default Value 2 (for \"range\" types)",
  "Default Unit Type (for \"number\" and \"range\" types)",
  "Default Location",
  "Default Estimate Min",
  "Default Estimate Max",
  "Locked",
  "Simple Format",
  "Disable Photos",
  "Uses",
  "Default Photo 1",
  "Default Photo 2",
  "Default Photo 3",
  "Default Photo 4",
  "Default Photo 5",
  "Default Photo 6",
  "Default Photo 7",
  "Default Photo 8",
  "Default Photo 9",
  "Default Photo 10",
];

console.log(`Total data rows: ${rows.length}`);

for (const column of columnsToCheck) {
  console.log(`${column}: ${countNonEmpty(column)}`);
}
