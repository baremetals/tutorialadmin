async function findUser(username, room) {
    try {
        const userExists = await strapi.db.query('api::users-chat.users-chat').findOne({ where: { 'username': username, 'room': room }});
        return userExists;
    } catch(err) {
        console.log("error while fetching", err);
    }
}
async function createUser({ username, room, status, socketId }) {
    try {
        console.log(username, room, status, socketId)
        const user = await strapi.service('api::users-chat.users-chat').create({
                "data": {
                    "username": username,
                    "room": room,
                    "status": status,
                    "socketid": socketId
                }
        });
        console.log(user)
        return user;
    } catch(err) {
        console.log('1111111', err)
        console.log("User couldn't be created. Try again!")
    }
}

async function userExists(id) {
    try {
        const user = await strapi.db.query('api::users-chat.users-chat').findOne({ where: {'id': id}});
        console.log('userExists', user)
        return user;
    } catch(err) {
        console.log("Error occured when fetching user", err);
    }
}

async function getUsersInRoom(room) {
    try {
        const usersInRoom = await strapi.service('api::users-chat.users-chat').find({"room": room});
        console.log('usersInRoom', usersInRoom)
        return usersInRoom;
    } catch(err) {
        console.log("Error.Try again!", err);
    }
}

async function deleteUser(socketId) {
    try {
        const user = await strapi.db.query('api::users-chat.users-chat').delete( { where:{'socketid': socketId}})
        return user;
    } catch(err) {
        console.log("Error while deleting the User", err);
    }
}

module.exports = {
    findUser,
    createUser,
    userExists,
    getUsersInRoom,
    deleteUser
}