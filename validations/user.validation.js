const Joi = require("joi");

function userValidation(requestBody){
      let userSchema =Joi.object({
        username:Joi.string().required(),
        email:Joi.string().required(),
        password:Joi.string().required().max(10).min(6),
        roleId:Joi.string().uuid().required(),
        image:Joi.string(),
        telegram:Joi.string().min(3).optional(),
        facebook:Joi.string().min(3).optional(),
        instagram:Joi.string().min(3).optional()
      })
      return userSchema.validate(requestBody ,{abortEarly:false})
}

module.exports = userValidation