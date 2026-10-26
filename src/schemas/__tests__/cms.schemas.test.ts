import {
  cmsFileSchema,
  cmsTransferSchema,
  createCmsItem,
  flattenCmsTransfer,
  updateCmsItem,
} from '../cms.schemas'

const payload = { version: '1.0', language: 'vi', categories: { landing: { title: 'Title' } } }
it('supports v1 value-only import without implicitly replacing type/description', () => {
  const parsed = cmsTransferSchema.parse(payload)
  expect(flattenCmsTransfer(parsed)).toEqual([
    { category: 'landing', key: 'title', value: 'Title' },
  ])
  expect(cmsTransferSchema.parse(parsed)).toEqual(parsed)
})
it('round-trips v2 rich metadata including explicit null', () => {
  const data = {
    version: '2.0',
    language: 'en',
    categories: { landing: { title: { value: '# Title', type: 'markdown', description: null } } },
  }
  expect(cmsTransferSchema.parse(data)).toEqual(data)
  expect(flattenCmsTransfer(cmsTransferSchema.parse(data))[0]).toMatchObject({
    type: 'markdown',
    description: null,
  })
})
it('permits an empty export while refusing an empty import', () => {
  const empty = { ...payload, categories: {} }
  expect(cmsFileSchema.safeParse(empty).success).toBe(true)
  expect(cmsTransferSchema.safeParse(empty).success).toBe(false)
})
it.each(['1.0', '2.0'])(
  'rejects cross-category duplicate keys before import in version %s',
  version => {
    const value =
      version === '1.0' ? 'Logout' : { value: 'Logout', type: 'text', description: null }
    const data = {
      version,
      language: 'vi',
      categories: { nav: { 'nav.logout': value }, common: { 'nav.logout': value } },
    }
    expect(cmsTransferSchema.safeParse(data).success).toBe(false)
  }
)
it.each([
  { ...payload, version: 'future' },
  { ...payload, categories: { ' landing': { title: 'x' } } },
  { ...payload, categories: { landing: { 'title ': 'x' } } },
  { ...payload, categories: { landing: {} } },
  { ...payload, categories: { landing: { title: '   ' } } },
  JSON.parse('{"version":"1.0","language":"vi","categories":{"landing":{"__proto__":"x"}}}'),
])('rejects unsupported, empty or silently lossy file %j', value => {
  expect(cmsTransferSchema.safeParse(value).success).toBe(false)
})
it('requires a revision for updates and rejects whitespace-only values', () => {
  expect(updateCmsItem.safeParse({ value: 'New' }).success).toBe(false)
  expect(updateCmsItem.safeParse({ value: 'New', expectedRevision: 0 }).success).toBe(true)
  expect(
    createCmsItem.safeParse({
      categoryId: '11111111-1111-4111-8111-111111111111',
      key: 'title',
      language: 'vi',
      value: '   ',
    }).success
  ).toBe(false)
})
