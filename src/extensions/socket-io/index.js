const io = require("socket.io-client");
const API_URL = "http://localhost:1339/";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjQzNTYxNDc4LCJleHAiOjE2NDYxNTM0Nzh9.FQu7r8axpXHVSARm5laJt1a3wHU3GuYexmEJnDBPUxU";

// Handshake required, token will be verified against strapi
const socket = io.connect(API_URL, {
  query: { token },
});

socket.emit('subscribe', 'article');

socket.on("create", async (data) => {
  //do something
  console.log("CREATE");
  console.log(data);
});
socket.on("update", (data) => {
  // do something
  console.log("UPDATE");
  console.log(data);
});
socket.on("delete", (data) => {
  // do something
  console.log("DELETE");
  console.log(data);
});