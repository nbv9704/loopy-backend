import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const portArg = process.argv.find(arg => arg.startsWith('--port='))
const outArg = process.argv.find(arg => arg.startsWith('--out='))
const port = portArg ? Number(portArg.slice('--port='.length)) : 9222
const outputDir = resolve(outArg ? outArg.slice('--out='.length) : 'references/captured')

const sanitizeFilePart = value => value
  .toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 90) || 'captured-page'

const sendCdp = (socket, method, params = {}) => new Promise((resolveMessage, reject) => {
  const id = Math.floor(Math.random() * 1_000_000_000)
  const handleMessage = event => {
    const message = JSON.parse(event.data)
    if (message.id !== id) return

    socket.removeEventListener('message', handleMessage)
    if (message.error) {
      reject(new Error(message.error.message || JSON.stringify(message.error)))
      return
    }

    resolveMessage(message.result)
  }

  socket.addEventListener('message', handleMessage)
  socket.send(JSON.stringify({ id, method, params }))
})

const waitForOpen = socket => new Promise((resolveOpen, reject) => {
  socket.addEventListener('open', resolveOpen, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

if (typeof WebSocket === 'undefined') {
  throw new Error('Node hiện tại chưa có WebSocket global. Hãy dùng Node 22+ hoặc mới hơn.')
}

const response = await fetch(`http://127.0.0.1:${port}/json/list`)

if (!response.ok) {
  throw new Error(`Không kết nối được capture browser ở port ${port}. Hãy chạy tools/browser-capture/open-capture-browser.ps1 trước.`)
}

const tabs = await response.json()
const pages = tabs.filter(tab => tab.type === 'page' && tab.webSocketDebuggerUrl && !tab.url.startsWith('devtools://'))

if (pages.length === 0) {
  throw new Error('Không tìm thấy tab page nào để capture.')
}

const page = pages[0]
const socket = new WebSocket(page.webSocketDebuggerUrl)
await waitForOpen(socket)

await sendCdp(socket, 'Runtime.enable')

const result = await sendCdp(socket, 'Runtime.evaluate', {
  expression: 'document.documentElement.outerHTML',
  returnByValue: true,
  awaitPromise: true,
})

socket.close()

const html = result.result?.value

if (!html) {
  throw new Error('Không lấy được document.documentElement.outerHTML từ tab hiện tại.')
}

await mkdir(outputDir, { recursive: true })

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const filename = `${timestamp}-${sanitizeFilePart(page.url)}.html`
const filepath = resolve(outputDir, filename)
const content = `<!--\nCaptured URL: ${page.url}\nCaptured Title: ${page.title || ''}\nCaptured At: ${new Date().toISOString()}\n-->\n${html}\n`

await writeFile(filepath, content, 'utf8')

console.log(`Captured: ${page.title || page.url}`)
console.log(`URL: ${page.url}`)
console.log(`Saved: ${filepath}`)
