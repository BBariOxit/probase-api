import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

const AVATAR_FOLDER = 'probase/avatars';

const DOCUMENT_FOLDER = 'probase/submissions';

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

const DOCUMENT_SIGNATURES: {
  name: string;
  matches: (buf: Buffer) => boolean;
}[] = [
  {
    name: 'pdf',
    matches: (buf) => buf.subarray(0, 5).toString('ascii') === '%PDF-',
  },
  {
    name: 'zip or docx',
    matches: (buf) =>
      buf[0] === 0x50 &&
      buf[1] === 0x4b &&
      (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07),
  },
  {
    // The pre-2007 Word format, still what some faculties circulate templates
    // in. Same compound-file header as .xls, which is harmless here.
    name: 'doc',
    matches: (buf) =>
      buf
        .subarray(0, 8)
        .equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  },
];

const IMAGE_SIGNATURES: { name: string; matches: (buf: Buffer) => boolean }[] =
  [
    {
      name: 'png',
      matches: (buf) =>
        buf
          .subarray(0, 8)
          .equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          ),
    },
    {
      name: 'jpeg',
      matches: (buf) => buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
    },
    {
      name: 'webp',
      matches: (buf) =>
        buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buf.subarray(8, 12).toString('ascii') === 'WEBP',
    },
  ];

export interface StoredImage {
  url: string;
  publicId: string;
}

export interface StoredDocument {
  url: string;
  publicId: string;

  fileName: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly configured: boolean;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');

    this.configured = Boolean(cloudName && apiKey && apiSecret);

    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      this.logger.warn(
        'CLOUDINARY_* not set — avatar upload will be refused until it is',
      );
    }
  }

  async uploadAvatar(file: Express.Multer.File): Promise<StoredImage> {
    // The file is judged before the account is: a request carrying a PDF is
    // malformed whether or not this deployment has credentials, and answering
    // "service unavailable" to it would send someone hunting a configuration
    // problem that is not there.
    assertIsImage(file);
    this.assertConfigured('ảnh');

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: AVATAR_FOLDER,
          // Never let a caller's filename decide the id: it is attacker-chosen
          // text that would end up in a public URL and in a path.
          use_filename: false,
          unique_filename: true,
          overwrite: false,
          resource_type: 'image',
          format: 'webp',
          transformation: [
            { width: 512, height: 512, crop: 'fill', gravity: 'auto' },
          ],
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            return reject(
              error instanceof Error
                ? error
                : new Error('Cloudinary upload failed'),
            );
          }
          resolve(uploaded);
        },
      );

      stream.end(file.buffer);
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async uploadDocument(file: Express.Multer.File): Promise<StoredDocument> {
    assertIsDocument(file);
    this.assertConfigured('tệp');

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: DOCUMENT_FOLDER,
          use_filename: false,
          unique_filename: true,
          overwrite: false,
          resource_type: 'raw',
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            return reject(
              error instanceof Error
                ? error
                : new Error('Cloudinary upload failed'),
            );
          }
          resolve(uploaded);
        },
      );

      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      fileName: safeFileName(file.originalname),
      bytes: file.buffer.length,
    };
  }

  async destroy(
    publicId: string,
    kind: 'image' | 'raw' = 'image',
  ): Promise<void> {
    if (!this.configured) return;

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: kind });
    } catch (error) {
      this.logger.warn(
        `Could not delete ${kind} ${publicId}: ${(error as Error).message}`,
      );
    }
  }

  private assertConfigured(what: 'ảnh' | 'tệp'): void {
    if (this.configured) return;

    throw new ServiceUnavailableException(
      `Chưa cấu hình dịch vụ lưu ${what}. Liên hệ quản trị viên.`,
    );
  }
}

function assertIsDocument(file: Express.Multer.File): void {
  const buffer = file.buffer;

  if (!buffer?.length) {
    throw new BadRequestException('Tệp rỗng, hãy chọn lại file.');
  }

  if (buffer.length > MAX_DOCUMENT_BYTES) {
    throw new BadRequestException('File vượt quá 25MB.');
  }

  if (!DOCUMENT_SIGNATURES.some((signature) => signature.matches(buffer))) {
    throw new BadRequestException(
      'Chỉ nhận file PDF, Word hoặc ZIP. Nếu là mã nguồn, hãy dán link repository thay vì tải lên.',
    );
  }
}

function safeFileName(original: string): string {
  // Both separators, because the name arrives from whatever machine the student
  // uploaded from and a Windows browser sends backslashes.
  const base = original.split(/[\\/]/).pop() ?? 'bai-nop';

  return (
    base
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f<>:"|?*]/g, '')
      .trim()
      .slice(0, 200) || 'bai-nop'
  );
}

function assertIsImage(file: Express.Multer.File): void {
  const buffer = file.buffer;

  if (!buffer?.length) {
    throw new BadRequestException('Tệp rỗng, hãy chọn lại ảnh.');
  }

  if (!IMAGE_SIGNATURES.some((signature) => signature.matches(buffer))) {
    throw new BadRequestException('Chỉ nhận ảnh PNG, JPEG hoặc WebP.');
  }
}
