const findSkeletonRoot = require('../lib/skeleton-root-path')
const path = require('path')

module.exports = function (angel) {
  angel.on('cell restart :mitosisName', async (angel, done) => {
    const full_repo_path = await findSkeletonRoot()
    const loadCellInfo = require(path.join(full_repo_path, 'cells/node_modules/lib/load-cell-info'))
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let cellInfo = await loadCellInfo(packagejson.name)
    let mitosis = cellInfo.dna.mitosis[angel.cmdData.mitosisName]
    let statusCmd = [
      `ssh root@${mitosis.target.ip} "systemctl restart '${cellInfo.name}*'"`
    ].filter(v => v).join(' && ')
    if (process.env.DRY || angel.dry) {
      console.info(statusCmd)
    } else {
      console.info(statusCmd)
      await angel.exec(statusCmd)
    }
    done && done()
  })
}
