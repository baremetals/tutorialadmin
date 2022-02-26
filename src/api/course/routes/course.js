'use strict';

/**
 * course router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter("api::course.course", {
  prefix: "",
  only: ["find", "findOne", "count", "update", "delete"],
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    update: {},
    delete: {},
  },
});
