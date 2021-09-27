const oss = require('ali-oss')
const { ossConfig } = require('../config')
class OSS {
  constructor (bucket) {
    this.oss = oss({
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: bucket || 'rookie-cli',
      region:'oss-cn-shenzhen'
    })
    console.log(ossConfig.accessKeyId, ossConfig.accessKeySecret)
  }
  async upload (path, localPath, options = {}) {
    await this.oss.put(path, localPath, options)
  }
}

module.exports = OSS