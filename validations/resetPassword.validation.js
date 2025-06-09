const Joi = require("joi");

function resetPasswordValidation(requestBody) {
  let resetPasswordSchema = Joi.object({
    email: Joi.string().required(),
    newPassword: Joi.string().min(6).max(10).required()
  })
  return resetPasswordSchema.validate(requestBody, { abortEarly: false })
}
module.exports = resetPasswordValidation

