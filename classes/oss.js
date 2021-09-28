const oss = require('ali-oss')

class OSS {
  constructor (bucket) {
    this.oss = oss({
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret:process.env.OSS_ACCESS_KEY_SECRET,
      bucket: bucket || 'rookie-cli',
      region:'oss-cn-shenzhen'
    })
  }
  async upload (path, localPath, options = {}) {
    await this.oss.put(path, localPath, options)
  }
  async list (params = {}) {
    const result = await this.oss.list(params)
    return result
  }
}

module.exports = OSS