module.exports = ({ env }) => ({
  apiToken: {
    salt: env("API_TOKEN_SALT"),
  },
  auth: {
    secret: env("ADMIN_JWT_SECRET"),
  },
  
  forgotPassword: {
    from: env("EMAIL_FROM"),
    replyTo: env("EMAIL_FROM"),
  },
});
