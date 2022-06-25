"use strict";


/**
 * custome order router.
 */

module.exports = {
  routes: [
    {
      // Path defined with an URL parameter
      method: "POST",
      path: "/orders/confirm",
      handler: "order.confirm",
    },
  ],
};
 