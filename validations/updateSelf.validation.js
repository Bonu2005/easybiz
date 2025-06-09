const Joi = require("joi");

function updateSelfValidation(requestBody) {
  let updateSelfSchema = Joi.object({
    username: Joi.string(),
  })
  return updateSelfSchema.validate(requestBody, { abortEarly: false })
}
module.exports = updateSelfValidation

