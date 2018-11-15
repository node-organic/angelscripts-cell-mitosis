const findSkeletonRoot = require('../lib/skeleton-root-path')
const path = require('path')
const fs = require('fs')
const {forEach} = require('p-iteration')

module.exports = function (angel) {
  angel.on('cell pack :mitosisName', async (angel, done) => {
    angel.do(`cell pack ${angel.cmdData.mitosisName} ./archived/deployment.tar.gz`, done)
  })
  angel.on('cell pack :mitosisName :packPath', async (angel, done) => {
    const full_repo_path = await findSkeletonRoot()
    const loadCellInfo = require(path.join(full_repo_path, 'cells/node_modules/lib/load-cell-info'))
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let cellInfo = await loadCellInfo(packagejson.name)
    let mitosis = cellInfo.dna.mitosis[angel.cmdData.mitosisName]
    let srcPaths = [
      'cells/node_modules/',
      'dna/',
      `${cellInfo.cwd}/`
    ]
    let packPath = angel.cmdData.packPath
    if (packPath.startsWith('./')) {
      packPath = path.join(full_repo_path, cellInfo.cwd, packPath)
    }
    let cellMode = mitosis.mode
    if (packagejson.scripts.build) {
      await angel.exec(`CELL_MODE=${cellMode} npm run build`)
      srcPaths = [
        'cells/node_modules/',
        'dna/',
        path.join(cellInfo.cwd, 'dist/')
      ]
    }
    let excludes = await buildExcludes(full_repo_path, srcPaths)
    srcPaths.push('package.json')
    srcPaths.push(path.join(cellInfo.cwd, 'package.json'))
    let bundleCmd = [
      `cd ${full_repo_path}`,
      `mkdir -p ${path.dirname(packPath)}`,
      `tar ${excludes.join(' ')} -zcvf ${packPath} ${srcPaths.join(' ')}`
    ].filter(v => v).join(' && ')
    if (process.env.DRY || angel.dry) {
      console.info(bundleCmd)
    } else {
      await angel.exec(bundleCmd)
    }
    done && done()
  })
}
const buildExcludes = async function (full_repo_path, srcPaths) {
  let excludes = []
  await forEach(srcPaths, async (dir) => {
    let lines = await readLines(path.join(full_repo_path, dir, '.gitignore'))
    lines = lines.filter(v => v).map(v => `--exclude='${path.join(dir, v)}*'`)
    excludes = excludes.concat(lines)
  })
  excludes.push(`--exclude='/.git'`)
  return excludes
}
const readLines = function (absolute_path) {
  return new Promise((resolve, reject) => {
    fs.readFile(absolute_path, (err, data) => {
      if (err) return resolve([])
      resolve(data.toString().split('\n'))
    })
  })
}
