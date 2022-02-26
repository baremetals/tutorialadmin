module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: env("UPLOAD_PROVIDER"),
      providerOptions: {
        bucketName: env("GCS_BUCKET_NAME"),
        publicFiles: env("GCS_PUBLIC_FILES"),
        uniform: env("GCS_UNIFORM"),
        serviceAccount: ('storagedb.json'),
        // ({
        //   type: env("GCS_TYPE"),
        //   project_id: env("GCS_PROJECT_ID"),
        //   private_key_id: env("GCS_PRIVATE_KEY_ID"),
        //   private_key: env("GCS_PRIVATE_KEY"),
        //   client_email: env("GCS_CLIENT_EMAIL"),
        //   client_id: env("GCS_CLIENT_ID"),
        //   auth_uri: env("GCS_AUTH_URI"),
        //   token_uri: env("GCS_TOKEN_URI"),
        //   auth_provider_x509_cert_url: env("GCS_AUTH_PROVIDER_URL"),
        //   client_x509_cert_url: env("GCS_CLIENT_CERT_URL"),
        // }),
        // replace `{}` with your serviceAccount JSON object
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