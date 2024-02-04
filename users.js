const users = [];

const userJoin = (id, username, userId, roomName,roomId) => {
	const user = { id, username, userId, roomName,roomId };
	users.push(user);
	return user;
};

const getRoomUsers = (roomId) => {
	return users.filter((user) => user.roomId == roomId);
};

const getCurrentUser = (id) => {
	return users.find((user) => user.id == id);
};

const userLeave = (id) => {
	const index = users.findIndex((user) => user.id == id);

	if (index != -1) {
		return users.splice(index, 1)[0];
	}
};

const formateMessage = (username,userId, text) => {
	return {
		username,
		userId,
		message:text,
		time: new Date().toISOString(),
	};
};

module.exports = {
	userJoin,
	getRoomUsers,
	getCurrentUser,
	userLeave,
	formateMessage,
};
