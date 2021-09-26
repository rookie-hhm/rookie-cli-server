const oss = require('ali-oss')

class OSS {
  constructor () {
    this.oss = oss({
      accessKeyId: 'IDLTAI5tBJ1DjYakWT3X1RD8vJ',
      accessKeySecret: '',
      bucket: 'rookie-cli',
      regio:'oss-cn-shenzhen'
    })
  }
}

module.exports = OSS