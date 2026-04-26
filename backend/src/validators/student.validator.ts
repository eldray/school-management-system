import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().or(z.date()),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().optional(),
  classId: z.string().optional(),
  guardian: z.object({
    name: z.string().min(1, 'Guardian name is required'),
    phone: z.string().min(1, 'Guardian phone is required'),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
  }),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;