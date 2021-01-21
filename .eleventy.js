module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/images')
  eleventyConfig.addPassthroughCopy('src/_redirects')

  return {
    dir: {
      input: 'src',
      output: 'dist'
    }
  }
}
