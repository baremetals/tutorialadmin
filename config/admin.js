module.exports = ({ env }) => ({
  apiToken: {
    salt: env("API_TOKEN_SALT"),
  },
  auth: {
    secret: env("ADMIN_JWT_SECRET", "a927e84e3144467ad0344e691fcfacee"),
  },
  // serveAdminPanel: env.bool("SERVE_ADMIN", true),
  forgotPassword: {
    from: env("EMAIL_FROM"),
    replyTo: env("EMAIL_FROM"),
  },
});
