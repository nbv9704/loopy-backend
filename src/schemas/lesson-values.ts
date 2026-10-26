import { z } from 'zod'
import { isAnswerKeyShape } from '../services/lesson-check/answers'

export const lessonTypeSchema = z.enum([
  'concept',
  'true_false',
  'multiple_choice',
  'fill_blank',
  'short_answer',
  'code_fix',
  'code_output',
  'code_build',
])
export const validationTypeSchema = z.enum(['rule', 'exact', 'regex', 'stdout', 'function'])
export const lessonStepTypeSchema = z.enum([
  'note',
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer',
  'code_prompt',
])
export const answerKeySchema = z
  .unknown()
  .refine(isAnswerKeyShape, 'Đáp án phải là giá trị đơn hoặc mảng các đáp án đơn.')
