module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: env("UPLOAD_PROVIDER"),
      providerOptions: {
        bucketName: env("GCS_BUCKET_NAME"),
        publicFiles: env("GCS_PUBLIC_FILES"),
        uniform: env("GCS_UNIFORM"),
        baseUrl: env("GCS_BASE_URL"),
        basePath: env("GCS_BASE_PATH"),
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
      },
    },
  },
  //...
});