"use strict";
const stripe = require("stripe")(process.env.STRIPE_SK);

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
      console.log('or');
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
        cancel_url: BASE_URL,
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
        TotalStudents: course.TotalStudents + 1,
      },
    });

    return { id: data.isFree ? session : session.id };
  },

  async confirm(ctx, next) {
    const { checkout_session } = ctx.request.body;
    console.log(ctx.request.body);
    const entity = await strapi.db
      .query("api::order.order")
      .findOne({ where: { checkout_session } });
    // console.log(checkout_session);

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
      return this.transformResponse(sanitizedEntity);
    } else {
      ctx.throw(400, "Payment was not successful please try again");
    }
  },
}));
