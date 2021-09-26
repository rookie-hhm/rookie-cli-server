const Koa = require('koa')
const koaBody = require('koa-body')
const Router = require('koa-router')
const koaStatic = require("koa-static")
const koaCors = require('koa-cors')
const mongoose = require('mongoose')
const Redis = require('./redis')
const redisClient = new Redis()
console.log(redisClient.set, 'set')
const path = require('path')
// const io = require("socket.io")();
const IO = require('koa-socket-2')
const io = new IO()
const app = new Koa()
const REDIS_PREFIX_KEY = 'build'
const ERR_OK = 0
const ERR_FAIL = 1
io.attach(app)

app.use(async (ctx, next) => {
  ctx.redis = redisClient
  next()
})
app.io.use(async (ctx, next) => {
  ctx.redis = redisClient
  await next()
})
app.io.on('message', (ctx, data) => {
  console.log(ctx.redis, 'ctx.redis')
  console.log('client sent data to message endpoint', data);
  ctx.socket.compress(true).emit( 'message', { hello: 'world' } );
  // ctx.socket.compress(true).emit('asd', 'asd')
  console.log(ctx.socket === io.socket, 'flagasd')
});
// app.io.socket.compress(true).emit('res', 'resdata')
app.io.on('connection', async (socket) => {
  const { id, handshake } = socket
  console.log(typeof `${REDIS_PREFIX_KEY}:${socket.id}`, typeof handshake.query)
  await redisClient.set(`${REDIS_PREFIX_KEY}:${socket.id}`, JSON.stringify(handshake.query))
  socket.compress(true).emit(id, {
    taskId: id,
    timeStamp: +new Date(),
    message: 'CloudBuild service connect successfully'
  })
  console.log('connection app')
})

const CloudBuildTask = require('./models/cloudbuildtask')
async function createCloudBuildTask (ctx) {
  const { socket } = ctx
  const key = `${REDIS_PREFIX_KEY}:${socket.id}`
  const redisData = await redisClient.get(key)
  console.log(typeof redisData, redisData)
  return new CloudBuildTask(redisData, socket)
}
// cloud build
async function clone (task, socket) {
  return new Promise(async (resolve, reject) => {
    socket.compress(true).emit('building', 'Start to clone remote repository')
    // const { code, message } = await task.clone()
    const { code, message } = await task.clone()
    console.log(message, 'result')
    // console.log(code, message, 'clone')
    if (code === ERR_FAIL) {
      socket.compress(true).emit('error_build', message)
      console.log('reject')
      reject('')
    } else {
      socket.compress(true).emit('building', message)
      console.log('resolve')
      resolve('')
    }
  })
}

async function install (task, socket) {
  return new Promise(async (resolve, reject) => {
    socket.compress(true).emit('building', 'Start to install dependencies')
    const { code, message } = await task.install()
    if (code === ERR_FAIL) {
      console.log(code )
      socket.compress(true).emit('error_build', message)
      console.log('reject')
      reject()
    } else {
      socket.compress(true).emit('building', message)
      console.log('resolve')
      resolve()
    }
  })
}

async function build (task, socket) {
  return new Promise(async (resolve, reject) => {
    socket.compress(true).emit('building', 'Start to build project')
    const { code, message } = await task.build()
    if (code === ERR_FAIL) {
      socket.compress(true).emit('error_build', message)
      reject()
    } else {
      socket.compress(true).emit('builded', message)
      resolve()
    }
  })
}

app.io.on('build', async (ctx, data) => {
  const { socket } = ctx
  try {
    const task = await createCloudBuildTask(ctx)
    console.log(task, 'task')
    // 云构建任务创建成功
    ctx.socket.compress(true).emit('build', 'Build cloudbuild task')
    // 检查用户主目录
    const isExist = task.isExistsHome()
    if (!isExist) {
      ctx.socket.compress(true).emit('error_build', 'User home directory does not exist, terminate task')
    }
    task.gitInit(task.cachedDir)
    // 拉取源码
    await clone(task, socket)
    console.log('success')
    // 切换到对应分支
    // 切换分支
    await task.checkoutBranch()
    // 安装依赖
    await install(task, socket)
    // // 执行打包命令
    await build(task, socket)
  } catch (err) {
    socket.compress(true).emit('error_build', 'Failed to build')
  }
})


app.use(koaStatic(path.join(__dirname, 'public'), {
  setHeaders (res) {
    // res.setHeader('cache-control', 'immutable')
    res.setHeader("Access-Control-Allow-Origin", "*")
  }
}))

app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: path.join(__dirname, '/public/uploads'),
    keepExtensions: true,
  },
}))
app.use(koaCors())

app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*")
  await next()
})

const router = new Router()
router.get('/upload', async ctx => {
  console.log(ctx.redis, 'redis')
  await ctx.redis.set('test1111111', JSON.stringify({ a: 1 }))
  ctx.body = 'asdasd'
})
router.post('/upload', ctx => {
  const file = ctx.request.files.file
  console.log(ctx.request.files.file, 'file')
  const basename = path.basename(file.path)
  ctx.body = { url: `${ctx.origin}/uploads/${basename}` }
})
app.use(router.routes()).use(router.allowedMethods())
app.listen('3000', () => {
  console.log('监听3000端口成功')
})