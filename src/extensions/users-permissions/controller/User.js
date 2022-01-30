"use strict";

/**
 * User.js controller
 *
 * @description: A set of functions called "actions" for managing `User`.
 */

const _ = require("lodash");
const utils = require("@strapi/utils");
// const { getService } = require("../utils");
// const {
//   validateCreateUserBody,
//   validateUpdateUserBody,
// } = require("./validation/user");

const { sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

const sanitizeOutput = (user, ctx) => {
  const schema = strapi.getModel("plugin::users-permissions.user");
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(user, schema, { auth });
};

module.exports = {
  async me(ctx) {
    const user = {
        id,
        username,
        email,
        confirmed,
        profileImage,
        slug
    } = ctx.state.user;

    if (!user) {
      return ctx.unauthorized();
    }

    ctx.body = await sanitizeOutput(user, ctx);
  },
};