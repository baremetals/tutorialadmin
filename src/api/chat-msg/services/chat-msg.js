'use strict';

/**
 * chat-msg service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::chat-msg.chat-msg');
