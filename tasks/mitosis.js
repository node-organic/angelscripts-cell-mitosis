const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const deploymentJSONPath = require('../lib/deployment-json-path')
const path = require('path')
const os = require('os')
const fs = require('fs')
const semver = require('semver')

module.exports = function (angel) {
  angel.on('cell mitosis :mitosisName', async function (angel) {
    const full_repo_path = await findSkeletonRoot()
    const loadCellInfo = require(path.join(full_repo_path, 'cells/node_modules/lib/load-cell-info'))
    let packagejson_path = path.join(process.cwd(), 'package.json')
    let packagejson = require(packagejson_path)
    let cellName = packagejson.name
    let cellInfo = await loadCellInfo(cellName)
    let mitosis = cellInfo.dna.mitosis[angel.cmdData.mitosisName]
    if (!mitosis.versionChange) throw new Error('required `versionChange` is not found on command line or mitosis dna')
    await doPromise(angel, `cell mitosis ${angel.cmdData.mitosisName} ${mitosis.versionChange}`)
  })
  angel.on('cell mitosis :mitosisName :versionChange', async function (angel) {
    const full_repo_path = await findSkeletonRoot()
    const loadCellInfo = require(path.join(full_repo_path, 'cells/node_modules/lib/load-cell-info'))
    const loadRootDNA = require(path.join(full_repo_path, 'cells/node_modules/lib/load-root-dna'))
    let packagejson_path = path.join(process.cwd(), 'package.json')
    let packagejson = require(packagejson_path)
    let cellName = packagejson.name
    let cellInfo = await loadCellInfo(cellName)
    let mitosis = cellInfo.dna.mitosis[angel.cmdData.mitosisName]
    let versionChange = angel.cmdData.versionChange
    if (versionChange !== 'current') {
      let versionIdentifier
      if (versionChange.startsWith('prerelease-')) {
        versionIdentifier = versionChange.split('prerelease-').pop()
        versionChange = 'prerelease'
      }
      let newVersion = semver.inc(packagejson.version, versionChange, versionIdentifier)
      packagejson.version = newVersion
      await writePrettyJSON(packagejson_path, packagejson)
      await angel.exec([
        `git commit -am '${packagejson.name}-${newVersion}'`,
        `git tag -a ${packagejson.name}-${newVersion} -m '${packagejson.name}-${newVersion}'`,
        `git push --tags`,
        `git push`
      ].join(' && '))
    }
    let cellMode = mitosis.mode
    let packPath = path.join(os.tmpdir(), `${cellName}-${packagejson.version}-${cellMode}.tar.gz`)
    let remoteDistPath = `/home/node/deployments/cells/${cellName}-${packagejson.version}-${cellMode}`
    await doPromise(angel, `cell pack ${angel.cmdData.mitosisName} ${packPath}`)
    let rootDNA = await loadRootDNA()
    let deploymentJSON = {
      name: cellName,
      cwd: `${remoteDistPath}/${cellInfo.cwd}`,
      version: packagejson.version,
      nodeVersion: packagejson.engines.node,
      endpoint: '127.0.0.1:' + rootDNA['cell-ports'][cellName],
      port: rootDNA['cell-ports'][cellName],
      mountpoint: rootDNA['cell-mountpoints'][cellName],
      domain: mitosis.target.domain,
      mitosis: mitosis
    }
    if (mitosis.zygote) {
      deploymentJSON.endpoint = deploymentJSON.cwd + '/dist'
    }
    let deploymentEnabledPath = deploymentJSONPath.enabled(packagejson.name, packagejson.version, mitosis.mode)
    let deploymentRunningPath = deploymentJSONPath.running(packagejson.name, packagejson.version, mitosis.mode)
    let deployCmd = [
      `cd ${full_repo_path}`,
      `ssh node@${mitosis.target.ip} '${[
        `mkdir -p ${remoteDistPath}`,
      ].join(' && ')}'`,
      `echo 'uploading deployment ${packPath}...'`,
      `scp ${packPath} node@${mitosis.target.ip}:${remoteDistPath}/deployment.tar.gz`,
      `echo 'unpacking deployment ${remoteDistPath}/deployment.tar.gz...'`,
      `ssh node@${mitosis.target.ip} '${[
        `cd ${remoteDistPath}`,
        'tar -zxf deployment.tar.gz',
        '. ~/.nvm/nvm.sh',
        mitosis.mergeDNAFrom ? `cp -rv ${mitosis.mergeDNAFrom}/* ${remoteDistPath}/dna` : '',
        !packagejson.scripts.build ? [
          `nvm install ${packagejson.engines.node}`,
          `nvm use ${packagejson.engines.node}`,
          `cd ${remoteDistPath}`,
          `npm i --production`,
          `cd ${remoteDistPath}/${cellInfo.cwd}`,
          'npm i --production'
        ].join(' && ') : ''
      ].filter(v => v).join(' && ')}'`,
      `echo 'registering deployment ${deploymentEnabledPath}...'`,
      `echo '${JSON.stringify(deploymentJSON, null, 2)}' | ssh node@${mitosis.target.ip} 'cat > ${deploymentEnabledPath}'`,
      mitosis.zygote ? [
        `echo 'mark as running deployment ${deploymentRunningPath}...'`,
        `echo '${JSON.stringify(deploymentJSON, null, 2)}' | ssh node@${mitosis.target.ip} 'cat > ${deploymentRunningPath}'`,
      ].join(' && ') : '',
    ].filter(v => v).join(' && ')
    if (process.env.DRY || angel.dry) {
      console.info(deployCmd)
    } else {
      await angel.exec(deployCmd)
      console.info('deployment complete!')
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
const writePrettyJSON = function (filepath, jsonDiff) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, JSON.stringify(jsonDiff, null, 2), (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
