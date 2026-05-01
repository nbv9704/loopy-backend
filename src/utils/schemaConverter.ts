import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

/**
 * Converts a single Zod schema to JSON Schema format compatible with OpenAPI 3.0
 *
 * @param zodSchema - The Zod schema to convert
 * @returns JSON Schema object compatible with OpenAPI 3.0
 *
 * @example
 * const zodSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(6)
 * });
 * const jsonSchema = convertZodSchema(zodSchema);
 * // Returns: { type: 'object', properties: { email: { type: 'string', format: 'email' }, ... } }
 */
export function convertZodSchema(zodSchema: z.ZodTypeAny): object {
  // Type assertion to work around TypeScript deep instantiation issue
  return zodToJsonSchema(zodSchema as any, {
    target: 'openApi3',
    $refStrategy: 'none',
  })
}

/**
 * Converts multiple Zod schemas to a components object for OpenAPI specification
 *
 * @param schemas - Record of schema names to Zod schemas
 * @returns Record of schema names to JSON Schema objects
 *
 * @example
 * const schemas = {
 *   LoginRequest: z.object({ email: z.string().email(), password: z.string() }),
 *   User: z.object({ id: z.string().uuid(), email: z.string() })
 * };
 * const components = generateSchemaComponents(schemas);
 * // Returns: { LoginRequest: { type: 'object', ... }, User: { type: 'object', ... } }
 */
export function generateSchemaComponents(
  schemas: Record<string, z.ZodTypeAny>
): Record<string, object> {
  const components: Record<string, object> = {}

  for (const [name, schema] of Object.entries(schemas)) {
    components[name] = convertZodSchema(schema)
  }

  return components
}
