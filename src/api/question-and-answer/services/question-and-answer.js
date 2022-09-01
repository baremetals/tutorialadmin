'use strict';

/**
 * question-and-answer service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::question-and-answer.question-and-answer');
