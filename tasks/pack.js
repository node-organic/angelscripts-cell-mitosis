const findSkeletonRoot = require('../lib/skeleton-root-path')
const path = require('path')

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
    let bundleCmd
    if (packagejson.scripts.build) {
      await angel.exec(`CELL_MODE=${cellMode} npm run build`)
      srcPaths = [
        path.join(cellInfo.cwd, 'dist/')
      ]
      bundleCmd = [
        `cd ${full_repo_path}`,
        `mkdir -p ${path.dirname(packPath)}`,
        `tar -zcvf ${packPath} ${srcPaths.join(' ')}`
      ].join(' && ')
    } else {
      // root and cell package.json files are always packed
      srcPaths.push('package.json')
      srcPaths.push(path.join(cellInfo.cwd, 'package.json'))
      bundleCmd = [
        `cd ${full_repo_path}`,
        `mkdir -p ${path.dirname(packPath)}`,
        `uploadStash=\`git stash create\`; git archive -o ${packPath} \${uploadStash:-HEAD} ${srcPaths.join(' ')}`
      ].join(' && ')
    }
    if (process.env.DRY || angel.dry) {
      console.info(bundleCmd)
    } else {
      await angel.exec(bundleCmd)
    }
    done && done()
  })
}
