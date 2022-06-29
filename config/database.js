// localhost database settings
// module.exports = ({ env }) => ({
//   connection: {
//     client: "postgres",
//     connection: {
//       host: env("DATABASE_HOST"),
//       port: env.int("DATABASE_PORT"),
//       database: env("DATABASE_NAME"),
//       user: env("DATABASE_USERNAME"),
//       password: env("DATABASE_PASSWORD"),
//       ssl: env.bool("DATABASE_SSL"),
//     },
//   },
// });

// Cloud database settings - Production
// module.exports = ({ env }) => ({
//   connection: {
//     client: "postgres",
//     connection: {
//       host: `/cloudsql/${env("INSTANCE_CONNECTION_NAME")}`,
//       database: env("DATABASE_NAME"),
//       user: env("DATABASE_USER"),
//       password: env("DATABASE_PASSWORD"),
//     },
//   },
// });

// Cloud database settings - local development
module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("CLOUD_DATABASE_HOST"),
      port: env.int("CLOUD_DATABASE_PORT"),
      database: env("CLOUD_DATABASE_NAME"),
      user: env("CLOUD_DATABASE_USERNAME"),
      password: env("CLOUD_DATABASE_PASSWORD"),
      ssl: env.bool("DATABASE_SSL"),
    },
  },
});
