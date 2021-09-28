const Template = require('../models/template')
class TemplateCtrol {
  async getTemplateInfo (ctx) {
    console.log(ctx.params)
    const { type = '' } = ctx.params
    console.log(type, 'templatetype')
    const templateInfo = await Template.find({ templateType: type })
    console.log(templateInfo, 'templateInfo')
    ctx.body = templateInfo
  }
  async find (ctx) {
    console.log(ctx.params)
    const { type = '' } = ctx.params
    const templateInfo = await Template.find()
    console.log(templateInfo, 'templateInfo')
    ctx.body = templateInfo
  }
}

module.exports = new TemplateCtrol()