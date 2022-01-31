'use strict';

/**
 * users-chat service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::users-chat.users-chat');
