import { createZodDto } from 'nestjs-zod';
import { CreateProposalSchema } from './create-proposal.dto';

export const UpdateProposalSchema = CreateProposalSchema.pick({
  title: true,
  description: true,
  expectedOutcomes: true,
})
  .partial()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    {
      message: 'Không có thay đổi nào để lưu',
    },
  );

export class UpdateProposalDto extends createZodDto(UpdateProposalSchema) {}
