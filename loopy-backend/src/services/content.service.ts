import { supabase } from '../db/supabase'
import { SupportedLanguage } from '../utils/language'

/**
 * ContentService - Public content retrieval service
 *
 * Provides read-only access to published content for public consumption.
 * All methods filter by status='published' and order by display_order.
 * Implements Requirements 3.1-3.11 for public content API.
 * Supports multilingual content retrieval with automatic fallback.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DocumentationTechnology {
  id: string
  name: string
  icon: string
  language: string
  category: string
  linkCount: number
}

interface DocumentationLink {
  id: string
  title: string
  url: string
  type: 'docs' | 'video' | 'article'
  description?: string
}

interface LandingFeature {
  id: string
  icon: string
  title: string
  description: string
  colorGradient: string
}

interface LandingStat {
  id: string
  icon: string
  value: string
  label: string
}

interface LandingLanguage {
  id: string
  name: string
  lessonCount: number
  color: string
  description: string
  icon: string
}

interface HowItWorksStep {
  id: string
  stepNumber: string
  title: string
  description: string
  icon: string
}

interface NavigationItem {
  id: string
  path: string
  label: string
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const contentService = {
  /**
   * Get all published documentation technologies with link counts
   * Requirement 3.1: Return all published technologies ordered by display_order
   * Multilingual: Supports language parameter with automatic fallback
   *
   * @param language - Target language ('vi' or 'en'), defaults to 'vi'
   * @returns Array of documentation technologies with link counts
   */
  async getDocumentationTechnologies(
    language: SupportedLanguage = 'vi'
  ): Promise<DocumentationTechnology[]> {
    const { data, error } = await supabase
      .from('documentation_technologies')
      .select('id, name, name_en, icon, language, category, documentation_links(count)')
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch documentation technologies: ${error.message}`)
    }

    // Apply fallback logic in application code
    return (data || []).map((tech: any) => ({
      id: tech.id,
      name: language === 'en' ? tech.name_en || tech.name : tech.name,
      icon: tech.icon,
      language: tech.language,
      category: tech.category,
      linkCount: tech.documentation_links?.[0]?.count || 0,
    }))
  },

  /**
   * Get all documentation links for a specific technology
   * Requirement 3.2: Return all links for a technology ordered by display_order
   * Multilingual: Supports language parameter with automatic fallback
   *
   * @param technologyId - UUID of the technology
   * @param language - Target language ('vi' or 'en'), defaults to 'vi'
   * @returns Array of documentation links
   */
  async getDocumentationLinks(
    technologyId: string,
    language: SupportedLanguage = 'vi'
  ): Promise<DocumentationLink[]> {
    const { data, error } = await supabase
      .from('documentation_links')
      .select('id, title, title_en, url, type, description, description_en')
      .eq('technology_id', technologyId)
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch documentation links: ${error.message}`)
    }

    // Apply fallback logic in application code
    return (data || []).map((link: any) => ({
      id: link.id,
      title: language === 'en' ? link.title_en || link.title : link.title,
      url: link.url,
      type: link.type,
      description: language === 'en' ? link.description_en || link.description : link.description,
    }))
  },

  /**
   * Get all published landing page features
   * Requirement 3.3: Return all published features ordered by display_order
   * Multilingual: Supports language parameter with automatic fallback
   *
   * @param language - Target language ('vi' or 'en'), defaults to 'vi'
   * @returns Array of landing page features
   */
  async getLandingFeatures(language: SupportedLanguage = 'vi'): Promise<LandingFeature[]> {
    const { data, error } = await supabase
      .from('landing_features')
      .select('id, icon, title, title_en, description, description_en, color_gradient')
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch landing features: ${error.message}`)
    }

    // Apply fallback logic and transform snake_case to camelCase
    return (data || []).map((feature: any) => ({
      id: feature.id,
      icon: feature.icon,
      title: language === 'en' ? feature.title_en || feature.title : feature.title,
      description:
        language === 'en' ? feature.description_en || feature.description : feature.description,
      colorGradient: feature.color_gradient,
    }))
  },

  /**
   * Get all published landing page statistics
   * Requirement 3.4: Return all published stats ordered by display_order
   * Multilingual: Supports language parameter with automatic fallback
   *
   * @param language - Target language ('vi' or 'en'), defaults to 'vi'
   * @returns Array of landing page statistics
   */
  async getLandingStats(language: SupportedLanguage = 'vi'): Promise<LandingStat[]> {
    const { data, error } = await supabase
      .from('landing_stats')
      .select('id, icon, value, label, label_en')
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch landing stats: ${error.message}`)
    }

    // Apply fallback logic in application code
    return (data || []).map((stat: any) => ({
      id: stat.id,
      icon: stat.icon,
      value: stat.value,
      label: language === 'en' ? stat.label_en || stat.label : stat.label,
    }))
  },

  /**
   * Get all published landing page languages
   * Requirement 3.5: Return all published languages ordered by display_order
   * Multilingual: Supports language parameter with automatic fallback
   *
   * @param language - Target language ('vi' or 'en'), defaults to 'vi'
   * @returns Array of programming languages
   */
  async getLandingLanguages(language: SupportedLanguage = 'vi'): Promise<LandingLanguage[]> {
    const { data, error } = await supabase
      .from('landing_languages')
      .select('id, name, name_en, lesson_count, color, description, description_en, icon')
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch landing languages: ${error.message}`)
    }

    // Apply fallback logic and transform snake_case to camelCase
    return (data || []).map((lang: any) => ({
      id: lang.id,
      name: language === 'en' ? lang.name_en || lang.name : lang.name,
      lessonCount: lang.lesson_count,
      color: lang.color,
      description: language === 'en' ? lang.description_en || lang.description : lang.description,
      icon: lang.icon,
    }))
  },

  /**
   * Get all published how-it-works steps
   * Requirement 3.6: Return all published steps ordered by display_order
   * Multilingual: Supports language parameter with automatic fallback
   *
   * @param language - Target language ('vi' or 'en'), defaults to 'vi'
   * @returns Array of how-it-works steps
   */
  async getHowItWorks(language: SupportedLanguage = 'vi'): Promise<HowItWorksStep[]> {
    const { data, error } = await supabase
      .from('landing_how_it_works')
      .select('id, step_number, title, title_en, description, description_en, icon')
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch how-it-works steps: ${error.message}`)
    }

    // Apply fallback logic and transform snake_case to camelCase
    return (data || []).map((step: any) => ({
      id: step.id,
      stepNumber: step.step_number,
      title: language === 'en' ? step.title_en || step.title : step.title,
      description: language === 'en' ? step.description_en || step.description : step.description,
      icon: step.icon,
    }))
  },

  /**
   * Get navigation items for a specific location (header or footer)
   * Requirement 3.7: Return published navigation items for location ordered by display_order
   * Requirement 6.4: Filter by location parameter
   * Multilingual: Supports language parameter with automatic fallback
   *
   * @param location - 'header' or 'footer'
   * @param language - Target language ('vi' or 'en'), defaults to 'vi'
   * @returns Array of navigation items
   */
  async getNavigation(
    location: 'header' | 'footer',
    language: SupportedLanguage = 'vi'
  ): Promise<NavigationItem[]> {
    const { data, error } = await supabase
      .from('navigation_items')
      .select('id, path, label, label_en')
      .eq('location', location)
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch navigation items: ${error.message}`)
    }

    // Apply fallback logic in application code
    return (data || []).map((item: any) => ({
      id: item.id,
      path: item.path,
      label: language === 'en' ? item.label_en || item.label : item.label,
    }))
  },
}
