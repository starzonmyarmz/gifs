module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/images')
  eleventyConfig.addPassthroughCopy('src/_redirects')

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
