const { sendMail } = require("../../../../lib/email");

module.exports = {
  // async beforeCreate(event) {
  // const { data, where, select, populate } = event.params;

  // // let's do a 20% discount everytime
  // // console.log(event, "i am before create");
  // },
  async afterCreate(event) {
    const { params } = event;

    const course = await strapi.db.query("api::course.course").findOne({
      where: { id: params.data.course },
      populate: { teacher: true, students: true },
    });

    const students = course.students;

    const teacher = await strapi.db.query("api::teacher.teacher").findOne({
      where: { id: course.teacher.id },
      populate: { tutor: true },
    });

    students.forEach(async function (student) {

        const usr = await strapi.db
          .query("api::student.student")
          .findOne({ where: { id: student.id }, populate: { user: true } });

        await strapi.service("api::notification.notification").create({
          data: {
            from: teacher.tutor.fullName,
            title: "Latest course video",
            body: `The latest course video for - '${course.title}' is now available.`,
            type: "NEW_COURSE_VIDEO",
            user: usr.user.id,
            image: teacher.tutor.img,
            publishedAt: new Date(),
          },
        });

        const mailObject = {
          to: usr.user.email,
          username: usr.user.username,
          subject: "NEW_COURSE_VIDEO",
          title: params.data.title,
          message: `The latest course video for - '${course.title}' is now available.`,
          btnText: "Watch Video",
          btnLink: course.slug,
        };

        await sendMail(mailObject);

    });
  },
};
