'use strict';

/**
 *  course controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController("api::course.course", ({ strapi }) => ({
  async findOne(ctx) {
    //   console.log(ctx)
    // const { slug } = ctx.params;
    const { id: slug } = ctx.params;
    const { query } = ctx;
    
    console.log("we came here");
    if (!query.filters) query.filters = {};
    query.filters.slug = { '$eq': slug };
    const entity = await strapi
      .service("api::course.course")
      .find(query);
    console.log(entity);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },
}));
