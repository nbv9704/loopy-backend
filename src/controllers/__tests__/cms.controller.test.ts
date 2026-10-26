import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { AdminContentService } from '../../services/admin-content.service'
import { updateContentItem, deleteContentItem, getContentItem } from '../admin/content.controller'
import { getPublicContentByKey } from '../content.controller'
import * as publicCms from '../../services/cms/public-read'
import { AppError } from '../../middleware/errorHandler'

jest.mock('../../services/admin-content.service', () => ({
  AdminContentService: {
    updateContentItem: jest.fn(),
    deleteContentItem: jest.fn(),
    getContentItem: jest.fn(),
  },
}))
jest.mock('../../services/cms/public-read', () => ({ getPublicContentByKey: jest.fn() }))
beforeEach(() => jest.resetAllMocks())
const req = () =>
  ({
    user: { id: 'admin' },
    params: { id: 'item', key: 'title' },
    body: { value: 'New', expectedRevision: 2 },
    query: { language: 'vi', revision: 2 },
  }) as unknown as AuthRequest
const res = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() }) as unknown as Response
it('passes the expected revision to a conditional delete and returns the saved acknowledgement', async () => {
  const response = res()
  const next = jest.fn()
  jest
    .mocked(AdminContentService.deleteContentItem)
    .mockResolvedValue({ id: 'item', deleted: true })
  await deleteContentItem(req(), response, next)
  expect(AdminContentService.deleteContentItem).toHaveBeenCalledWith('item', 'admin', 2)
  expect(response.json).toHaveBeenCalledWith({ success: true, data: { id: 'item', deleted: true } })
})
it('preserves a typed update conflict rather than guessing status from error text', async () => {
  const response = res()
  const next = jest.fn()
  const conflict = new AppError(409, 'CMS_CONFLICT', 'Reload required')
  jest.mocked(AdminContentService.updateContentItem).mockRejectedValue(conflict)
  await updateContentItem(req(), response, next)
  expect(next).toHaveBeenCalledWith(conflict)
  expect(response.json).not.toHaveBeenCalled()
})
it('uses the public read service rather than the admin revision-dependent reader', async () => {
  const response = res()
  const next = jest.fn()
  jest.mocked(publicCms.getPublicContentByKey).mockResolvedValue({
    id: 'item',
    key: 'title',
    value: 'Public',
  } as never)
  await getPublicContentByKey(req(), response, next)
  expect(publicCms.getPublicContentByKey).toHaveBeenCalledWith('title', 'vi')
  expect(response.json).toHaveBeenCalledWith({
    success: true,
    data: { id: 'item', key: 'title', value: 'Public' },
  })
})
it('requires admin identity before loading a single editor item', async () => {
  const input = req()
  input.user = undefined
  const next = jest.fn()
  await getContentItem(input, res(), next)
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  expect(AdminContentService.getContentItem).not.toHaveBeenCalled()
})
