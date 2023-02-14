const confirm_email = require("./email-template/confirm_email");
const reset = require("./email-template/reset_password");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.EMAIL_API_KEY);

const crypto = require("crypto");
const _ = require("lodash");
const utils = require("@strapi/utils");
const bcrypt = require("bcryptjs");
const urlJoin = require("url-join");
const {
  validateCallbackBody,
  validateRegisterBody,
  validateSendEmailConfirmationBody,
} = require("./validation/auth");

const { getAbsoluteServerUrl, sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

const getService = (name) => {
  return strapi.plugin("users-permissions").service(name);
};
module.exports = (plugin) => {
  plugin.controllers.user.find = (ctx) => {
    console.log(ctx, "I am the find ctx");
  };

  plugin.controllers.auth.forgotPassword = async (ctx) => {
    let { email } = ctx.request.body;

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(email);

    if (isEmail) {
      email = email.toLowerCase();
    } else {
      throw new ValidationError("Please provide a valid email address");
    }

    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    // Find the user by email.
    const user = await strapi
      .query("plugin::users-permissions.user")
      .findOne({ where: { email: email.toLowerCase() } });

    // User not found.
    if (!user) {
      throw new ApplicationError("This email does not exist");
    }

    // User blocked
    if (user.blocked) {
      throw new ApplicationError("This user is disabled");
    }

    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString("hex");

    const settings = await pluginStore
      .get({ key: "email" })
      .then((storeEmail) => {
        try {
          return storeEmail["reset_password"].options;
        } catch (error) {
          return {};
        }
      });

    const advanced = await pluginStore.get({
      key: "advanced",
    });

    const userInfo = await sanitizeUser(user, ctx);

    settings.message = reset.html

    settings.message = await getService("users-permissions").template(
      settings.message,
      {
        URL: advanced.email_reset_password,
        USER: userInfo,
        TOKEN: resetPasswordToken,
      }
    );
    
    // console.log(email, "my nigger");

    settings.object = await getService("users-permissions").template(
      settings.object,
      {
        USER: userInfo,
      }
    );
      // console.log(email, "real nigger");
      const emailTemplate = {
        to: `${user.email}`, // recipient
        from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
        template_id: "d-4af2d25542694429ad152637ff8b2d26",
        dynamic_template_data: {
          subject: `Reset Password`,
          username: `${user.username}`,
          url: `${advanced.email_reset_password}/?code=${resetPasswordToken}`, //`"<%= URL %>?code=<%= TOKEN %>`,
          firstLine: "We heard that you lost your password. Sorry about that!.",
          secondLine: `But don’t worry! You can use the button above to reset
                        your password.`,
          buttonText: "Reset Password",
        },
      };
    try {
        await sgMail
          .send(emailTemplate)
          .then((res) => {
            console.log("Email sent", res[0].statusCode);
          })
          .catch((error) => {
            console.log(
              `Sending the verify email produced this error: ${error}`
            );
          });

      // Send an email to the user.
      // await strapi
      //   .plugin("email")
      //   .service("email")
      //   .send({
      //     to: user.email,
      //     from:
      //       settings.from.email || settings.from.name
      //         ? `${settings.from.name} <${settings.from.email}>`
      //         : undefined,
      //     replyTo: settings.response_email,
      //     subject: settings.object,
      //     text: settings.message,
      //     html: settings.message,
      //   });
    } catch (err) {
      throw new ApplicationError(err.message);
    }

    // Update the user.
    await strapi
      .query("plugin::users-permissions.user")
      .update({ where: { id: user.id }, data: { resetPasswordToken } });

    ctx.send({ ok: true });
  };

  plugin.controllers.auth.register = async (ctx) => {
    
    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    const settings = await pluginStore.get({ key: "advanced" });

    if (!settings.allow_register) {
      throw new ApplicationError("Register action is currently disabled");
    }

    const params = {
      ..._.omit(ctx.request.body, [
        "confirmed",
        "blocked",
        "confirmationToken",
        "resetPasswordToken",
        "provider",
      ]),
      provider: "local",
    };

    await validateRegisterBody(params);

    const role = await strapi
      .query("plugin::users-permissions.role")
      .findOne({ where: { type: settings.default_role } });

    if (!role) {
      throw new ApplicationError("Impossible to find the default role");
    }

    const { email, username, provider } = params;

    const identifierFilter = {
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() },
        { username },
        { email: username },
      ],
    };

    const conflictingUserCount = await strapi
      .query("plugin::users-permissions.user")
      .count({
        where: { ...identifierFilter, provider },
      });
    
    if (conflictingUserCount > 0) {
      throw new ApplicationError("Email or Username are already taken");
    }

    if (settings.unique_email) {
      const conflictingUserCount = await strapi
        .query("plugin::users-permissions.user")
        .count({
          where: { ...identifierFilter },
        });

      if (conflictingUserCount > 0) {
        throw new ApplicationError("Email or Username are already taken");
      }
    }

    const newUser = {
      ...params,
      role: role.id,
      email: email.toLowerCase(),
      username,
      confirmed: !settings.email_confirmation,
    };

    const user = await getService("user").add(newUser);

    const sanitizedUser = await sanitizeUser(user, ctx);

    if (settings.email_confirmation) {
      try {
        await sendConfirmationEmail(sanitizedUser);
      } catch (err) {
        throw new ApplicationError(err.message);
      }

      return ctx.send({ user: sanitizedUser });
    }

    const jwt = getService("jwt").issue(_.pick(user, ["id"]));

    return ctx.send({
      jwt,
      user: sanitizedUser,
    });

    


   

  

    // try {
    //   if (!settings.email_confirmation) {
    //     params.confirmed = true;
    //   }

    //   const usr = await getService("user").add(params);

    //   const sanitizedUser = await sanitizeUser(usr, ctx);

    //   if (settings.email_confirmation) {
    //     try {
    //       await sendConfirmationEmail(sanitizedUser);
    //     } catch (err) {
    //       throw new ApplicationError(err.message);
    //     }

    //     return ctx.send({ user: sanitizedUser });
    //   }

    //   const jwt = getService("jwt").issue(_.pick(usr, ["id"]));

    //   return ctx.send({
    //     jwt,
    //     user: sanitizedUser,
    //   });
    // } catch (err) {
    //   // console.log("fucling print:", err.details.errors[0]);
    //   // console.log("pagans print:", err);
    //   if (
    //     _.includes(
    //       err.details.errors[0].message,
    //       "This attribute must be unique"
    //     )
    //   ) {
    //     // console.log("rass print", _.includes(err.details.errors[0]));
    //     throw new ApplicationError("Username already taken");
    //   } else if (_.includes(err.message, "email")) {
    //     throw new ApplicationError("Email already taken");
    //   }  else if (_.includes(err.message, "password")) {
    //     throw new ApplicationError(err.message);
    //   } else {
    //     // strapi.log.error(err);
    //     throw new ApplicationError("An error occurred during account creation");
    //   }
    // }
  }

  const sendConfirmationEmail = async (user) => {
    // console.log(user, "I am in this bitch");
    const userPermissionService = getService("users-permissions");
    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });
    const userSchema = strapi.getModel("plugin::users-permissions.user");

    const settings = await pluginStore
      .get({ key: "email" })
      .then((storeEmail) => storeEmail["email_confirmation"].options);

    // Sanitize the template's user information
    const sanitizedUserInfo = await sanitize.sanitizers.defaultSanitizeOutput(
      userSchema,
      user
    );

    const confirmationToken = crypto.randomBytes(20).toString("hex");

    await edit(user.id, { confirmationToken });

    const apiPrefix = strapi.config.get("api.rest.prefix");

    settings.message = confirm_email.html;
    // console.log(settings.message);

    settings.message = await userPermissionService.template(settings.message, {
      URL: urlJoin(
        getAbsoluteServerUrl(strapi.config),
        apiPrefix,
        "/auth/email-confirmation"
      ),
      USER: sanitizedUserInfo,
      CODE: confirmationToken,
    });


    settings.object = await userPermissionService.template(settings.object, {
      USER: sanitizedUserInfo,
    });

    const emailTemplate = {
      to: `${user.email}`, // recipient
      from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
      template_id: "d-4af2d25542694429ad152637ff8b2d26",
      dynamic_template_data: {
        // subject: `Verify Email`,
        subject: settings.object,
        username: `${user.username}`,
        url: `${process.env.APP_URL}/api/auth/email-confirmation?confirmation=${confirmationToken}`,
        firstLine: "Thank you for registering!",
        secondLine:
          "You have to confirm your email address. Please click on the button above.",
        buttonText: "Verify Email",
      },
    };

    const adminEmailTemplate = {
      to: `${process.env.ADMIN_EMAIL}`, // recipient
      from: "Bare Metals Academy. <noreply@baremetals.io>", // Change to verified sender
      template_id: "d-4af2d25542694429ad152637ff8b2d26",
      dynamic_template_data: {
        subject: `New User`,
        username: "Daniel",
        buttonText: "View User",
        url: `${process.env.APP_URL}admin/content-manager/collectionType/plugin::users-permissions.user/${user.id}`,
        firstLine: "A new user has created an account!",
        secondLine: `${user.username}, Has registered! check what they do.`,
      },
    };
    await sgMail
      .send(adminEmailTemplate)
      .then((res) => {
        console.log("Email sent", res[0].statusCode);
      })
      .catch((error) => {
        console.log(`Sending the verify email produced this error: ${error}`);
      });

    // Send an email to the user.
    await sgMail
      .send(emailTemplate)
      .then((res) => {
        console.log("Email sent", res[0].statusCode);
      })
      .catch((error) => {
        console.log(`Sending the verify email produced this error: ${error}`);
      });
  };

  const edit = async (userId, params = {}) => {
    return strapi.entityService.update('plugin::users-permissions.user', userId, {
      data: params,
      populate: ['role'],
    });
  }

  plugin.controllers.auth.sendEmailConfirmation = async (ctx) => {
    console.log("I am going ta rass" ,ctx.req.data)

    const params = _.assign(ctx.request.body);

    await validateSendEmailConfirmationBody(params);

    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      throw new ValidationError("wrong.email");
    }

    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: { email: params.email },
    });

    if (!user) {
      throw new ApplicationError("This email address is not registered");
    }

    if (user.confirmed) {
      throw new ApplicationError("already.confirmed");
    }

    if (user.blocked) {
      throw new ApplicationError("blocked.user");
    }

    try {
      await sendConfirmationEmail(user);
      ctx.send({
        email: user.email,
        sent: true,
      });
    } catch (err) {
      throw new ApplicationError(err.message);
    }
  }

  return plugin;
};

