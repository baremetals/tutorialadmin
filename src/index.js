'use strict';
const {
  findUser,
  createUser,
  deleteUser,
  userExists,
  getUsersInRoom
} = require('../config/utils');

module.exports = {
  
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {
    const extensionService = strapi.plugin("graphql").service("extension");
    extensionService.use(({ nexus }) => ({
      types: [
        nexus.extendType({
          type: "UsersPermissionsMe",
          definition(t) {
            // here define fields you need
            t.string("slug");
            t.string("profile_image");
          },
        }),
      ],
    }));
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {
    const { Server } = require('socket.io');
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: process.env.FRONT_END_HOST,
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
      }
    });
    io.on('connection', function (socket) {
      socket.on('join', async ({ username, room }, callback) => {
        try {
          const userExists = await findUser(username, room);
          if (userExists) {
            callback(`User ${username} already exists in room no${room}. Please select a different name or room`);
          } else {
            const user = await createUser({
              username: username,
              room: room,
              status: 'ONLINE',
              socketId: socket.id
            });

            if (user) {
              socket.join(user.room);
              socket.emit('welcome', {
                user: 'Bot',
                text: `${user.username}, Welcome to room ${user.room}.`,
                userData: user
              });
              socket.broadcast.to(user.room).emit('message', {
                user: 'Bot',
                text: `${user.username} has joined`,
              });
              io.to(user.room).emit('roomInfo', {
                room: user.room,
                users: await getUsersInRoom(user.room)
              });
            } else {
              callback('user could not be created. Try again!');
            }
          }
          callback();
        } catch (err) {
          console.log('Err occured, Try again!', err);
        }
      });
      socket.on('sendMessage', async (data, callback) => {
        try {
          const user = await userExists(data.userId);
          if (user) {
            io.to(user.room).emit('message', {
              user: user.username,
              text: data.message,
            });
            io.to(user.room).emit('roomInfo', {
              room: user.room,
              users: await getUsersInRoom(user.room)
            });
          } else {
            callback('User doesn\'t exist in the database. Rejoin the chat');
          }
          callback();
        } catch (err) {
          console.log('err inside catch block', err);
        }
      });

      socket.on('disconnect', async (data) => {
        try {
          console.log('DISCONNECTED!!!!!!!!!!!!');
          const user = await deleteUser(socket.id);
          if (user) {
            io.to(user.room).emit('message', {
              user: user.username,
              text: `User ${user.username} has left the chat.`,
            });
            io.to(user.room).emit('roomInfo', {
              room: user.room,
              users: await getUsersInRoom(user.room)
            });
          }
        } catch (err) {
          console.log('error while disconnecting', err);
        }
      });
    });
  },
}
