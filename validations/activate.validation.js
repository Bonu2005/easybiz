const Joi = require("joi");

function activateValidation(requestBody){
      let activateSchema =Joi.object({
        userId:Joi.string().required(),
      })
      return activateSchema.validate(requestBody ,{abortEarly:false})
}
module.exports = activateValidation