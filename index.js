const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const {
	userJoin,
	getRoomUsers,
	getCurrentUser,
	userLeave,
	formateMessage,
} = require("./users");
const handlebars = require("express-handlebars");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(express.json());

const socketsStatus = {};

const customHandlebars = handlebars.create({ layoutsDir: "./views" });

app.engine("handlebars", customHandlebars.engine);
app.set("view engine", "handlebars");

app.use("/files", express.static("public"));

io.on("connection", (socket) => {
	const socketId = socket.id;
	socketsStatus[socket.id] = {};

	socket.on("joinRoom", ({ userName, userId, roomName, roomId }) => {
		const user = userJoin(socket.id, userName, userId, roomName, roomId);
		console.log(user);
		socket.join(user.roomId);

		// Welcome message
		socket.emit("message", `Welcome to ${roomName}`);

		// Broadcasting other users
		socket.broadcast
			.to(roomId)
			.emit("message", `${userName} has joined the room`);

		// getting room users.
		const users = getRoomUsers(user.roomId);
		io.to(roomId).emit("roomUsers", {
			users,
		});
	});
	socket.on("chatMessage", (msg) => {
		const user = getCurrentUser(socket.id);
		io.to(user.roomId).emit(
			"chatMessage",
			formateMessage(user.userName, user.userId, msg)
		);
	});
	socket.on("codeChange", (code) => {
		const user = getCurrentUser(socket.id);
		io.to(user.roomId).emit(
			"codeChange",
			formateMessage(user.userName, user.userId, code)
		);
	});
	socket.on("canvasChange", (msg) => {
		const user = getCurrentUser(socket.id);
		io.to(user.roomId).emit(
			"canvasChange",
			formateMessage(user.userName, user.userId, msg)
		);
	});
	socket.on("typing", (username) => {
		const user = getCurrentUser(socket.id);
		console.log(user);
		socket.broadcast.to(user.room).emit("typing", username);
	});
	socket.on("chat", (chat) => {
		const user = getCurrentUser(socket.id);
		io.to(user.roomId).emit(
			"chat",
			formateMessage(user.userName, user.userId, chat)
		);
	});
	socket.on("stream", ({ room, status }) => {
		const user = getCurrentUser(socket.id);
		io.to(room).emit("stream", { user, status });
	});
	socket.on("voice", function (data) {
		var newData = data.split(";");
		newData[0] = "data:audio/ogg;";
		newData = newData[0] + newData[1];

		for (const id in socketsStatus) {
			if (
				id != socketId &&
				!socketsStatus[id].mute &&
				socketsStatus[id].online
			)
				socket.broadcast.to(id).emit("send", newData);
		}
	});
	socket.on("userInformation", function (data) {
		socketsStatus[socketId] = data;
	});
	socket.on("disconnect", () => {
		const user = userLeave(socket.id);
		console.log(user.username + " left");
		delete socketsStatus[socketId];

		if (user.username) {
			// Broadcastion other users on leaving
			io.to(user.roomId).emit(
				"message",
				`${user.username} has left the chat`
			);

			// getting room users.
			io.to(user.roomId).emit("roomUsers", {
				users: getRoomUsers(user.roomId),
			});
		}
	});
});

server.listen(8080, () => {
	console.log("listening on 8080");
});
