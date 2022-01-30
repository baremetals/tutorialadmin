module.exports = {
  definition: ``,
  query: `
            productsByCategory(id: ID, status: ENUM_PRODUCT_STATUS, limit: Int): [Product]!
        `,
  type: {},
  resolver: {
    Query: {
      getUserInfo: {
        description:
          "Return the user information including newly addded fields",
        resolverOf: "application::users.users.find",
        resolver: async (obj, options, { context }) => {
          const myData = await strapi.services.users.findOne;
          return mydata ? myData : "no user found";
        },
      },
    },
    Mutation: {},
  },
};
