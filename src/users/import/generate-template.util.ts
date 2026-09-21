import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface TemplateColumn {
  header: string;
  key: string;
  width: number;
  note?: string;
  example: string | string[];
  required?: boolean;
}

const STUDENT_COLUMNS: TemplateColumn[] = [
  {
    header: 'role',
    key: 'role',
    width: 12,
    note: 'Giá trị cố định: STUDENT',
    example: 'STUDENT',
    required: true,
  },
  {
    header: 'email',
    key: 'email',
    width: 28,
    note: 'Email trường (bắt buộc). Phần đầu email phải trùng với mã sinh viên (VD: 2212345@dlu.edu.vn)',
    example: '2212345@dlu.edu.vn',
    required: true,
  },
  {
    header: 'fullName',
    key: 'fullName',
    width: 28,
    note: 'Họ và tên đầy đủ (bắt buộc)',
    example: 'Nguyễn Văn A',
    required: true,
  },
  {
    header: 'code',
    key: 'code',
    width: 14,
    note: 'Mã sinh viên 7 chữ số (bắt buộc). Phải khớp với phần đầu email.',
    example: '2212345',
    required: true,
  },
  {
    header: 'majorCode',
    key: 'majorCode',
    width: 16,
    note: 'Mã chuyên ngành (bắt buộc). Phải khớp với danh mục Chuyên ngành trong hệ thống.',
    example: 'CNTT',
    required: true,
  },
  {
    header: 'class',
    key: 'class',
    width: 14,
    note: 'Mã lớp (tùy chọn)',
    example: '22CNA',
  },
  {
    header: 'phone',
    key: 'phone',
    width: 16,
    note: 'Số điện thoại (tùy chọn)',
    example: '0912345678',
  },
  {
    header: 'bio',
    key: 'bio',
    width: 40,
    note: 'Giới thiệu bản thân (tùy chọn)',
    example: '',
  },
];

const LECTURER_COLUMNS: TemplateColumn[] = [
  {
    header: 'role',
    key: 'role',
    width: 12,
    note: 'Giá trị cố định: LECTURER',
    example: 'LECTURER',
    required: true,
  },
  {
    header: 'email',
    key: 'email',
    width: 28,
    note: 'Email giảng viên (bắt buộc)',
    example: 'gv.nguyenthib@dlu.edu.vn',
    required: true,
  },
  {
    header: 'fullName',
    key: 'fullName',
    width: 28,
    note: 'Họ và tên đầy đủ (bắt buộc)',
    example: 'Nguyễn Thị B',
    required: true,
  },
  {
    header: 'code',
    key: 'code',
    width: 14,
    note: 'Mã cán bộ (tùy chọn)',
    example: 'GV001',
  },
  {
    header: 'academicTitle',
    key: 'academicTitle',
    width: 20,
    note: 'Học hàm / học vị (tùy chọn). VD: TS, ThS, PGS.TS, GS.TS',
    example: 'TS',
  },
  {
    header: 'researchInterests',
    key: 'researchInterests',
    width: 40,
    note: 'Hướng nghiên cứu (tùy chọn)',
    example: 'Trí tuệ nhân tạo, Học máy',
  },
  {
    header: 'phone',
    key: 'phone',
    width: 16,
    note: 'Số điện thoại (tùy chọn)',
    example: '0987654321',
  },
  {
    header: 'bio',
    key: 'bio',
    width: 40,
    note: 'Giới thiệu bản thân (tùy chọn)',
    example: '',
  },
];

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export type ImportTemplateRole = 'STUDENT' | 'LECTURER';

export async function generateImportTemplate(
  role: ImportTemplateRole,
): Promise<Buffer> {
  const columns = role === 'STUDENT' ? STUDENT_COLUMNS : LECTURER_COLUMNS;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ProBase';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(
    role === 'STUDENT' ? 'Sinh viên' : 'Giảng viên',
  );

  // ── Header row ────────────────────────────────────────────
  sheet.columns = columns.map((col) => ({
    header: col.required ? `${col.header} *` : col.header,
    key: col.key,
    width: col.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' }, // dark slate
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;

  // Add comments to header cells and optional styling.
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    if (!col.required) {
      // Lighter background for optional columns
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' }, // gray-600
      };
    }
    if (col.note) {
      cell.note = col.note;
    }
  });

  // ── Example rows ─────────────────────────────────────────
  const examples = columns.map((col) =>
    Array.isArray(col.example) ? col.example[0] : col.example,
  );
  const example1 = sheet.addRow(examples);
  example1.font = { color: { argb: 'FF6B7280' }, italic: true };
  example1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9FAFB' },
  };

  // A second example row for lecturer so there's more context.
  if (role === 'LECTURER') {
    const ex2 = columns.map((col) =>
      Array.isArray(col.example) ? (col.example[1] ?? '') : '',
    );
    const example2 = sheet.addRow(ex2);
    example2.font = { color: { argb: 'FF6B7280' }, italic: true };
    example2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' },
    };
  }

  // Freeze the header row.
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Serialize ─────────────────────────────────────────────
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
