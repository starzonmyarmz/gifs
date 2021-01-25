module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("g")

  eleventyConfig.addFilter('titlize', (val) => {
    return val.replace(/-/g, ' ')
  })

  return {
    dir: {
      input: 'src',
      output: 'dist'
    }
  }
}
