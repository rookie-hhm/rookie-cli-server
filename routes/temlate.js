const Router = require('koa-router');
const router = new Router({ prefix: '/templateInfo' });
const {
  getTemplateInfo, find
} = require('../controllers/template');
console.log('template')
router.get('/', find)
router.get('/:type', getTemplateInfo);
// router.post('/', auth, create);
// router.get('/:id', checkQuestionExist, findById);
// router.patch('/:id', auth, checkQuestionExist, checkQuestioner, update);
// router.delete('/:id', auth, checkQuestionExist, checkQuestioner, del);

module.exports = router;