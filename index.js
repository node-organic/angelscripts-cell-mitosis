module.exports = async function (angel) {
  require('angelabilities-exec')(angel)
  require('./tasks/pack')(angel)
  require('./tasks/apoptosis')(angel)
  require('./tasks/mitosis')(angel)
}
