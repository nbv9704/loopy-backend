import { z } from 'zod'

const MAX_AVATAR_LENGTH = 200 * 1024
const imageData = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/

export const avatarUrlSchema = z
  .string()
  .max(MAX_AVATAR_LENGTH, 'Ảnh đại diện quá lớn. Vui lòng chọn ảnh nhỏ hơn.')
  .refine(value => {
    if (
      !value ||
      /^\/images\/avatar\/[a-z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(value) ||
      /^preset:[a-z0-9_-]+$/i.test(value)
    )
      return true
    if (imageData.test(value)) return true
    try {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
    } catch {
      return false
    }
  }, 'Ảnh đại diện phải là ảnh PNG, JPEG, WebP hoặc đường dẫn ảnh hợp lệ.')
