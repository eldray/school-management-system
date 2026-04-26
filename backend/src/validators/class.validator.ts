import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  gradeLevel: z.number().int().min(1, 'Grade level must be at least 1').max(12, 'Grade level cannot exceed 12'),
  stream: z.string().optional(),
  teacherProfileId: z.string().optional(),
});

export const updateClassSchema = createClassSchema.partial();

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;