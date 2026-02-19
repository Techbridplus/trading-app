const { io } = require("socket.io-client");

const socket = io("http://localhost:4001");

socket.on("connect", () => {
  console.log("Connected to server");

  socket.emit("join-account", "acc-1");
});

socket.on("risk-update", (data) => {
  console.log("Risk Update:", data);
});
