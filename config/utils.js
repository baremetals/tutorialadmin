async function createNewChat(owner, recipient, body, slug) {
  // console.log(owner, recipient, slug)
  try {
    const chat = await strapi.service("api::chat.chat").create({
      data: {
        owner,
        recipient,
        slug,
        publishedAt: new Date(),
      },
    });

    await strapi.service("api::chat-msg.chat-msg").create({
      data: {
        body,
        sender: owner,
        receiver: recipient,
        chat: chat.id,
        slug: chat.slug,
        publishedAt: new Date(),
      },
    });

    const getChat = await strapi.db
      .query("api::chat.chat")
      .findOne({
        where: { id: chat.id },
        populate: { owner: true, recipient: true },
      });

    return getChat;
    
  } catch (err) {
    console.log("error while creating", err);
  }
}

async function respondToChat(sender, chat, body, receiver) {
  // console.log(body)
  try {
    const entry = await strapi.service("api::chat-msg.chat-msg").create({
      data: {
        body,
        sender,
        receiver,
        chat,
        publishedAt: new Date(),
      },
    });

    const msg = await strapi.db
      .query("api::chat-msg.chat-msg")
      .findOne({ where: { id: entry.id }, populate: { sender: true } });
    // console.log(msg)
    return msg;
  } catch (err) {
    console.log("error while creating", err);
  }
}

async function getUser(id) {
  try {
    // console.log(id)
    const entry = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { id } });
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function getUserByUsername(username) {
  try {
    const entry = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { username } });
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function existingChat(username, slug) {
  try {
    const entry = await strapi.db
      .query("api::chat.chat")
      .findOne({ where: { slug } });
    // console.log("chatExists", entry);
    return entry;
  } catch (err) {
    console.log("Error occured when fetching user", err);
  }
}

async function editChatMsg (id, body) {
    try {
      const entry = await strapi.service
        .update("api::chat-msg.chat.msg", id, {
            data: {
                body
            }
        })
      return entry;
    } catch (err) {
      console.log("error while fetching", err);
    }
}

async function editChatMsgRead(id, body) {
  try {
    const entry = await strapi.service.update("api::chat-msg.chat.msg", id, {
      data: {
        isRead: true,
      },
    });
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function deleteChatMsg(id) {
  try {
    const entry = await strapi.service.delete("api::chat-msg.chat-msg", id);
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function deleteChat(id) {
  try {
    const entry = await strapi.service.delete("api::chat.chat", id);
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}


async function loadAllChats(id) {
  // console.log(' i tried to get here')
  try {
    const entry = await strapi.db.query("api::chat.chat").findMany({
      where: {
        $or: [{ owner: { id: id } }, { recipient: { id: id } }],
      },
      orderBy: { updatedAt: "desc" },
      populate: { owner: true, recipient: true },
    });

    return entry
  } catch (err) {
    console.log("Error occured when fetching user", err);
  }
}

async function loadAllChatMessages(slug) {
  // console.log(' i tried to get here')
  try {
    const entry = await strapi.db.query("api::chat-msg.chat-msg").findMany({
      where: { chat: { slug } },
      orderBy: { createdAt: "asc" },
      // offset: 15,
      populate: { sender: true, receiver: true, chat: true },
    });
    return entry;
  } catch (err) {
    console.log("Error occured when fetching user", err);
  }
}

async function fetchAllusers() {
  try {
    // console.log(id)
    const entry = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({ where: { online: true } });
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function fetchUnReadNotifications(id) {
  try {
    // console.log(id)
    const entry = await strapi.db.query("api::chat-msg.chat-msg").findMany({
      where: {
        $and: [{ receiver: { id } }, { isRead: false }],
      },
    });
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

module.exports = {
  createNewChat,
  respondToChat,
  getUser,
  existingChat,
  editChatMsg,
  deleteChatMsg,
  deleteChat,
  editChatMsgRead,
  getUserByUsername,
  loadAllChatMessages,
  loadAllChats,
  fetchAllusers,
  fetchUnReadNotifications,
};
