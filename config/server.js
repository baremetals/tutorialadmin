const forgotPasswordTemplate = require("./email-templates/forgot-password");

module.exports = ({ env }) => ({
  host: env("HOST"),
  port: env.int("PORT"),
  url: env("APP_URL"),

  admin: {
    // ...
    forgotPassword: {
      from: env("EMAIL_FROM"),
      replyTo: env("EMAIL_FROM"),
      emailTemplate: forgotPasswordTemplate,
    },
    // ...
  },
});
