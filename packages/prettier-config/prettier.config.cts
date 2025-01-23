const config = import('./src').then(({default: config}) => config)

module.exports = config
