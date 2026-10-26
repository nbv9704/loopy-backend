import { readAllRows } from '../read-all-rows'

it('advances by the actual row cap until the exact count is reached', async () => {
  const page = jest
    .fn()
    .mockResolvedValueOnce({ data: [{ id: 'a' }], count: 2, error: null })
    .mockResolvedValueOnce({ data: [{ id: 'b' }], count: 2, error: null })
  await expect(readAllRows(page, 'unavailable')).resolves.toEqual([{ id: 'a' }, { id: 'b' }])
  expect(page.mock.calls).toEqual([
    [0, 499],
    [1, 500],
  ])
})
it.each(
  [
    [{ data: null, count: 0, error: null }],
    [{ data: [], count: null, error: null }],
    [{ data: [], count: 1, error: null }],
    [{ data: [], count: 0, error: { message: 'private' } }],
    [
      { data: [{ id: 'a' }], count: 2, error: null },
      { data: [{ id: 'a' }], count: 2, error: null },
    ],
    [
      { data: [{ id: 'a' }], count: 2, error: null },
      { data: [{ id: 'b' }], count: 3, error: null },
    ],
  ].map(results => [results])
)('does not return incomplete or overlapping pages (%#)', async results => {
  let index = 0
  await expect(readAllRows(async () => results[index++], 'unavailable')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
    message: 'unavailable',
  })
})
