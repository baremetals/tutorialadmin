
module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("PROD_DATABASE_HOST"),
      database: env("PROD_DATABASE_NAME"),
      user: env("PROD_DATABASE_USERNAME"),
      password: env("PROD_DATABASE_PASSWORD"),
    },
  },
});
