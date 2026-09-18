export type ImportIssueType =
  | "missing_from_export"
  | "unsupported_by_importer";

export interface ParsedPhoto {
  url: string;
  caption: string | null;
}

export interface ParsedField {
  name: string;
  commentText: string | null;
  commentType: string;
  category: number | null;
  answerType: string | null;
  order: number;

  options: string[] | null;
  unitOptions: string[] | null;
  recommendation: string | null;

  defaultValue: string | null;
  defaultValue2: string | null;
  defaultUnitType: string | null;

  estimateMin: number | null;
  estimateMax: number | null;

  locked: boolean;
  simpleFormat: boolean;
  disablePhotos: boolean;
  uses: string | null;

  photos: ParsedPhoto[];
}

export interface ParsedSubsection {
  name: string;
  order: number;
  fields: ParsedField[];
}

export interface ParsedSection {
  name: string;
  order: number;
  subsections: ParsedSubsection[];
}

export interface ParsedImportIssue {
  sourceRow: number;
  type: ImportIssueType;
  message: string;
  sourceData: Record<string, unknown> | null;
}

export interface ParsedTemplate {
  name: string;
  source: string;
  sections: ParsedSection[];
  issues: ParsedImportIssue[];
}
