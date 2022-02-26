'use strict';

/**
 *  chat controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController("api::chat.chat", ({ strapi }) => ({
  async find(ctx) {
      async function getBody(rawrequest) {
        let semaphore = new Promise((resolve, reject) => {
          let bodycontent = "";
          rawrequest.on("data", (datapart) => {
            bodycontent += datapart;
          });
          rawrequest.on("end", () => {
            resolve(JSON.parse(bodycontent));
          });
          rawrequest.on("error", () => {
            reject("Error");
          });
        });
        return semaphore;
      }

    const resp = await getBody(ctx.req)
      .then((bodydata) => {
        return bodydata; 
      })
      .catch((error) => {
        console.log("There was an error reading out the body" + error);
      });
    // console.log(resp);

      let entity = []
      let entities = [];

    const owner = await strapi.service("api::chat.chat").find({
      filters: { owner: { id: { $eq: resp.id } } },
      populate: { owner: true, recipient: true },
    });

    const recipient = await strapi.service("api::chat.chat").find({
      filters: { recipient: { id: { $eq: resp.id } } },
      populate: { owner: true, recipient: true },
    });
    entities.push(owner, recipient);
    entities.forEach((ent) => {
        if (ent.results.length > 0)  {
            ent.results.map((e) => {
              entity.push(e);
            });
        }
        
    })
    // console.log(entity);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },
}));
