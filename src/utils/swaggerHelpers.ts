import { convertZodSchema } from './schemaConverter'
import { authSchemas } from '../schemas/auth.schemas'
import { contentSchemas } from '../schemas/content.schemas'
import { exerciseSchemas } from '../schemas/exercise.schemas'
import { profileSchemas } from '../schemas/profile.schemas'
import { progressSchemas } from '../schemas/progress.schemas'

/**
 * Generates OpenAPI schema components from existing Zod schemas
 *
 * This function extracts Zod schemas from the schema files and converts them
 * to OpenAPI-compatible JSON Schema format. The schemas are mapped to meaningful
 * component names that can be referenced in API documentation.
 *
 * @returns Record of schema component names to OpenAPI schema objects
 *
 * @example
 * const schemas = generateSchemasFromZod();
 * // Returns: { LoginRequest: {...}, SignupRequest: {...}, User: {...}, ... }
 */
export function generateSchemasFromZod(): Record<string, object> {
  const components: Record<string, object> = {}

  // Extract body schemas from auth schemas
  if (authSchemas.login?.shape?.body) {
    components.LoginRequest = convertZodSchema(authSchemas.login.shape.body)
  }

  if (authSchemas.signup?.shape?.body) {
    components.SignupRequest = convertZodSchema(authSchemas.signup.shape.body)
  }

  // Extract body schemas from profile schemas
  if (profileSchemas.update?.shape?.body) {
    components.ProfileUpdateRequest = convertZodSchema(profileSchemas.update.shape.body)
  }

  // Extract body schemas from progress schemas
  if (progressSchemas.update?.shape?.body) {
    components.ProgressUpdateRequest = convertZodSchema(progressSchemas.update.shape.body)
  }

  // Extract body schemas from exercise schemas
  if (exerciseSchemas.submit?.shape?.body) {
    components.ExerciseSubmitRequest = convertZodSchema(exerciseSchemas.submit.shape.body)
  }

  // Extract body schemas from content schemas
  if (contentSchemas.documentationTechnology?.shape?.body) {
    components.DocumentationTechnologyRequest = convertZodSchema(
      contentSchemas.documentationTechnology.shape.body
    )
  }

  if (contentSchemas.updateDocumentationTechnology?.shape?.body) {
    components.DocumentationTechnologyUpdateRequest = convertZodSchema(
      contentSchemas.updateDocumentationTechnology.shape.body
    )
  }

  if (contentSchemas.documentationLink?.shape?.body) {
    components.DocumentationLinkRequest = convertZodSchema(
      contentSchemas.documentationLink.shape.body
    )
  }

  if (contentSchemas.updateDocumentationLink?.shape?.body) {
    components.DocumentationLinkUpdateRequest = convertZodSchema(
      contentSchemas.updateDocumentationLink.shape.body
    )
  }

  if (contentSchemas.landingFeature?.shape?.body) {
    components.LandingFeatureRequest = convertZodSchema(contentSchemas.landingFeature.shape.body)
  }

  if (contentSchemas.updateLandingFeature?.shape?.body) {
    components.LandingFeatureUpdateRequest = convertZodSchema(
      contentSchemas.updateLandingFeature.shape.body
    )
  }

  if (contentSchemas.landingStat?.shape?.body) {
    components.LandingStatRequest = convertZodSchema(contentSchemas.landingStat.shape.body)
  }

  if (contentSchemas.updateLandingStat?.shape?.body) {
    components.LandingStatUpdateRequest = convertZodSchema(
      contentSchemas.updateLandingStat.shape.body
    )
  }

  if (contentSchemas.landingLanguage?.shape?.body) {
    components.LandingLanguageRequest = convertZodSchema(contentSchemas.landingLanguage.shape.body)
  }

  if (contentSchemas.updateLandingLanguage?.shape?.body) {
    components.LandingLanguageUpdateRequest = convertZodSchema(
      contentSchemas.updateLandingLanguage.shape.body
    )
  }

  if (contentSchemas.landingHowItWorks?.shape?.body) {
    components.LandingHowItWorksRequest = convertZodSchema(
      contentSchemas.landingHowItWorks.shape.body
    )
  }

  if (contentSchemas.updateLandingHowItWorks?.shape?.body) {
    components.LandingHowItWorksUpdateRequest = convertZodSchema(
      contentSchemas.updateLandingHowItWorks.shape.body
    )
  }

  if (contentSchemas.navigationItem?.shape?.body) {
    components.NavigationItemRequest = convertZodSchema(contentSchemas.navigationItem.shape.body)
  }

  if (contentSchemas.updateNavigationItem?.shape?.body) {
    components.NavigationItemUpdateRequest = convertZodSchema(
      contentSchemas.updateNavigationItem.shape.body
    )
  }

  if (contentSchemas.reorder?.shape?.body) {
    components.ReorderRequest = convertZodSchema(contentSchemas.reorder.shape.body)
  }

  if (contentSchemas.statusUpdate?.shape?.body) {
    components.StatusUpdateRequest = convertZodSchema(contentSchemas.statusUpdate.shape.body)
  }

  return components
}
