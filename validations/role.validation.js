const Joi = require("joi");

function roleValidation(requestBody) {
  let roleSchema = Joi.object({
    name: Joi.string().required(),
  })
  return roleSchema.validate(requestBody, { abortEarly: false })
}
module.exports = roleValidation

