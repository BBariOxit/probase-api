import { cohortFromKhoa, cohortFromStudentCode } from './student-code.util';

const CLASS_CODE = /^CT[\s-]*K(\d{2})[\s-]*([A-Za-z]+)$/;

export interface ParsedClassCode {
  khoa: number;

  cohort: string;

  majorSuffix: string;

  normalised: string;
}

export type ClassCodeCheck =
  | { status: 'absent' }
  | { status: 'ok'; parsed: ParsedClassCode }
  | { status: 'unrecognised'; warning: string }
  | { status: 'contradiction'; error: string };

export function parseClassCode(value: string): ParsedClassCode | null {
  const match = CLASS_CODE.exec(value.trim());
  if (!match) return null;

  const khoa = Number(match[1]);
  const majorSuffix = match[2].toUpperCase();

  return {
    khoa,
    cohort: cohortFromKhoa(khoa),
    majorSuffix,
    normalised: `CTK${khoa}${majorSuffix}`,
  };
}

export function checkClassCode(
  classCode: string | undefined,
  studentCode: string,
): ClassCodeCheck {
  if (!classCode?.trim()) return { status: 'absent' };

  const parsed = parseClassCode(classCode);
  if (!parsed) {
    return {
      status: 'unrecognised',
      warning: `class "${classCode}" is not in the CTK{khoa}{major} form — cohort was taken from the student code and the class was stored as given`,
    };
  }

  const cohortFromCode = cohortFromStudentCode(studentCode);
  if (cohortFromCode && parsed.cohort !== cohortFromCode) {
    return {
      status: 'contradiction',
      error: `class "${classCode}" is intake ${parsed.cohort} but student code "${studentCode}" is intake ${cohortFromCode} — fix whichever is wrong`,
    };
  }

  return { status: 'ok', parsed };
}
