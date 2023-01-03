const projectId = process.env.GCS_PROJECT_ID;
const clientCertUrl = process.env.GCS_CLIENT_CERT_URL;
const privateKeyId = process.env.GCS_PRIVATE_KEY_ID;
const privateKey = process.env.GCS_PRIVATE_KEY;
const clientEmail = process.env.GCS_CLIENT_EMAIL;
const clientId = process.env.GCS_CLIENT_ID;

module.exports = {
  type: "service_account",
  project_id: projectId,
  private_key_id: privateKeyId,
  private_key: privateKey,
  client_email: clientEmail,
  client_id: clientId,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: clientCertUrl,
};


