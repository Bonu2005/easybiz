const Joi = require("joi");

function banValidation(requestBody){
      let banSchema =Joi.object({
        userId:Joi.string().required(),
        ban_reason:Joi.string().required(),
      })
      return banSchema.validate(requestBody ,{abortEarly:false})
}

module.exports = banValidation