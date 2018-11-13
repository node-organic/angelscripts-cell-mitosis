module.exports = async function (angel) {
  require('angelabilities-exec')(angel)
  require('./tasks/pack')(angel)
  require('./tasks/restart')(angel)
  require('./tasks/apoptosis')(angel)
  require('./tasks/mitosis')(angel)
  require('./tasks/status')(angel)
}
