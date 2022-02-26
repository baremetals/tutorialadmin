const { sendMail } = require("../../../../lib/email");

module.exports = {
  // async beforeCreate(event) {
  // const { data, where, select, populate } = event.params;

  // // let's do a 20% discount everytime
  // // console.log(event, "i am before create");
  // },
  async afterCreate(event) {
    const { params } = event;

    // console.log("i am the results", event);
    // console.log("i am the params", params);

    const course = await strapi.db.query("api::course.course").findOne({
      where: { id: params.data.course },
      populate: { teacher: true },
    });
    console.log(course);

    const teacher = await strapi.db.query("api::teacher.teacher").findOne({
      where: { id: course.teacher.id },
      populate: { tutor: true },
    });
    console.log(teacher);

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { id: params.data.user } });

    await strapi.service("api::notification.notification").create({
      data: {
        from: user?.slug,
        title: "You have a new student",
        body: `${user?.username} has joined your course - ${course.title}.`,
        type: "JOINED_COURSE",
        user: teacher.tutor.id,
        image: user.img,
        publishedAt: new Date(),
      },
    });

    const mailObject = {
      to: teacher.tutor.email,
      username: teacher.tutor.fullName,
      subject: "NEW_STUDENT",
      title: "You have a new student.",
      message: `${user.username} has joined your course - ${course.title}.`,
      btnText: "View User",
      btnLink: `user-profile/${user.slug}`,
    };

    await sendMail(mailObject);
  },
};

