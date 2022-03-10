const { sendMail } = require("../../../../lib/email");

module.exports = {
  // async beforeCreate(event) {
  // const { data, where, select, populate } = event.params;

  // // let's do a 20% discount everytime
  // // console.log(event, "i am before create");
  // },
  async afterCreate(event) {
    const { params, result } = event;

    // console.log(event);


    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: params.data.creator },
        populate: { posts: true },
      });

        await strapi.entityService.update(
          "plugin::users-permissions.user",
          params.data.creator,
          {
            data: {
              posts: user.posts.concat(result.id),
            },
          }
        );

    await strapi.service("api::notification.notification").create({
      data: {
        from: user?.username,
        title: "new post",
        body: `${user?.username} your post - ${params.data.title} has been created.`,
        type: "NEW_POST",
        user: params.data.creator,
        image: "BM",
        publishedAt: new Date(),
      },
    });

    const mailObject = {
      to: user?.email,
      username: user?.username,
      subject: "NEW_POST",
      title: "You created a new post.",
      message: `${user?.username} your post - ${params.data.title} has been created.`,
      btnText: "View Post",
      btnLink: `forum/${params.data.slug}`,
    };

    await sendMail(mailObject);
  },
};
