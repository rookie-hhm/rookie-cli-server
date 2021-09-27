const dotenv = require('dotenv')
console.log(dotenv.config())
const parsed = dotenv.config().parsed

const { OSS_ACCESS_KEY_SECRET, OSS_ACCESS_KEY_ID } = parsed

const redisConfig = {
  port: 6379,
  host: '127.0.0.1'
}

const mongooseConfig = {
  secret: 'secret',
  // connectionStr: 'mongodb+srv://lewis:mukewang@zhihu-kag3y.mongodb.net/test?retryWrites=true',
  connectionStr: 'mongodb://47.107.91.7/rookie-cli'
};

const ossConfig = {
  accessKeyId: OSS_ACCESS_KEY_ID,
  accessKeySecret: OSS_ACCESS_KEY_SECRET,
}

module.exports = {
  redisConfig,
  mongooseConfig,
  ossConfig
}