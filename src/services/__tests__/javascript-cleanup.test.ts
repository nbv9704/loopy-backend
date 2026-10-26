import { JavaScriptExecutor } from '../javascript-executor.service'
import ivm from 'isolated-vm'
jest.mock('isolated-vm', () => ({ __esModule: true, default: { Isolate: jest.fn() } }))

it('disposes an allocated isolate when context setup fails before the student script starts', async () => {
  const dispose = jest.fn()
  jest.mocked(ivm.Isolate).mockImplementation(
    () =>
      ({
        isDisposed: false,
        createContextSync: () => {
          throw new Error('setup failed')
        },
        dispose,
      }) as never
  )
  await expect(new JavaScriptExecutor().execute('1')).rejects.toMatchObject({ statusCode: 503 })
  expect(dispose).toHaveBeenCalledTimes(1)
})
