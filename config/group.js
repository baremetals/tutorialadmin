
async function addMessage(student, group, message, file, username) {
  try {
    // console.log(file)
    const entry = await strapi
      .service("api::group-message.group-message")
      .create({
        data: {
          message: message ? message : null,
          student,
          file: file,
          group,
          type: !file ? "text" : "file",
          allRead: false,
          hasRead: [
            {
              id: student,
              read: true,
              username,
            },
          ],
          publishedAt: new Date(),
        },
      });

    // console.log(entry);

    const msg = await strapi.db
      .query("api::group-message.group-message")
      .findOne({
        where: { id: entry.id },
        populate: { student: true, file: true },
      });
    return msg;
  } catch (err) {
    console.log("error while creating", err);
  }
}

// create a new group message
async function newGroupChat(group, user, message, slug) {
  console.log({ body }, "hello there");
  try {
    const chat = await strapi.service("api::group-chat.group-chat").create({
      data: {
        group,
        slug,
        publishedAt: new Date(),
      },
    });

    console.log({ chat });

    const entry = await strapi
      .service("api::group-message.group-message")
      .create({
        data: {
          message,
          user,
          chat,
          publishedAt: new Date(),
        },
      });

    await strapi.entityService.update("api::group-chat.group-chat", chat.id, {
      data: {
        message: [entry.id],
      },
    });

    const getChat = await strapi.db
      .query("api::group-chat.group-chat")
      .findOne({
        where: { id: chat.id },
        populate: { group: true },
      });

    console.log({ getChat });
    return getChat;
  } catch (err) {
    console.log("error while creating", err);
  }
}

async function editMsg(id, message) {
  try {
    console.log(id, body, "==>id,message");
    const entry = await strapi.entityService.update(
      "api::group-message.group-message",
      id,
      {
        data: {
          message,
        },
      }
    );
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function editMsgRead(id, body) {
  try {
    const entry = await strapi.entityService.update(
      "api::group-message.group-message",
      id,
      {
        data: {
          read: true,
        },
      }
    );
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function editMsgReadBulk(ids, body) {
  try {
    const entry = await strapi.db
      .query("api::group-message.group-message")
      .updateMany({
        where: {
          id: ids,
        },
        data: {
          read: true,
        },
      });
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function deleteMsg(id) {
  try {
    const entry = await strapi.entityService.delete(
      "api::group-message.group-message",
      id
    );
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function loadAllMessages(slug) {
  // console.log(' i tried to get here')
  try {
    const entry = await strapi.db
      .query("api::group-message.group-message")
      .findMany({
        where: { group: { slug } },
        orderBy: { createdAt: "asc" },
        // offset: 15,
        populate: { student: true, file: true },
      });

    return entry;
  } catch (err) {
    console.log("Error occured when fetching user", err);
  }
}

async function getUnReadGroupNotifications(id) {
  try {
    // console.log(id)
    const entry = await strapi.db
      .query("api::group-message.group-message")
      .findMany({
        where: {
          $and: [{ group: { id } }, { read: false }],
        },
      });
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function getGroupUser(group, student) {
  try {
    // console.log(group);
    // console.log(student);
    const entry = await strapi.db
      .query("api::group.group")
      .findOne({ where: { id: group }, populate: { students: true } });

    const user = await entry.students.filter((ele) => ele.id === student);
    // console.log(user[0]);
    return user[0];
  } catch (err) {
    console.log("error while fetching", err);
  }
}

module.exports = {
  addMessage,
  editMsg,
  editMsgRead,
  editMsgReadBulk,
  deleteMsg,
  loadAllMessages,
  getUnReadGroupNotifications,
  newGroupChat,
  getGroupUser,
};
