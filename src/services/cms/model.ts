import { errors } from '../../middleware/errorHandler'

export interface ContentItem {
  id: string
  categoryId: string
  key: string
  language: 'vi' | 'en'
  value: string
  description?: string | null
  type: 'text' | 'markdown' | 'html'
  revision: number
  createdAt: Date | null
  updatedAt: Date | null
  createdBy?: string
  updatedBy?: string
}
export const cmsColumns =
  'id,category_id,key,language,value,description,type,revision,created_at,updated_at,created_by,updated_by'
export const cmsReadColumns = cmsColumns
  .split(',')
  .filter(column => column !== 'revision')
  .join(',')
const mapCmsFields = (row: Record<string, any>) => ({
  id: row.id as string,
  categoryId: row.category_id as string,
  key: row.key as string,
  language: row.language as ContentItem['language'],
  value: row.value as string,
  description: row.description as string | null | undefined,
  type: row.type as ContentItem['type'],
  createdAt: row.created_at ? new Date(row.created_at) : null,
  updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  createdBy: row.created_by as string | undefined,
  updatedBy: row.updated_by as string | undefined,
})
export function mapReadOnlyCmsItem(row: Record<string, any>) {
  if (!row.id) throw errors.databaseError('Không xác nhận được nội dung CMS.')
  return { ...mapCmsFields(row), revision: null }
}
export function mapCmsItem(row: Record<string, any>): ContentItem {
  if (!row.id || !Number.isSafeInteger(row.revision) || row.revision < 0) {
    throw errors.databaseError('Không xác nhận được phiên bản nội dung CMS. Kiểm tra migration052.')
  }
  return {
    ...mapCmsFields(row),
    revision: row.revision,
  }
}
