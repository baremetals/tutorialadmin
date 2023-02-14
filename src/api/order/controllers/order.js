"use strict";
const stripe = require("stripe")(process.env.STRIPE_SK);
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.EMAIL_API_KEY);

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
    

    const findOrder = await strapi
      .service("api::order.order")
      .find({
        filters: { $and: [{ user: user.id }, { course: course.id }] },
        // populate: { posts: true },
      });

    if (findOrder.results.length > 0) {
      return ctx.throw(400, "You previously purchased this course");
    }

    // console.log(user.id);
    
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



    // Create the order
    const order = await strapi.service("api::order.order").create({
      data: {
        user: user.id,
        course: course.id,
        courseId: data.course,
        total: data.total,
        status: data.isFree ? "free" : "unpaid",
        imageUrl: data.imageUrl || '',
        quantity: data.quantity,
        orderType: data.orderType,
        checkout_session: data.isFree ? "free-purchase" : session.id,
        publishedAt: new Date(),
      },
    });

    // console.log('mate I am dying a painful death: ', order)
    
    await strapi.service("api::course.course").update(course.id, {
      data: {
        orders: course.orders.concat(order.id),
        totalStudents: course.totalStudents + 1,
      },
    });
    
    if (session === "free-purchase") {
      const emailTemplate = {
        to: `${user.email}`, // recipient
        from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
        template_id: "d-5ac156026533444c9c559dc29368f392",
        dynamic_template_data: {
          courseTitle: course.title,
          subject: `Order Received`,
          username: `${user.username}`,
          buttonText: "View Order",
          url: `${process.env.FRONT_END_HOST}home/orders`,
          message: data.isFree
            ? "Your order has been processed. You will receive details of the course by email."
            : "Your order is being processed. You will receive payment confirmation shortly.",
        },
      };
      const adminEmailTemplate = {
        to: `${process.env.ADMIN_EMAIL}`, // recipient
        from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
        template_id: "d-5ac156026533444c9c559dc29368f392",
        dynamic_template_data: {
          courseTitle: course.title,
          subject: `New Free Order Received`,
          username: "Daniel",
          buttonText: "View Order",
          url: `${process.env.APP_URL}admin/content-manager/collectionType/api::order.order/${course.id}`,
          message: `You have a new order from ${user.username}`,
        },
      };
      await sgMail
        .send(emailTemplate)
        .then((res) => {
          console.log("Email sent", res[0].statusCode);
        })
        .catch((error) => {
          console.log(`Sending the verify email produced this error: ${error}`);
        });
      
      await sgMail
        .send(adminEmailTemplate)
        .then((res) => {
          console.log("Email sent", res[0].statusCode);
        })
        .catch((error) => {
          console.log(`Sending the verify email produced this error: ${error}`);
        });
    }
      

    return { id: data.isFree ? session : session.id };
  },

  async confirm(ctx, _next) {
    const { checkout_session, cancel } = ctx.request.body;

    const entity = await strapi.db
      .query("api::order.order")
      .findOne({ where: { checkout_session }, populate: { user: true, course: true} });

    const course = await strapi.db.query("api::course.course").findOne({
      where: { id: entity.course.id },
    });

    const { user } = ctx.state;

    if (cancel) {
      // console.log(entity.user)
      strapi
        .service("api::order.order")
        .delete(entity.id);
      
      const adminEmailTemplate = {
        to: `${process.env.ADMIN_EMAIL}`, // recipient
        from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
        template_id: "d-5ac156026533444c9c559dc29368f392",
        dynamic_template_data: {
          courseTitle: course.title,
          subject: `Change of Mind`,
          username: "Daniel",
          buttonText: "View User",
          url: `${process.env.APP_URL}admin/content-manager/collectionType/plugin::users-permissions.user/${user.id}`,
          message: `${user.username}, cancel making a purchase. Find out why`,
        },
      };
      await sgMail
        .send(adminEmailTemplate)
        .then((res) => {
          console.log("Email sent", res[0].statusCode);
        })
        .catch((error) => {
          console.log(`Sending the verify email produced this error: ${error}`);
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
          buttonText: "View Order",
          url: `${process.env.FRONT_END_HOST}home/orders`,
        },
      };

      const adminEmailTemplate = {
        to: `${process.env.ADMIN_EMAIL}`, // recipient
        from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
        template_id: "d-5ac156026533444c9c559dc29368f392",
        dynamic_template_data: {
          courseTitle: course.title,
          subject: `New Order Received`,
          username: "Daniel",
          buttonText: "View Order",
          url: `${process.env.APP_URL}admin/content-manager/collectionType/api::order.order/${course.id}`,
          message: `You have a new order from ${user.username}`,
        },
      };

      await sgMail
        .send(emailTemplate)
        .then((res) => {
          console.log("Email sent", res[0].statusCode);
        })
        .catch((error) => {
          console.log(`Sending the verify email produced this error: ${error}`);
        });

      await sgMail
        .send(adminEmailTemplate)
        .then((res) => {
          console.log("Email sent", res[0].statusCode);
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
