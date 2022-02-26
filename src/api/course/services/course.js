'use strict';

/**
 * course service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService("api::course.course", ({ strapi }) => ({
  // Method 3: Replacing a core service
  async findOne(slug, params = {}) {
    return strapi.entityService.findOne(
      "api::course.course",
      slug,
      this.getFetchParams(params)
    );
  },
}));
