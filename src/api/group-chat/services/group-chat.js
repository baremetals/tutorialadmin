'use strict';

/**
 * group-chat service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::group-chat.group-chat');
