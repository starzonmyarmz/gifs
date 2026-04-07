module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("g")
  eleventyConfig.addPassthroughCopy("src/manifest.json")
  eleventyConfig.addPassthroughCopy("src/sw.js")
  eleventyConfig.addPassthroughCopy("src/icon-192.png")
  eleventyConfig.addPassthroughCopy("src/icon-512.png")

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
