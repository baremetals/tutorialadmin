const { sendMail } = require("../../../../lib/email");

module.exports = {
  // async beforeCreate(event) {
  // const { data, where, select, populate } = event.params;

  // // let's do a 20% discount everytime
  // // console.log(event, "i am before create");
  // },
  async afterCreate(event) {
    const { params } = event;

    const mailObject = {
      to: "baremetals16@gmail.com",
      username: "Daniel",
      subject: "NEW_SUPPORT_MESSAGE",
      title: params.data.subject,
      message: params.data.body,
      btnText: "Support",
      btnLink: ``,
    };

    await sendMail(mailObject);
  },
};
