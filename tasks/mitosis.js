const findSkeletonRoot = require('../lib/skeleton-root-path')
const path = require('path')
const List = require('prompt-list')
const os = require('os')
const fs = require('fs')

module.exports = function (angel) {
  angel.on('cell mitosis :mitosisName store', async function (angel) {
    const full_repo_path = await findSkeletonRoot()
    const loadRootDNA = require(path.join(full_repo_path, 'cells/node_modules/lib/load-root-dna'))
    const loadCellInfo = require(path.join(full_repo_path, 'cells/node_modules/lib/load-cell-info'))
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let cellName = packagejson.name
    let cellInfo = await loadCellInfo(cellName)
    let mitosis = cellInfo.dna.mitosis[angel.cmdData.mitosisName]
    let rootDNA = await loadRootDNA()
    let port = rootDNA['cell-ports'][cellName]
    let mitosisJSON = {
      name: cellName,
      cwd: process.cwd(),
      version: packagejson.version,
      nodeVersion: packagejson.engines.node,
      endpoint: '127.0.0.1:' + port,
      port: port,
      mountpoint: rootDNA['cell-mountpoints'][cellName],
      domain: mitosis.target.domain,
      mitosis: mitosis
    }
    let mitosisJSONPath = `~/deployments/${packagejson.name}-${packagejson.version}-${mitosis.mode}`
    writeJSON(mitosisJSONPath, mitosisJSON)
  })
  angel.on('cell mitosis :mitosisName', async function (angel) {
    const full_repo_path = await findSkeletonRoot()
    const loadCellInfo = require(path.join(full_repo_path, 'cells/node_modules/lib/load-cell-info'))
    let list = new List({
      name: 'versionChange',
      message: 'version change?',
      choices: [ 'major', 'minor', 'patch', 'prerelease', 'none' ],
      default: 'none'
    })
    let versionChange = await list.run()
    if (versionChange !== 'none') {
      await angel.exec([
        `npm version ${versionChange}`,
        `git push --tags`
      ].join(' && '))
    }
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let cellName = packagejson.name
    let cellInfo = await loadCellInfo(cellName)
    let mitosis = cellInfo.dna.mitosis[angel.cmdData.mitosisName]
    let packPath = path.join(os.tmpdir(), `${cellName}-${cellInfo.version}.tar.gz`)
    let cellMode = mitosis.mode
    let remoteDistPath = `~/deployments/cells/${cellName}/${packagejson.version}-${cellMode}`
    await doPromise(angel, `cell pack ${angel.cmdData.mitosisName} ${packPath}`)
    let deployCmd = [
      `cd ${full_repo_path}`,
      `ssh node@${mitosis.target.ip} '${[
        `mkdir -p ${remoteDistPath}`,
      ].join(' && ')}'`,
      `scp ${packPath} node@${mitosis.target.ip}:${remoteDistPath}/deployment.tar.gz`,
      `ssh node@${mitosis.target.ip} '${[
        `cd ${remoteDistPath}`,
        'tar -zxf deployment.tar.gz',
        '. ~/.nvm/nvm.sh',
        `nvm install ${packagejson.engines.node}`,
        `nvm use ${packagejson.engines.node}`,
        `cd ${remoteDistPath}`,
        `npm i --production`,
        `cd ${remoteDistPath}/${cellInfo.cwd}`,
        'npm i --production',
        `npx angel mitosis ${angel.cmdData.mitosisName} store`
      ].join(' && ')}'`
    ].join(' && ')
    if (process.env.DRY || angel.dry) {
      console.info(deployCmd)
    } else {
      await angel.exec(deployCmd)
    }
  })
}
const doPromise = function (angel, cmdInput) {
  return new Promise((resolve, reject) => {
    angel.do(cmdInput, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
const writeJSON = function (filepath, jsonContent) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, JSON.stringify(jsonContent))
  })
}
