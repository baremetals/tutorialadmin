const { sendMail } = require("../../../../lib/email");

module.exports = {
  // async beforeCreate(event) {
  // const { data, where, select, populate } = event.params;

  // // let's do a 20% discount everytime
  // // console.log(event, "i am before create");
  // },
  async afterCreate(event) {
    const { params } = event;

    const post = await strapi.db.query("api::post.post").findOne({
      where: { id: params.data.post },
      populate: { creator: true },
    });

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { id: params.data.user } });

    await strapi.service("api::notification.notification").create({
      data: {
        from: user?.username,
        title: "new comment",
        body: `${user?.username} commented on your post - ${post.title}.`,
        type: "NEW_COMMENT",
        user: post.creator.id,
        image: user.img,
        publishedAt: new Date(),
      },
    });

    const mailObject = {
      to: post.creator.email,
      username: post.creator.username,
      subject: "NEW_COMMENT",
      title: "You have a new comment.",
      message: `${user?.username} commented on your post`,
      btnText: "View Comment",
      btnLink: `forum/${post.slug}`,
    };

    await sendMail(mailObject);
  },
};
