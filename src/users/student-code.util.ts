const STUDENT_CODE = /^(\d{2})(\d{5})$/;

const COHORT_EPOCH = 1976;

function toFullYear(twoDigitYear: string): number {
  const century = Math.floor(new Date().getFullYear() / 100) * 100;
  return century + Number(twoDigitYear);
}

export function cohortFromStudentCode(studentCode: string): string | null {
  const match = STUDENT_CODE.exec(studentCode.trim());
  if (!match) return null;

  return String(toFullYear(match[1]));
}

export function khoaFromCohort(cohort: string): number {
  return Number(cohort) - COHORT_EPOCH;
}

export function cohortFromKhoa(khoa: number): string {
  return String(khoa + COHORT_EPOCH);
}

export function studentCodeMatchesEmail(
  studentCode: string,
  email: string,
): boolean {
  return email.split('@')[0].trim() === studentCode.trim();
}
