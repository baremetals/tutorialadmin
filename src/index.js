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
  getUnReadCourseNotifications,
  newCourseChat,
  getCourseUser,
} = require("../config/course");

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
    console.log(process.env.FRONT_END_HOST);
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: process.env.FRONT_END_HOST,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
      },
    });

    io.on("connection", async function (socket) {
      // console.log(socket);
      const userId = socket.handshake.auth.id;
      socket.join(userId);
      console.log({ userId });
      socket.on("joinroom", async ({ me }) => {
        console.log("JOIN ROOMED CALLED ", me);
        socket.join(me);
      });

      // Join Course Group Chat
      socket.on("joincourseroom", async ({ slug }) => {
        console.log("mate life is hard bro ", slug);
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

      // socket.on("connected", async ({ id, sessionID }) => {
      //   // console.log("id", userID);
      //   socket.sessionID = sessionID;
      //   socket.userID = id;
      //   socket.username = sessionID;
      //   socket.id = id;
      // });

      // For searching for a user on the frontend
      socket.on("getallusers", async ({ targetValue, me }, callback) => {
        console.log({ users });

        const to = users.filter((usr) => usr.username.includes(targetValue));
        console.log({ to });
        const fU = chatsOfUsers.filter(
          (cou) => cou?.owner?.id == me || cou?.recipient?.id == me
        );
        console.log(fU.length, "userId");

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
            console.log({ slug, username, me }, "====>slug");
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
          console.log("socket call");
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
            console.log("socket call getusersbyusername");

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
          console.log("creating new chat");
          console.log({ recipient });
          try {
            const chat = await existingChat(slug);
            console.log({ chat });
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
              console.log({ recipient }, " i am living");
              // if (chat?.user !== null) {
              const u = await getUserByUsername(recipient);
              console.log("user I am here", u);
              const newChat = await createNewChat(owner, u?.id, body, slug);
              console.log({ slug });
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
              console.log({ chatMsgs }, "=================>");
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
          console.log({ sender, chatId, body, receiver });
          console.log("responding a message", userId);
          try {
            const user = await getUser(sender);
            if (user) {
              const msg = await respondToChat(sender, chatId, body, receiver);
              // console.log({ sender, chatId, body, receiver  , msg});

              const s = msg?.chat?.slug;
              const messages = await loadAllChatMessages(s);
              // console.log("mated");
              if (messages) {
                // socket.emit("getsinglechatnotification" , msg )
                // const msgGet = await editChatMsgRead(msg?.id, msg?.isRead);
                // console.log({msgGet})
                socket.emit("messages loaded", messages);

                // socket.emit("message", msg);
              } else {
                callback("You have no messages!");
              }

              // const receiverUser = await getUser(receiver)

              // io.to(receiver).to(sender).emit("message", msg);
              // io.to(sender).emit("message", msg);
              // socket.emit("message", msg);

              // const messages = await loadAllChatMessages(slug);
              // // console.log("mated");
              // if (messages) {
              //   socket.emit("messages loaded", messages);
              // } else {
              //   callback("You have no messages!");
              // }

              socket.to(receiver).emit("messages loaded", messages);

              const chatMsgs = await fetchUnReadNotifications(receiver);
              socket.to(receiver).emit("getsinglechatnotification", {
                msg,
              });

              const chat = await loadAllChats(receiver);

              // console.log({ chatMsgs } , "=================>");
              // console.log(chatMsgs);
              if (chatMsgs) {
                console.log("Chat messages");
                console.log({ receiver });
                // socket.to(receiver).emit("chatMsgs loaded", chatMsgs.length);
                io.in(receiver).emit("chatMsgs loaded", chatMsgs.length);
                io.to(receiver).emit("chatMsgs loaded", chatMsgs.length);
                io.to(receiver).emit("chats loaded", {
                  chat,
                  to: receiver,
                });
              } else {
                callback("You have no chatMsgs!");
              }

              // socket.to(userId).emit("message", {
              //   msg,
              //   from: sender,
              //   to: receiver,
              // });

              // socket.emit("message", {
              //   msg,
              //   from: sender,
              //   to: receiver,
              // });
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
        console.log("editing a message", data.data);
        try {
          const user = await getUserByUsername(data.data.username);
          if (user) {
            const msg = await editChatMsg(data.data.msgId, data.data.body);
            console.log({ msg });
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
        console.log("editing a message isRead field");
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
        console.log("deleting a message", { data });
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

      // load all unread course notifications
      socket.on("load unread course messages", async ({ id }, callback) => {
        try {
          console.log("socket course call");
          const chatMsgs = await getUnReadCourseNotifications(id);
          // console.log(chatMsgs);
          if (chatMsgs) {
            socket.emit("course messages loaded", chatMsgs.length);
          } else {
            callback("There are no messages!");
          }
          callback();
        } catch (err) {
          console.log("err inside catch block", err);
        }
      });

      // load all course chat messages
      socket.on(
        "load all course messages",
        async ({ slug, courseId, me }, callback) => {
          // console.log(socket.id)
          try {
            let messages;
            console.log({ slug, me, courseId }, "====>slug");
            // const getuser = await getCourseUserById(id); Todo: create this function
            messages = await loadAllMessages(slug);
            // let ids = [];
            // console.log({ messages }, "==>messages");
            // messages.map((e) => {
            //   if (e.read == false && e?.student?.id == me) {
            //     ids.push(e.id);
            //   }
            // });
            // console.log({ ids });
            // const doRead = await editMsgReadBulk(ids);
            // const chatMsgs = await getUnReadCourseNotifications(me); Todo: change this method
            // console.log(chatMsgs.length);
            // console.log(chatMsgs);
            // if (chatMsgs) {
            //   socket.emit("chatMsgs loaded", chatMsgs.length);
            // }
            // console.log(messages);
            if (messages) {
              // console.log(messages[0] , "===>messages");
              // socket.emit("emptyusers", []);
              // socket.emit("load all chats", { id: me });
              // socket.emit("course messages loaded", messages);
              socket.emit("course messages loaded", { messages, to: courseId });
            } else {
              callback("No course messages!");
            }
            callback();
          } catch (err) {
            console.log("err inside catch block", err);
          }
        }
      );

      // New course message
      socket.on(
        "new course message",
        async ({ student, username, message, slug, course, file }, callback) => {
          // console.log({ student, username, message, slug, course, file });
          try {
            const user = await getUser(student);
            const stdnt = await getCourseUser(course, student);
            // console.log(stdnt.id);
            if (user && stdnt) {
              const msg = await addMessage(
                student,
                course,
                message,
                file,
                username
              );
              if (msg) {
                const messages = await loadAllMessages(slug);
                if (messages) {
                  io.emit("course messages loaded", { messages, to: course });
                } else {
                  callback("You have no messages!");
                }
              }
              
              
              // const chatMsgs = await getUnReadCourseNotifications(course);
              // socket.to(course).emit("getsinglechatnotification", {
              //   msg,
              // });

              // if (chatMsgs) {
              //   console.log("Chat messages");
              //   console.log({ course });
              //   // socket.to(receiver).emit("chatMsgs loaded", chatMsgs.length);
              //   io.in(course).emit("chatMsgs loaded", chatMsgs.length);
              //   io.to(course).emit("chatMsgs loaded", chatMsgs.length);

              // } else {
              //   callback("You have no chatMsgs!");
              // }
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
        if (params.where.provider) {
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
