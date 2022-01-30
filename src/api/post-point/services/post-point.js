'use strict';

/**
 * post-point service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::post-point.post-point');
