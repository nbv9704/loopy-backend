import { PracticeService } from '../practice.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('../../utils/contentModeration', () => ({
  validateContent: jest.fn(),
}))

describe('PracticeService destructive actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('archives user-owned practice sets instead of hard-deleting them', async () => {
    const service = new PracticeService()
    const fromMock = supabaseAdmin.from as jest.Mock
    const deleteMock = jest.fn()
    const updateMock = jest.fn().mockReturnThis()
    const eqMock = jest.fn().mockReturnThis()

    const readChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'set-1',
          created_by: 'user-1',
          status: 'published',
          visibility: 'public',
        },
        error: null,
      }),
    }
    const archiveChain = {
      update: updateMock,
      delete: deleteMock,
      eq: eqMock,
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'set-1', status: 'archived' }, error: null }),
    }

    fromMock.mockReturnValueOnce(readChain).mockReturnValueOnce(archiveChain)

    await expect(service.deleteSet('set-1', 'user-1')).resolves.toEqual({
      success: true,
      data: { id: 'set-1', status: 'archived' },
    })

    expect(updateMock).toHaveBeenCalledWith({ status: 'archived' })
    expect(deleteMock).not.toHaveBeenCalled()
    expect(eqMock).toHaveBeenCalledWith('created_by', 'user-1')
    expect(eqMock).toHaveBeenCalledWith('status', 'published')
  })

  it('archives admin practice sets instead of hard-deleting them', async () => {
    const service = new PracticeService()
    const fromMock = supabaseAdmin.from as jest.Mock
    const deleteMock = jest.fn()
    const updateMock = jest.fn().mockReturnThis()
    fromMock.mockReturnValue({
      update: updateMock,
      delete: deleteMock,
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'set-1', status: 'archived' }, error: null }),
    })
    await expect(service.deleteSetForAdmin('set-1', 'admin-1', 'published')).resolves.toEqual({
      success: true,
      data: { id: 'set-1', status: 'archived' },
    })

    expect(updateMock).toHaveBeenCalledWith({ status: 'archived' })
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('hides archived sets from the default admin list', async () => {
    const service = new PracticeService()
    const fromMock = supabaseAdmin.from as jest.Mock
    const neqMock = jest.fn().mockReturnThis()
    const rangeMock = jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })

    fromMock.mockImplementation((table: string) => {
      if (table === 'practice_sets') {
        return {
          select: jest.fn().mockReturnThis(),
          neq: neqMock,
          order: jest.fn().mockReturnThis(),
          range: rangeMock,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    await service.listAllSets({})

    expect(neqMock).toHaveBeenCalledWith('status', 'archived')
  })

  it('does not start new attempts for archived sets', async () => {
    const service = new PracticeService()
    const fromMock = supabaseAdmin.from as jest.Mock

    fromMock.mockImplementation((table: string) => {
      if (table === 'practice_sets') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'set-archived',
              created_by: 'user-1',
              status: 'archived',
              visibility: 'public',
              requirements: {},
            },
            error: null,
          }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    await expect(service.startAttempt('set-archived', 'user-1')).rejects.toThrow(
      'Practice set is archived'
    )
  })
})
