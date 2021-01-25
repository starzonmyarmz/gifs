const glob = require('glob')
const path = require('path')

module.exports = {
  gifs(state, type) {
    return glob.sync(`./g/*.gif`)
      .map((gif) => {
        return path.parse(gif).name
      })
  }
}
