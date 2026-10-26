import * as reads from './cms/read'
import * as writes from './cms/mutations'
import * as transfer from './cms/transfer'

/** Compatibility facade: reads, conditional mutations and file transfers have separate owners. */
export class AdminContentService {
  static getContentItems = reads.getContentItems
  static getContentItem = reads.getContentItem
  static getCategories = reads.getCategories
  static createContentItem = writes.createContentItem
  static updateContentItem = writes.updateContentItem
  static deleteContentItem = writes.deleteContentItem
  static exportContent = transfer.exportContent
  static importContent = transfer.importContent
}
export type { ContentItem } from './cms/model'
