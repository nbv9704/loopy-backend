import { JavaScriptExecutor } from '../javascript-executor.service'

const executor = new JavaScriptExecutor()
it('keeps host callback references out of the student global scope', async () => {
  const result = await executor.execute(
    '[typeof _logCallback, typeof _errorCallback, typeof _warnCallback]'
  )
  expect(result.output).toEqual(['undefined', 'undefined', 'undefined'])
})
it('fails rather than certifying truncated console output', async () => {
  const result = await executor.execute('for(let n=0;n<1001;n++) console.log("x")')
  expect(result.error).toBe('Output limit exceeded')
  expect(result.stdout.length).toBeLessThan(64 * 1024)
})
it('bounds UTF-8 bytes as well as line counts', async () => {
  const result = await executor.execute('for(let n=0;n<40;n++) console.log("漢".repeat(1000))')
  expect(result.error).toBe('Output limit exceeded')
  expect(Buffer.byteLength(result.stdout)).toBeLessThanOrEqual(64 * 1024)
})
it('rejects oversized values before copying them into the host heap', async () => {
  const result = await executor.execute('"x".repeat(100000)')
  expect(result.error).toContain('Result limit exceeded')
  expect(result.output).toBeNull()
})
it('serializes with a captured intrinsic even if submitted code changes JSON.stringify', async () => {
  const result = await executor.execute('JSON.stringify=()=>"false"; ({actual: true})')
  expect(result.output).toEqual({ actual: true })
})
it('remains usable after rejected output and runtime errors', async () => {
  await executor.execute('throw new Error("student error")')
  expect(await executor.execute('console.warn("warning"); 0')).toMatchObject({
    output: 0,
    error: null,
    stderr: 'Warning: warning',
  })
})

it('preserves non-JSON primitives without silently converting them to null', async () => {
  const result = await executor.execute('[Infinity, NaN, -0, undefined, 12n]')
  expect(result.output).toEqual([Infinity, NaN, -0, undefined, 12n])
})
it('does not let prototype toJSON hooks forge or enlarge the copied result', async () => {
  const result = await executor.execute(
    'Array.prototype.toJSON=()=>"forged"; Object.prototype.toJSON=()=>"forged"; ({actual: [1, false]})'
  )
  expect(result.output).toEqual({ actual: [1, false] })
})
