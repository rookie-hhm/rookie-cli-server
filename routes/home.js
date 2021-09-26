const Router = require('koa-router')
const router = new Router({ prefix: '/' })
router.get('/', (ctx) => {
  console.log('home')
  ctx.body = 123
  console.log(ctx.body)
})

module.exports = router