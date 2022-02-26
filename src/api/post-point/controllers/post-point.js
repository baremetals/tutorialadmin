'use strict';

/**
 *  post-point controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  "api::post-point.post-point",
  ({ strapi }) => ({
    /**
     *  This function is like post.
     * It first checks if the user is a student, if so it checks the have already registered for the course.
     * If they have registered an error is return else it registers the users for the course.
     *
     * If the user is not already registered as a student, then it first registers them as a studen then registers
     * them for the course.
     */

    async create(ctx) {
      const { data } = ctx.request.body;
      const { isDecrement, user, post } = data;

      // Finds the post being liked.
      const postEntity = await strapi.service("api::post.post").findOne(post, {
        fields: ["points"],
        populate: { post_points: true },
      });

      
      // Checks if the user is already in the postpoints.
      const existingEntity = await strapi
        .service("api::post-point.post-point")
        .find({
          filters: { $and: [{ user }, { post }] },
          populate: { posts: true },
        });

      if (existingEntity.results.length === 0) {
        const createPoint = await strapi
          .service("api::post-point.post-point")
          .create({
            data: {
              isDecrement: true,
              post,
              user,
              publishedAt: Date.now(),
            },
          });
        // console.log("did I get here")
        const updatePoints = await strapi
          .service("api::post.post")
          .update(post, {
            data: {
              post_points: postEntity.post_points.concat(createPoint.id),
              points: postEntity.points + 1,
            },
          });
        
        // console.log(updatePoints);
        // console.log(postEntity.post_points);

        return {
          data: {
            newPoint: createPoint,
            updated: updatePoints,
          },
        };
      } else {
          return this.transformResponse({
            error: {
              msg: "You have already liked this post",
            },
          });
      }
    },

    async delete(ctx) {
        // const { post } = ctx.request.body.data;
      const { id } = ctx.params;
      const user = ctx.state.user.id
    //   console.log(ctx.state);

      // Finds the point being deleted.
      const pointEntity = await strapi
        .service("api::post-point.post-point")
        .findOne(id, {
          populate: { post: true },
        });

    //  console.log(pointEntity)
      if (pointEntity) {
        // console.log(existingEntity);
        const res = await strapi
          .service("api::post-point.post-point")
          .delete(id);

        const updatePoints = await strapi
          .service("api::post.post")
          .update(pointEntity.post.id, {
            data: {
              points: pointEntity.post.points - 1,
            },
          });
        return this.transformResponse({
            data: {
                poisPoint: res,
                points: updatePoints
            }
        });
      } else {
        return this.transformResponse({
          error: {
            msg: "Point already deleted.",
          },
        });
      }
    }
  })
);
