/** Bound host-side console accumulation; crossing any limit makes the run unsuccessful. */
export class CapturedOutput {
  private lines: string[] = []
  private bytes = 0
  truncated = false
  write(value: unknown, prefix = '') {
    if (this.truncated) return
    const line = prefix + (typeof value === 'string' ? value : '[Invalid console output]')
    const size = Buffer.byteLength(line, 'utf8') + 1
    if (line.length > 5000 || this.lines.length >= 1000 || this.bytes + size > 64 * 1024) {
      this.truncated = true
      return
    }
    this.bytes += size
    this.lines.push(line)
  }
  text() {
    return this.lines.join('\n')
  }
}
