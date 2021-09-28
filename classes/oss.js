const oss = require('ali-oss')
class OSS {
  constructor (bucket) {
    this.oss = oss({
      accessKeyId: process.env.accessKeyId,
      accessKeySecret:process.env.accessKeySecret,
      bucket: bucket || 'rookie-cli',
      region:'oss-cn-shenzhen'
    })
  }
  async upload (path, localPath, options = {}) {
    await this.oss.put(path, localPath, options)
  }
}

module.exports = OSS