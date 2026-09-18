import XLSX from "xlsx";

const inputPath = "../sample-data/Residential Template-2026-09-14.xls";
const outputPath = "/tmp/spectora-failure-test.xls";

const workbook = XLSX.readFile(inputPath);

const firstSheetName = workbook.SheetNames[0];

if (!firstSheetName) {
  throw new Error("No worksheet found");
}

const worksheet = workbook.Sheets[firstSheetName];

if (!worksheet) {
  throw new Error("Could not read worksheet");
}

const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
  defval: null,
});

if (rows.length === 0) {
  throw new Error("No rows found");
}

// Change one otherwise-valid field into an unsupported answer type.
const firstRow = rows[0];

if (!firstRow) {
  throw new Error("No data rows found in source export");
}

firstRow["Answer Type (boolean, checkbox, date, number, range, text)"] = "date";

const newWorksheet = XLSX.utils.json_to_sheet(rows);

workbook.Sheets[firstSheetName] = newWorksheet;

XLSX.writeFile(workbook, outputPath);

console.log(`Created failure test file: ${outputPath}`);
console.log(`Modified row: 2`);
console.log(`Answer Type: date`);
