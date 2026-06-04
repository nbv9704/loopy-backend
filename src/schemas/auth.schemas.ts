import { z } from 'zod'

export const authSchemas = {
  signup: z.object({
    body: z.object({
      email: z.string().email('Email không hợp lệ'),
      password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
      displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').optional(),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Email không hợp lệ'),
      password: z.string().min(1, 'Mật khẩu không được để trống'),
    }),
  }),
}
