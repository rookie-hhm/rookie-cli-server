const Router = require('koa-router')
const router = new Router({ prefix: '/oss' })

const { list } = require('../controllers/oss')

router.get('/', list)

module.exports = router