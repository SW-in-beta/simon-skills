import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  username: z
    .string()
    .min(3, "사용자명은 3자 이상이어야 합니다")
    .max(20, "사용자명은 20자 이하여야 합니다")
    .regex(/^[a-zA-Z0-9_]+$/, "영문, 숫자, 밑줄만 사용 가능합니다"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export const postCreateSchema = z.object({
  caption: z.string().max(2000, "캡션은 2000자 이하여야 합니다").optional(),
});

export const commentCreateSchema = z.object({
  content: z
    .string()
    .min(1, "댓글을 입력하세요")
    .max(500, "댓글은 500자 이하여야 합니다"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(200).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
