const glob = require('glob')
const path = require('path')

module.exports = {
  gifs(state, type) {
    return glob.sync(`./src/images/*.{gif,jpg,png,webp}`)
      .map((gif) => {
        return path.parse(gif).name
      })
  }
}
