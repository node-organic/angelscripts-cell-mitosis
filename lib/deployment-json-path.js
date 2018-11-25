const path = require('path')
module.exports = function (type, name, version, mode) {
  return path.join('/home/node/deployments/', type,
    [name, version, mode].join('-') + '.json')
}
module.exports.enabled = function (name, version, mode) {
  return module.exports('enabled', name, version, mode)
}
module.exports.running = function (name, version, mode) {
  return module.exports('running', name, version, mode)
}
