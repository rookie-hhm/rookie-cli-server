const redis = require('redis')
class Redis {
  constructor () {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASS
    })
    this.redisClient.on('connect', () => {
      console.log('redis connected')
    })
    this.redisClient.on('error', (error) => {
      console.log(error, 'error')
    })
  }
  set (key, value) {
    return new Promise((resolve, reject) => {
      if (typeof value === 'object') {
        value = JSON.stringify(value)
      }
      console.log(typeof key, typeof value, 'set')
      this.redisClient.set(key, value, (err, result) => {
        if (err) {
          return reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
  get (key) {
    return new Promise((resolve, reject) => {
      this.redisClient.get(key, (err, val) => {
        if (err) {
          return reject(err)
        }
        if (val === null) {
          resolve(val)
        } else {
          try {
            val = JSON.parse(val)
            resolve(val)
          } catch (err) {
            reject(err)
          }
        }
      })
    })
  }
  del (key) {
    return new Promise((resolve, reject) => {
      this.redisClient.del(key, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }
}

module.exports = Redis