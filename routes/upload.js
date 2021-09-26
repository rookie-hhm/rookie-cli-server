const Router = require('koa-router');
const router = new Router({ prefix: '/upload' });


const { getInfo, upload } = require('../controllers/upload')
router.get('/', getInfo)
router.post('/', upload)

module.exports = router