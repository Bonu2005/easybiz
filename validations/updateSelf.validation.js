const Joi = require("joi");

function updateSelfValidation(requestBody) {
  let updateSelfSchema = Joi.object({
    username: Joi.string().optional(),
    telegram :Joi.string().optional(),
    facebook :Joi.string().optional(),
    instagram :Joi.string().optional(),
  })
return updateSelfSchema.validate(requestBody, { abortEarly: false })
}
module.exports = updateSelfValidation

