'use strict';

/**
 *  search controller
 */

const { createCoreController } = require('@strapi/strapi').factories;


module.exports = createCoreController("api::search.search", ({ strapi }) => ({
  async find(ctx) {
    async function getBody(rawrequest) {
      let semaphore = new Promise((resolve, reject) => {
        let bodycontent = "";
        rawrequest.on("data", (datapart) => {
          bodycontent += datapart;
        });
        rawrequest.on("end", () => {
          resolve(JSON.parse(bodycontent));
        });
        rawrequest.on("error", () => {
          reject("Error");
        });
      });
      return semaphore;
    }

    const resp = await getBody(ctx.req)
      .then((bodydata) => {
        return bodydata;
      })
      .catch((error) => {
        console.log("There was an error reading out the body" + error);
      });

      const posts = await strapi.service("api::post.post").find({
        filters: {
          title: { $containsi: resp.term },
        },
        populate: { creator: true },
      });

    const courses = await strapi.service("api::course.course").find({
      filters: {
        title: { $containsi: resp.term },
      },
    });
    let users = []
    const userEntities = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({ where: { username: resp.term } || { fullName: resp.term } });

      console.log(users);
    userEntities.forEach((usr) => {
      users.push({
        id: usr.id,
        username: usr.username,
        fullName: usr.fullName,
        img: usr.img,
        description: usr.description,
        location: usr.location,
        slug: usr.slug,
        createdAt: usr.createdAt,
      });
    });

    const sanitizedUsers = await this.sanitizeOutput(users, ctx)
    const sanitizedPosts = await this.sanitizeOutput(posts, ctx);
    const sanitizedCourses = await this.sanitizeOutput(courses, ctx);

    return this.transformResponse([
      {sanitizedUsers},
      {sanitizedPosts},
      {sanitizedCourses}
    ]);
  },
}));
