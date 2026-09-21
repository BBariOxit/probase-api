import { Readable } from 'stream';
import ExcelJS, { type CellValue } from 'exceljs';

export interface ParsedImportRow {
  rowNumber: number;

  values: Record<string, string>;
}

const SUPPORTED_EXTENSIONS = new Set(['.xlsx', '.csv']);

/**
 * Read only the first row of the file and return the header labels
 * (trimmed, original casing). Used by the parse step of the import wizard.
 */
export async function extractHeaders(
  buffer: Buffer,
  originalName: string,
): Promise<string[]> {
  const extension = originalName
    .slice(originalName.lastIndexOf('.'))
    .toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error(
      `Unsupported file type "${extension}" — only .xlsx and .csv are accepted`,
    );
  }

  const workbook = new ExcelJS.Workbook();
  if (extension === '.xlsx') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await workbook.xlsx.load(buffer as any);
  } else {
    await workbook.csv.read(Readable.from(buffer));
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    const text = cellToString(cell.value).trim();
    if (text) headers.push(text);
  });

  return headers;
}

export async function parseImportFile(
  buffer: Buffer,
  originalName: string,
): Promise<ParsedImportRow[]> {
  const extension = originalName
    .slice(originalName.lastIndexOf('.'))
    .toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error(
      `Unsupported file type "${extension}" — only .xlsx and .csv are accepted`,
    );
  }

  const workbook = new ExcelJS.Workbook();
  if (extension === '.xlsx') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await workbook.xlsx.load(buffer as any);
  } else {
    await workbook.csv.read(Readable.from(buffer));
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = cellToString(cell.value).trim().toLowerCase();
  });

  const rows: ParsedImportRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const values: Record<string, string> = {};
    let hasValue = false;

    sheet
      .getRow(rowNumber)
      .eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (!header) return;

        const text = cellToString(cell.value).trim();
        if (text) hasValue = true;
        values[header] = text;
      });

    if (hasValue) rows.push({ rowNumber, values });
  }

  return rows;
}

function cellToString(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    if ('richText' in value) {
      return value.richText.map((fragment) => fragment.text).join('');
    }
    if ('text' in value) return String(value.text ?? '');
    if ('result' in value) {
      const { result } = value;
      return typeof result === 'string' || typeof result === 'number'
        ? String(result)
        : '';
    }
    return '';
  }

  return String(value);
}
