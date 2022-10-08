"use strict";

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
  loadAllChatMessages,
  fetchAllusers,
  loadAllChats,
  fetchUnReadNotifications,
  editChatMsgReadBulk,
  loadSingleChats,
  fetchusers,
} = require("../config/utils");
const {
  addMessage,
  editMsg,
  editMsgRead,
  editMsgReadBulk,
  deleteMsg,
  loadAllMessages,
  getUnReadGroupNotifications,
  newGroupChat,
  getGroupUser,
} = require("../config/group");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {
    const { Server } = require("socket.io");
    // console.log(process.env.FRONT_END_HOST);
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: process.env.FRONT_END_HOST,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
      },
    });

    io.on("connection", async function (socket) {
      const userId = socket.handshake.auth.id;
      socket.join(userId);
      // console.log({ userId });
      socket.on("joinroom", async ({ me }) => {
        // console.log("JOIN ROOMED CALLED ", me);
        socket.join(me);
      });

      // Join Course Group Chat
      socket.on("joingroup", async ({ slug }) => {
        // console.log("mate life is hard bro ", slug);
        socket.join(slug);
      });

      const users = [];
      const usersIDs = [];
      const resp = await fetchusers();

      resp.forEach((user) => {
        usersIDs.push(user.id);
        users.push({
          userID: user.id,
          username: user.username,
          img: user.img,
          connected: false,
          slug: null,
          online: false,
        });
      });

      const chatsOfUsers = await loadAllChats(usersIDs);
      socket.on("getallusers", async ({ targetValue, me }, callback) => {
        const to = users.filter((usr) => usr.username.includes(targetValue));
        const fU = chatsOfUsers.filter(
          (cou) => cou?.owner?.id == me || cou?.recipient?.id == me
        );

        let filteredUsers = [];
        to.map((e) => {
          fU.map((d) => {
            if (d?.owner?.id == e?.userID || d?.recipient?.id == e?.userID) {
              e.slug = d?.slug;
            }
          });
          filteredUsers.push(e);
        });
        socket.emit("users", filteredUsers);
      });

      socket.on("load all chats", async ({ id, slug }, callback) => {
        // console.log(socket.id);
        const to = users.filter((usr) => usr.userID === id);

        // console.log(to)
        try {
          if (slug) {
            const messages = await loadAllChatMessages(slug);
            let ids = [];
            messages.map((e) => {
              if (e.isRead == false && e?.receiver?.id == id) {
                ids.push(e.id);
              }
            });
            const doRead = await editChatMsgReadBulk(ids);
          }

          const chat = await loadAllChats(id);

          if (chat) {
            socket.emit("chats loaded", {
              chat,
              to: to.userID,
            });
          } else {
            callback("You have no messages!");
          }

          callback();
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // load all messages in a chat
      socket.on(
        "load all messages",
        async ({ slug, username, me }, callback) => {
          // console.log(socket.id)
          try {
            let messages;
            const getuser = await getUserByUsername(username);
            messages = await loadAllChatMessages(slug);
            let ids = [];
            // console.log({ messages }, "==>messages");
            messages.map((e) => {
              if (e.isRead == false && e?.receiver?.id == me) {
                ids.push(e.id);
              }
            });
            console.log({ ids });
            const doRead = await editChatMsgReadBulk(ids);
            const chatMsgs = await fetchUnReadNotifications(me);
            console.log(chatMsgs.length);
            // console.log(chatMsgs);
            if (chatMsgs) {
              socket.emit("chatMsgs loaded", chatMsgs.length);
            }
            // console.log("mated");
            if (messages) {
              // console.log(messages[0] , "===>messages");
              socket.emit("emptyusers", []);
              socket.emit("load all chats", { id: me });
              socket.emit("messages loaded", messages);
            } else {
              callback("You have no messages!");
            }
            callback();
          } catch (err) {
            console.log("err inside catch block", err);
          }
        }
      );

      // load all unread notifications for the icon
      socket.on("load unread messages", async ({ id }, callback) => {
        try {
          const chatMsgs = await fetchUnReadNotifications(id);
          // console.log(chatMsgs);
          if (chatMsgs) {
            socket.emit("chatMsgs loaded", chatMsgs.length);
          } else {
            callback("You have no chatMsgs!");
          }
          callback();
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // Not Being Used On the FrontEnd
      socket.on(
        "getusersbyusername",
        async ({ username, userid }, callback) => {
          try {
            const to = users.filter((usr) => usr.userID === userid);

            const chat = await loadAllChats(userid);
            if (chat) {
              socket.emit("getslug", {
                chat,
                to: to.userID,
              });
            } else {
              callback("You have no messages!");
            }

            callback();
          } catch (err) {
            console.log("err inside catch block", err);
          }
        }
      );

      // Creating a new chat message
      socket.on(
        "createChat",
        async ({ owner, recipient, body, slug }, callback) => {
          try {
            const chat = await existingChat(slug);
            if (chat !== null) {
              const msg = await respondToChat(
                owner,
                chat.id,
                body,
                slug,
                recipient
              );
              socket.emit("msg", msg);
            } else {
              // if (chat?.user !== null) {
              const u = await getUserByUsername(recipient);
              const newChat = await createNewChat(owner, u?.id, body, slug);
              socket.emit("chat", newChat);
              const s = newChat?.slug;
              const messages = await loadAllChatMessages(s);
              // console.log("mated");
              if (messages) {
                socket.emit("messages loaded", messages);
                const chat = await loadAllChats(u?.id);

                io.to(newChat?.recipient?.id).emit("chats loaded", {
                  chat,
                  to: u?.id,
                });
              } else {
                callback("You have no messages!");
              }

              const chatMsgs = await fetchUnReadNotifications(
                newChat?.recipient?.id
              );
              // console.log(chatMsgs);
              if (chatMsgs) {
                socket.emit("messages loaded", messages);
                io.to(newChat?.recipient?.id).emit(
                  "chatMsgs loaded",
                  chatMsgs.length
                );
              } else {
                callback("You have no chatMsgs!");
              }

              // } else {
              //   callback("No user found");
              // }
            }
            callback();
          } catch (err) {
            console.log("err inside catch block", err);
          }
        }
      );
      // Responding a message
      socket.on(
        "respondToChat",
        async ({ sender, chatId, body, receiver }, callback) => {
          try {
            const user = await getUser(sender);
            if (user) {
              const msg = await respondToChat(sender, chatId, body, receiver);

              const s = msg?.chat?.slug;
              const messages = await loadAllChatMessages(s);

              if (messages) {
                socket.emit("messages loaded", messages);

                // socket.emit("message", msg);
              } else {
                callback("You have no messages!");
              }
              socket.to(receiver).emit("messages loaded", messages);

              const chatMsgs = await fetchUnReadNotifications(receiver);
              socket.to(receiver).emit("getsinglechatnotification", {
                msg,
              });

              const chat = await loadAllChats(receiver);

              if (chatMsgs) {
                io.in(receiver).emit("chatMsgs loaded", chatMsgs.length);
                io.to(receiver).emit("chatMsgs loaded", chatMsgs.length);
                io.to(receiver).emit("chats loaded", {
                  chat,
                  to: receiver,
                });
              } else {
                callback("You have no chatMsgs!");
              }
            } else {
              callback("No user found");
            }
            callback();
          } catch (err) {
            console.log("err inside catch block", err);
          }
        }
      );

      // Editing a message body
      socket.on("editChatMsgBody", async (data, callback) => {
        try {
          const user = await getUserByUsername(data.data.username);
          if (user) {
            const msg = await editChatMsg(data.data.msgId, data.data.body);
            if (msg) {
              const messages = await loadAllChatMessages(data.data.slug);
              socket.emit("messages loaded", messages);
              socket
                .to(user?.id)
                .to(user?.id)
                .emit("messages loaded", messages);
            }
            // socket.emit("message", msg);
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
        try {
          const user = await getUser(data.userId);
          if (user) {
            const msg = await editChatMsgRead(data.msg, data.isRead);
            socket.emit("message", msg);
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
        try {
          const user = await getUserByUsername(data.username);
          if (user) {
            await deleteChatMsg(data.chatId);
          } else {
            callback("No user found");
          }

          const r = await loadAllChatMessages(data.slug);
          if (r) {
            socket.emit("messages loaded", r);
            socket.to(user.id).to(user.id).emit("messages loaded", r);
          } else {
            callback("You have no messages!");
          }
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // load all unread group notifications
      socket.on("load unread group messages", async ({ id }, callback) => {
        try {
          const chatMsgs = await getUnReadGroupNotifications(id);
          // console.log(chatMsgs);
          if (chatMsgs) {
            socket.emit("group messages loaded", chatMsgs.length);
          } else {
            callback("There are no messages!");
          }
          callback();
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // load all group chat messages
      socket.on(
        "load all group messages",
        async ({ slug, groupId, me }, callback) => {
          // console.log(socket.id)
          try {
            let messages;
            messages = await loadAllMessages(slug);
            if (messages) {
              socket.emit("group messages loaded", { messages, to: groupId });
            } else {
              callback("No group messages!");
            }
            callback();
          } catch (err) {
            console.log("err inside catch block", err);
          }
        }
      );

      // New group message
      socket.on(
        "new group message",
        async (
          { student, username, message, slug, group, fileUrl: file },
          callback
        ) => {
          try {
            const user = await getUser(student);
            const stdnt = await getGroupUser(group, student);
            if (user && stdnt) {
              const msg = await addMessage(
                student,
                group,
                message,
                file,
                username
              );
              if (msg) {
                const messages = await loadAllMessages(slug);
                if (messages) {
                  io.emit("group messages loaded", { messages, to: group });
                } else {
                  callback("You have no messages!");
                }
              }
            } else {
              callback("No user found");
            }
            callback();
          } catch (err) {
            console.log("err inside catch block", err);
          }
        }
      );

      // notify users upon disconnection
      socket.on("disconnect", async () => {});
    });


    strapi.db.lifecycles.subscribe({
      models: ["plugin::users-permissions.user"],
      async afterCreate(event) {
        // afterCreate lifeclcyle
      },
      async beforeCreate(event) {
        // beforeCreate lifeclcyle
      },

      async beforeFindOne(event) {
        // beforeFindOne lifeclcyle
      },
      async afterFindOne(event) {
        const { result, params } = event;
        // console.log(event)
        if (params.where.provider && result !== null) {
          await strapi.entityService.update(
            "plugin::users-permissions.user",
            result.id,
            {
              data: {
                online: true,
              },
            }
          );
        }
      },
    });
  },
};
