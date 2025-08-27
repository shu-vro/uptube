import { z } from "zod";

export interface UserSchema {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordRefineContext extends z.RefinementCtx {
  parent: UserSchema;
}

export const userSchema: z.ZodType<UserSchema> = z
  .object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type User = z.infer<typeof userSchema>;
