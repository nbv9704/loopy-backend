const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const output = path.resolve(root, 'dist')
// Clean only this project's exact build directory; reject links/junctions before recursive removal.
if (
  path.relative(root, output) !== 'dist' ||
  (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink())
) {
  throw new Error('Refusing to clean a build directory outside this project or through a link')
}
fs.rmSync(output, { recursive: true, force: true })
const result = spawnSync(
  process.execPath,
  [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.build.json'],
  {
    cwd: root,
    stdio: 'inherit',
  }
)
if (result.error) throw new Error('Could not start the TypeScript build')
process.exitCode = result.status ?? 1
