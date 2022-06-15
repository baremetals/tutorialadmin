'use strict';
const stripe = require('stripe')(process.env.STRIPE_SK);

const fromDecimalToInt = (number) => parseInt(number * 100)
/**
 *  order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;
    console.log(data);

    if (!data) {
      return ctx.throw(400, "Please specify a course");
    }
    const course = await strapi
      .service("api::course.course")
      .findOne(data.course);

    if (!course) {
      return ctx.throw(400, "The course does not exist");
    }

    const { user } = ctx.state;

    const BASE_URL = ctx.request.headers.origin || process.env.FRONT_END_HOST;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      mode: "payment",
      success_url: `${BASE_URL}/home/orders/success?session_id={CHECKOUT_SESSION_ID}`,
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

    // Create the order
    await strapi.service("api::order.order").create({
      data: {
        user: user.id,
        course: course.id,
        total: data.total,
        status: "unpaid",
        quantity: data.quantity,
        checkout_session: session.id,
        publishedAt: Date.now(),
      },
    });

    return { id: session.id };
  },

  async confirm(ctx, next) {
    const { checkout_session } = ctx.request.body;
    console.log(ctx.request.body);
    const entity = await strapi.db
      .query("api::order.order")
      .findOne({ where: { checkout_session } });
    // console.log(checkout_session);

    const session = await stripe.checkout.sessions.retrieve(
      checkout_session
    );

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