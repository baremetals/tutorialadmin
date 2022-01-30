module.exports = {
  definition: ``,
  query: `
    productsByCategory(id: ID, status: ENUM_PRODUCT_STATUS, limit: Int): [Comment]!
  `,
  type: {},
  resolver: {
    Query: {},
    Mutation: {},
  },
};
