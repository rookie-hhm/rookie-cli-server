const redisConfig = {
  port: 6379,
  host: '127.0.0.1'
}

const mongooseConfig = {
  secret: 'secret',
  // connectionStr: 'mongodb+srv://lewis:mukewang@zhihu-kag3y.mongodb.net/test?retryWrites=true',
  connectionStr: 'mongodb://rookie.zsj/rookie-cli'
};

module.exports = {
  redisConfig,
  mongooseConfig
}