/**
 * Fuzzy column-name matcher for the bulk-import wizard.
 *
 * Strategy
 * ─────────
 * 1. Normalise both the file's header labels and every synonym entry:
 *    lower-case, strip all whitespace / hyphens / underscores / dots.
 * 2. Exact match after normalisation → confidence 1.0.
 * 3. No exact match → compute Levenshtein distance and derive
 *    confidence = 1 − distance / max(len_a, len_b).
 * 4. Only suggestions whose confidence ≥ MATCH_THRESHOLD are kept.
 * 5. Each file column can be mapped to at most one system field, and each
 *    system field can receive at most one file column (greedy, highest
 *    confidence wins when there is a tie).
 */

export type SystemField =
  | 'role'
  | 'email'
  | 'fullName'
  | 'code'
  | 'majorCode'
  | 'class'
  | 'academicTitle'
  | 'researchInterests'
  | 'phone'
  | 'bio';

export const ALL_SYSTEM_FIELDS: SystemField[] = [
  'role',
  'email',
  'fullName',
  'code',
  'majorCode',
  'class',
  'academicTitle',
  'researchInterests',
  'phone',
  'bio',
];

/** Human-readable Vietnamese label for each system field (for UI display). */
export const FIELD_LABELS: Record<SystemField, string> = {
  role: 'Vai trò (role)',
  email: 'Email',
  fullName: 'Họ và tên',
  code: 'Mã số (sinh viên / giảng viên)',
  majorCode: 'Mã ngành (SV)',
  class: 'Mã lớp (SV, tùy chọn)',
  academicTitle: 'Học hàm / học vị (GV, tùy chọn)',
  researchInterests: 'Hướng nghiên cứu (GV, tùy chọn)',
  phone: 'Số điện thoại (tùy chọn)',
  bio: 'Giới thiệu bản thân (tùy chọn)',
};

/** Whether the field is mandatory for at least one role. */
export const REQUIRED_FIELDS = new Set<SystemField>([
  'role',
  'email',
  'fullName',
  'code',
]);

// ---------------------------------------------------------------------------
// Synonyms dictionary
// ---------------------------------------------------------------------------

const SYNONYMS: Record<SystemField, string[]> = {
  role: [
    'role',
    'vai trò',
    'loại tài khoản',
    'chức vụ',
    'type',
    'loại',
    'account type',
    'vaitrò',
  ],
  email: [
    'email',
    'mail',
    'thư điện tử',
    'email address',
    'e-mail',
    'địa chỉ email',
    'emailaddress',
    'địachỉemail',
  ],
  fullName: [
    'fullname',
    'họ và tên',
    'tên',
    'họ tên',
    'tên đầy đủ',
    'name',
    'full name',
    'tên sinh viên',
    'tên giảng viên',
    'tên gv',
    'tên sv',
    'họvàtên',
    'tênđầyđủ',
    'hovaten',
  ],
  code: [
    'code',
    'mssv',
    'mã sv',
    'mã sinh viên',
    'student id',
    'mã cb',
    'mã cán bộ',
    'mã giảng viên',
    'id',
    'số hiệu',
    'masv',
    'masinhvien',
    'magv',
    'magiangvien',
    'macb',
    'studentid',
    'lecturercode',
  ],
  majorCode: [
    'majorcode',
    'mã ngành',
    'ngành',
    'major',
    'chuyên ngành',
    'major code',
    'ngành học',
    'manganh',
    'chuyennganh',
  ],
  class: [
    'class',
    'lớp',
    'mã lớp',
    'class code',
    'classcode',
    'malop',
    'lớp học',
    'lophoc',
  ],
  academicTitle: [
    'academictitle',
    'academic title',
    'học hàm',
    'học vị',
    'chức danh',
    'title',
    'hocvi',
    'hocham',
  ],
  researchInterests: [
    'researchinterests',
    'research interests',
    'hướng nghiên cứu',
    'lĩnh vực nghiên cứu',
    'research',
    'lĩnh vực',
    'nghiên cứu',
    'huongnghiencuu',
    'linhvuc',
  ],
  phone: [
    'phone',
    'sdt',
    'số điện thoại',
    'điện thoại',
    'tel',
    'mobile',
    'telephone',
    'sodienthoai',
    'dienthoai',
  ],
  bio: [
    'bio',
    'giới thiệu',
    'mô tả',
    'biography',
    'about',
    'description',
    'giới thiệu bản thân',
    'gioithieu',
  ],
};

// ---------------------------------------------------------------------------
// Levenshtein distance (iterative, O(n·m) time, O(n) space)
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr[j + 1] = Math.min(
        prev[j + 1] + 1, // deletion
        curr[j] + 1, // insertion
        prev[j] + cost, // substitution
      );
    }
    prev.splice(0, prev.length, ...curr);
  }

  return prev[b.length];
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\s\-_.,()/]/g, '');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const MATCH_THRESHOLD = 0.72;

export interface FieldSuggestion {
  /** The file column name that was best-matched. null if no confident match. */
  fileColumn: string | null;
  /** Confidence in [0, 1]. 0 when fileColumn is null. */
  confidence: number;
}

/**
 * Given a list of column headers from the uploaded file, return the best
 * suggested mapping from each system field to a file column.
 *
 * A null fileColumn means the algorithm could not find a confident match
 * and the user must map that field manually.
 */
export function suggestMapping(
  fileHeaders: string[],
): Record<SystemField, FieldSuggestion> {
  const normHeaders = fileHeaders.map((h) => ({
    original: h,
    normalised: normalize(h),
  }));

  const scores: Record<string, number[]> = {};
  for (const field of ALL_SYSTEM_FIELDS) {
    scores[field] = new Array<number>(fileHeaders.length).fill(0);
    const synonymNorms = SYNONYMS[field].map(normalize);

    for (let hi = 0; hi < normHeaders.length; hi++) {
      const { normalised: hn } = normHeaders[hi];
      let best = 0;

      for (const sn of synonymNorms) {
        if (hn === sn) {
          best = 1.0;
          break;
        }
        const maxLen = Math.max(hn.length, sn.length);
        if (maxLen === 0) continue;
        const conf = 1 - levenshtein(hn, sn) / maxLen;
        if (conf > best) best = conf;
      }

      scores[field][hi] = best;
    }
  }

  // Greedy: sort all (field, header, confidence) above threshold descending,
  // then assign each pair at most once.
  const usedHeaders = new Set<number>();
  const result = {} as Record<SystemField, FieldSuggestion>;

  const candidates: Array<{
    field: SystemField;
    hi: number;
    confidence: number;
  }> = [];

  for (const field of ALL_SYSTEM_FIELDS) {
    for (let hi = 0; hi < fileHeaders.length; hi++) {
      const confidence = scores[field][hi];
      if (confidence >= MATCH_THRESHOLD) {
        candidates.push({ field, hi, confidence });
      }
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  const assignedFields = new Set<SystemField>();

  for (const { field, hi, confidence } of candidates) {
    if (assignedFields.has(field) || usedHeaders.has(hi)) continue;
    result[field] = { fileColumn: fileHeaders[hi], confidence };
    assignedFields.add(field);
    usedHeaders.add(hi);
  }

  for (const field of ALL_SYSTEM_FIELDS) {
    if (!result[field]) {
      result[field] = { fileColumn: null, confidence: 0 };
    }
  }

  return result;
}

/**
 * Apply a column mapping to a raw row (header → value dict) to produce the
 * canonical field-keyed object that ImportRowSchema can validate.
 *
 * mapping: Record<SystemField, string | null>
 *   — null means "no file column chosen for this field".
 */
export function applyMapping(
  rawRow: Record<string, string>,
  mapping: Record<SystemField, string | null>,
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const field of ALL_SYSTEM_FIELDS) {
    const fileCol = mapping[field];
    result[field] = fileCol ? (rawRow[fileCol] ?? undefined) : undefined;
  }

  return result;
}
