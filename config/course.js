
async function addMessage(student, course, message, file, username) {

  try {

    const entry = await strapi
      .service("api::course-message.course-message")
      .create({
        data: {
          message: message ? message : null,
          student,
          file: file,
          course,
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
      .query("api::course-message.course-message")
      .findOne({
        where: { id: entry.id },
        populate: { student: true, file: true },
      });
    return msg;
  } catch (err) {
    console.log("error while creating", err);
  }
}

// create a new course message
async function newCourseChat(course, user, message, slug) {
  console.log({ body }, "hello there");
  try {
    const chat = await strapi.service("api::course-chat.course-chat").create({
      data: {
        course,
        slug,
        publishedAt: new Date(),
      },
    });

    console.log({ chat });

    const entry = await strapi
      .service("api::course-message.course-message")
      .create({
        data: {
          message,
          user,
          chat,
          publishedAt: new Date(),
        },
      });

    await strapi.entityService.update("api::course-chat.course-chat", chat.id, {
      data: {
        message: [entry.id],
      },
    });

    const getChat = await strapi.db
      .query("api::course-chat.course-chat")
      .findOne({
        where: { id: chat.id },
        populate: { course: true },
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
      "api::course-message.course-message",
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
      "api::course-message.course-message",
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
      .query("api::course-message.course-message")
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
      "api::course-message.course-message",
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
      .query("api::course-message.course-message")
      .findMany({
        where: { course: { slug } },
        orderBy: { createdAt: "asc" },
        // offset: 15,
        populate: { student: true, file: true },
      });

    return entry;
  } catch (err) {
    console.log("Error occured when fetching user", err);
  }
}

async function getUnReadCourseNotifications(id) {
  try {
    // console.log(id)
    const entry = await strapi.db
      .query("api::course-message.course-message")
      .findMany({
        where: {
          $and: [{ course: { id } }, { read: false }],
        },
      });
    return entry;
  } catch (err) {
    console.log("error while fetching", err);
  }
}

async function getCourseUser(course, student) {
  try {
    // console.log(course);
    // console.log(student);
    const entry = await strapi.db
      .query("api::course.course")
      .findOne({ where: { id: course }, populate: { students: true } });

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
  getUnReadCourseNotifications,
  newCourseChat,
  getCourseUser,
};
