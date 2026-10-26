import { z } from 'zod'
import { convertZodSchema } from '../schemaConverter'
import { generateSchemasFromZod } from '../swaggerHelpers'

it('describes request inputs and keeps validation active after native schema conversion', () => {
  const schema = z.object({ title: z.string().min(1), count: z.string().transform(Number) })
  expect(convertZodSchema(schema)).toMatchObject({
    type: 'object',
    required: ['title', 'count'],
    properties: { title: { type: 'string', minLength: 1 }, count: { type: 'string' } },
  })
  expect(schema.safeParse({ title: '', count: '2' }).success).toBe(false)
})
it('generates all application documentation schemas without the legacy Zod3 converter', () => {
  expect(generateSchemasFromZod()).toMatchObject({
    LoginRequest: { type: 'object' },
    ProfileUpdateRequest: { type: 'object' },
  })
})
