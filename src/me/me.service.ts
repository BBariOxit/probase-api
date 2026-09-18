import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MentoringLoadService } from '../lecturers/mentoring-load.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  LECTURER_ONLY_FIELDS,
  type UpdateMyProfileDto,
} from './dto/update-my-profile.dto';

const STUDENT_FIELDS = {
  studentCode: true,
  fullName: true,
  class: true,
  cohort: true,
  phone: true,
  bio: true,
  major: { select: { id: true, name: true, code: true } },
} as const;

const LECTURER_FIELDS = {
  // The public page is keyed on this id, so a lecturer's own screen can offer
  // "xem hồ sơ công khai" without a second lookup.
  id: true,
  lecturerCode: true,
  fullName: true,
  academicTitle: true,
  phone: true,
  bio: true,
  researchInterests: true,
  maxMentoringQuota: true,
} as const;

type LecturerRow = Prisma.LecturerProfileGetPayload<{
  select: typeof LECTURER_FIELDS;
}>;

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly mentoring: MentoringLoadService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        avatarUrl: true,
        mustChangePassword: true,
        createdAt: true,
        studentProfile: { select: STUDENT_FIELDS },
        lecturerProfile: { select: LECTURER_FIELDS },
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    const { studentProfile, lecturerProfile, ...account } = user;

    return {
      ...account,
      fullName: studentProfile?.fullName ?? lecturerProfile?.fullName ?? null,
      student: studentProfile,
      lecturer: await this.withMentoringLoad(lecturerProfile),
    };
  }

  private async withMentoringLoad(lecturer: LecturerRow | null) {
    if (!lecturer) return null;

    const semesterId = await this.mentoring.activeSemesterId();

    // Written out field by field rather than spread minus the quota, so that
    // adding a column to LECTURER_FIELDS never publishes it here by accident —
    // the same rule the student block above is written under, and for the same
    // reason a private note once left through `/auth/me`.
    return {
      id: lecturer.id,
      lecturerCode: lecturer.lecturerCode,
      fullName: lecturer.fullName,
      academicTitle: lecturer.academicTitle,
      phone: lecturer.phone,
      bio: lecturer.bio,
      researchInterests: lecturer.researchInterests,
      mentoring: await this.mentoring.loadForOne(lecturer, semesterId),
    };
  }

  async updateProfile(userId: number, dto: UpdateMyProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        studentProfile: { select: { id: true } },
        lecturerProfile: { select: { id: true } },
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    const { phone, bio, academicTitle, researchInterests } = dto;

    if (user.role === 'STUDENT' && user.studentProfile) {
      // Refused rather than ignored. A request that sets a field the sender is
      // not allowed to set has misunderstood something, and answering "saved"
      // to it teaches the misunderstanding.
      const forbidden = LECTURER_ONLY_FIELDS.filter(
        (field) => dto[field] !== undefined,
      );
      if (forbidden.length > 0) {
        throw new BadRequestException(
          `Hồ sơ sinh viên không có trường: ${forbidden.join(', ')}`,
        );
      }

      await this.prisma.studentProfile.update({
        where: { id: user.studentProfile.id },
        data: {
          ...(phone !== undefined && { phone }),
          ...(bio !== undefined && { bio }),
        },
      });

      return this.getProfile(userId);
    }

    if (user.role === 'LECTURER' && user.lecturerProfile) {
      await this.prisma.lecturerProfile.update({
        where: { id: user.lecturerProfile.id },
        data: {
          ...(phone !== undefined && { phone }),
          ...(bio !== undefined && { bio }),
          ...(academicTitle !== undefined && { academicTitle }),
          ...(researchInterests !== undefined && { researchInterests }),
        },
      });

      return this.getProfile(userId);
    }

    throw new BadRequestException(
      'Tài khoản này không có hồ sơ cá nhân để cập nhật',
    );
  }

  async setAvatar(userId: number, file: Express.Multer.File) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    if (!current) throw new NotFoundException('Không tìm thấy tài khoản');

    const stored = await this.cloudinary.uploadAvatar(file);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: stored.url, avatarPublicId: stored.publicId },
      select: { avatarUrl: true },
    });

    if (current.avatarPublicId) {
      await this.cloudinary.destroy(current.avatarPublicId);
    }

    return user;
  }

  async removeAvatar(userId: number) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    if (!current) throw new NotFoundException('Không tìm thấy tài khoản');

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null, avatarPublicId: null },
    });

    if (current.avatarPublicId) {
      await this.cloudinary.destroy(current.avatarPublicId);
    }

    return { avatarUrl: null };
  }
}
