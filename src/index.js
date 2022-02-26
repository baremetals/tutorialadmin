'use strict';
const {
  getUser,
  getUserByUsername,
  createNewChat,
  respondToChat,
  existingChat,
  editChatMsg,
  editChatMsgRead,
  deleteChatMsg,
  deleteChat,
} = require("../config/utils");

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
            t.string("backgroundImg");
            t.string("img");
            // console.log(t)
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
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
      }
    });
    io.on('connection', function (socket) {
      console.log("Socket is alive");
      // Creating a new chat message
      // socket.on("getChatMsgs", async ({ owner, recipient, body }, callback) => {
      //   console.log("creating new chat");
      //   try {
      //     const chat = await existingChat(owner, recipient);
      //     if (chat) {
      //       const msg = await respondToChat(owner, chat.id, body);
      //       io.emit("message", msg);
      //     } else {
      //       const newChat = await createNewChat(
      //         data.owner,
      //         chat.user.id,
      //         data.body
      //       );
      //       io.emit("message", newChat);
      //     }
      //     callback();
      //   } catch (err) {
      //     console.log("err inside catch block", err);
      //   }
      // });

      // Creating a new chat message
      socket.on("createChat", async ({ owner, username, body, slug }, callback) => {
        console.log("creating new chat", );
        try {
          const chat = await existingChat(username, slug);
          // console.log(chat)
          if (chat.entry !== null) {
            const msg = await respondToChat(owner, chat.id, body, slug);
            io.emit("msg", msg);
          } else {
            // console.log(chat.user, " i am living")
            if (chat.user !== null) {
              console.log("user I am here")
              const newChat = await createNewChat(
                owner,
                chat.user.id,
                body,
                slug
              );
              // console.log(newChat);
              io.emit("chat", newChat);
            } else {
              callback("No user found");
            }
          }
          callback();
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // Responding a message
      socket.on("respondToChat", async ({ sender, chatId, body }, callback) => {
        console.log("responding a message");
        try {
          const user = await getUser(sender);
          if (user) {
            const msg = await respondToChat(sender, chatId, body);
            io.emit("message", msg);
          } else {
            callback("No user found");
          }
          callback();
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // Editing a message body
      socket.on("editChatMsgBody", async (data, callback) => {
        console.log("editing a message");
        try {
          const user = await getUser(data.userId);
          if (user) {
            const msg = await editChatMsg(data.msg, data.body);
            io.emit("message", msg);
          } else {
            callback("No user found");
          }
          callback();
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // Editing message isRead field
      socket.on("editChatMsgIsRead", async (data, callback) => {
        console.log("editing a message isRead field");
        try {
          const user = await getUser(data.userId);
          if (user) {
            const msg = await editChatMsgRead(data.msg, data.isRead);
            io.emit("message", msg);
          } else {
            callback("No user found");
          }
          callback();
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // Deleting a message
      socket.on("deleteChatMsg", async (data, callback) => {
        console.log("deleting a message");
        try {
          const user = await getUser(data.userId);
          if (user) {
            await deleteChatMsg(data.chatId);
          } else {
            callback("No user found");
          }
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // Deleting a chat conversation
      // socket.on("disconnect", async (data) => {
      //   console.log("deleting a chat conversation");
      //   try {
      //     console.log("DISCONNECTED!!!!!!!!!!!!");
      //     const user = await getUser(data.userId);
      //     if (user) {
      //       await deleteChat(data.chatId);
      //     } else {
      //       callback("No user found");
      //     }
      //   } catch (err) {
      //     console.log("error while disconnecting", err);
      //   }
      // });
    });
  },
}
