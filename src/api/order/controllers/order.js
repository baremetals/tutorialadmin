"use strict";
const stripe = require("stripe")(process.env.STRIPE_SK);
// const sgMail = require("@sendgrid/mail");

const fromDecimalToInt = (number) => parseInt(number * 100);
/**
 *  order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;

    if (!data) {
      return ctx.throw(400, "Please specify a course");
    }

    const course = await strapi.db
      .query("api::course.course")
      .findOne({
        where: { id: data.course },
        populate: { students: true, orders: true },
      });

    if (!course) {
      return ctx.throw(400, "The course does not exist");
    }
    
    const { user } = ctx.state;

    if (course.students.length > 0) {
      const users = course.students;

      const or = users.filter((u) => u.id === user.id);
      // console.log('or');
      if (or.length > 0) {
        return ctx.throw(400, "You previously purchased this course");
      }
    }

    // const entry = await strapi.db
    //   .query("plugin::users-permissions.user")
    //   .findOne({ where: { id: user.id }, populate: { orders: true } });

    // if (entry.orders.length > 0) {
    //   const orders = entry.orders;

    //   const or = orders.filter(order => order.courseId === course.id)
    //   // console.log(or);
    //   if (or.length > 0) {
    //     return ctx.throw(400, "You previously purchased this course");
    //   }
    // }

    
    let session;

    if (!data.isFree && data.total > 0) {
      const BASE_URL = ctx.request.headers.origin || process.env.FRONT_END_HOST;

      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: user.email,
        mode: "payment",
        success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/cancel-payment?session_id={CHECKOUT_SESSION_ID}`,
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: course.title,
              },
              unit_amount: fromDecimalToInt(data.total),
            },
            quantity: data.quantity,
          },
        ],
      });
    } else session = "free-purchase";
    // console.log("here times");
    // Create the order
    const order = await strapi.service("api::order.order").create({
      data: {
        user: user.id,
        course: course.id,
        courseId: course.id,
        total: data.total,
        status: data.isFree ? "free" : "unpaid",
        imageUrl: data.imageUrl,
        quantity: data.quantity,
        orderType: data.orderType,
        checkout_session: data.isFree ? "free-purchase" : session.id,
        publishedAt: Date.now(),
      },
    });
    
    await strapi.service("api::course.course").update(course.id, {
      data: {
        orders: course.orders.concat(order.id),
        students: course.students.concat(user.id),
        totalStudents: course.totalStudents + 1,
      },
    });
    
    const emailTemplate = {
      to: `${user.email}`, // recipient
      from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
      template_id: "d-5ac156026533444c9c559dc29368f392",
      dynamic_template_data: {
        courseTitle: course.title,
        subject: `Order Received`,
        username: `${user.username}`,
        message: data.isFree
          ? "Your order has been processed. You will receive details of the course by email."
          : "Your order is being processed. You will receive payment confirmation shortly.",
      },
    };
    
    await sgMail
      .send(emailTemplate)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.log(`Sending the verify email produced this error: ${error}`);
      });

    return { id: data.isFree ? session : session.id };
  },

  async confirm(ctx, _next) {
    const { checkout_session, cancel } = ctx.request.body;

    const entity = await strapi.db
      .query("api::order.order")
      .findOne({ where: { checkout_session }, populate: { user: true, course: true} });

    const course = await strapi.db.query("api::course.course").findOne({
      where: { id: entity.course.id },
      populate: { students: true },
    });

    if (cancel) {
      await strapi
        .service("api::order.order")
        .delete(entity.id);

      const index = course.students.findIndex((st) => st.id === entity.user.id);
      await strapi
        .service("api::course.course")
        .update(entity.course.id, {
          data: {
            students: course.students.splice(index, 1),
            totalStudents: course.totalStudents - 1,
          },
        });

      return {success: 'order deleted'};
    }

    const session = await stripe.checkout.sessions.retrieve(checkout_session);

    if (session.payment_status === "paid") {
      const updateOrder = await strapi
        .service("api::order.order")
        .update(entity.id, {
          data: {
            status: "paid",
          },
        });
      const sanitizedEntity = await this.sanitizeOutput(updateOrder, ctx);

      const emailTemplate = {
        to: `${entity.user.email}`, // recipient
        from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
        template_id: "d-dc568a7640d04041ab45c6d233cd0de1",
        dynamic_template_data: {
          courseTitle: entity.course.title,
          subject: `Payment Confirmation`,
          username: `${entity.user.username}`,
        },
      };

      await sgMail
        .send(emailTemplate)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.log(`Sending the verify email produced this error: ${error}`);
        });
        
      return this.transformResponse(sanitizedEntity);
    } else {
      ctx.throw(400, "Payment was not successful please try again");
    }
  },
}));
