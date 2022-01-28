module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'a927e84e3144467ad0344e691fcfacee'),
  },
});
