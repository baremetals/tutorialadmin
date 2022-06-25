const storagedb = require("../../../storagedb.json");
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: env("UPLOAD_PROVIDER"),
      providerOptions: {
        bucketName: env("GCS_BUCKET_NAME"),
        publicFiles: env("GCS_PUBLIC_FILES"),
        uniform: env("GCS_UNIFORM"),
        serviceAccount: storagedb,
        // serviceAccount: env.json("GCSP_SERVICE_ACCOUNT"),
        baseUrl: env("GCS_BASE_URL"),
        basePath: env("GCS_BASE_PATH"),
      },
    },
  },
  graphql: {
    config: {
      endpoint: "/graphql",
      shadowCRUD: true,
      playgroundAlways: false,
      // depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
      },
    },
  },

  // EMAILS
  email: {
    config: {
      provider: env("EMAIL_PROVIDER"),
      providerOptions: {
        apiKey: env("EMAIL_API_KEY"),
      },
      settings: {
        defaultFrom: env("EMAIL_FROM"),
        defaultReplyTo: env("EMAIL_FROM"),
        testAddress: env("EMAIL_FROM"),
      },
    },
  },

  // CK Editor
  ckeditor: true,
  //...
});