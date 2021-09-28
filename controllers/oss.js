const Oss = require('../classes/oss')

class OssCtrol {
  async list (ctx) {
    const { prefix } = ctx.query
    const oss = new Oss()
    const res = await oss.list({ prefix })
    ctx.body = res.objects || []
  }
}

module.exports = new OssCtrol()