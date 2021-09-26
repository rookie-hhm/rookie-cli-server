class Img {
  getInfo (ctx) {
    console.log('getinfo')
    ctx.body = 'hell world!'
  }
  upload (ctx) {
    const file = ctx.request.files.file
    console.log(ctx.request.files.file, 'file')
    const basename = path.basename(file.path)
    ctx.body = { url: `${ctx.origin}/uploads/${basename}` }
  }
}


module.exports = new Img()