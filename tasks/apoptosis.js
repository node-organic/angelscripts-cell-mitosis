const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const deploymentJSONPath = require('../lib/deployment-json-path')
const path = require('path')

module.exports = function (angel) {
  angel.on('cell apoptosis :mitosisName', async (angel) => {
    const full_repo_path = await findSkeletonRoot()
    const loadCellInfo = require(path.join(full_repo_path, 'cells/node_modules/lib/load-cell-info'))
    let packagejson = require(path.join(process.cwd(), '/package.json'))
    let cellName = packagejson.name
    let cellInfo = await loadCellInfo(cellName)
    let mitosis = cellInfo.dna.mitosis[angel.cmdData.mitosisName]
    let cellMode = mitosis.mode
    await angel.exec([
      `ssh node@${mitosis.target.ip} '${[
        `rm ${deploymentJSONPath.enabled(cellName, packagejson.version, cellMode)} || true`,
        `rm ${deploymentJSONPath.running(cellName, packagejson.version, cellMode)} || true`,
        `echo 'apoptosis complete'`
      ].join(' && ')}'`
    ].join(' && '))
  })
}
