
// @formatter:off
/*

 if: {
   and: [
     {any: [
       {product: {id: '0001', quantity: 3}},
       {product: {id: '0002', quantity: 3}},
       {category: {id: 'aaa', quantity: 3}}
     ]},
     {subtotal_gte: 100.00},
     {usertType: 'VIP'},
     {period: {
       from : '2016-09-21T14:00:00.000+0000',
       until: '2017-09-21T16:00:00.000+0000'
     }}
   ]
 }

*/
// @formatter:on

function promotionFn(base) {
  const evaluator = new base.utils.Evaluator().use('promotions:default:operations');

  const nli = () => {
    const now = new Date().toISOString();
    return `\n${now} - \u001b[34mdebug\u001b[39m: [promotions] `;
  }

  return (context /* { result, promotion, cart, products, user } */) => {
    if (base.logger.isDebugEnabled()) {
      base.logger.debug(`[promotions] Firing '${context.promotion.title}' [${context.promotion.id}] check for cart [${context.cart.cartId}]`);
    }

    const opContext = {};
    const result = evaluator.evaluate(context, opContext, 0, context.promotion.if);

    if (result.ok) {
      // Promotion condition fulfilled!

      // Copy the promoContext to context.cartContext, to not allow product reuse
      Object.keys(opContext).forEach(itemId => {
        if (opContext[itemId].quantityUsed > 0) {
          const cartItemContext = context.cartContext[itemId] = context.cartContext[itemId]
            || {
              quantityUsed: 0,
              promos: []
            };
          cartItemContext.quantityUsed += opContext[itemId].quantityUsed;
          Array.prototype.push
            .apply(cartItemContext.promos, opContext[itemId].promos);
        }
      });

      // Copy the Promotion result to the fulfilledPromos to easy the access
      const items = [];
      Object.keys(opContext).forEach(itemId => {
        items.push({
          itemId,
          quantityUsed: opContext[itemId].quantityUsed
        });
      });
      context.fulfilledPromos.push({
        id: context.promotion.id,
        items
      });
    } else {
      // Promotion not fulfilled, only copy the data
      if (result.data) {
        if (!Array.isArray(result.data)) result.data = [result.data];
        if (result.data.length > 0) {
          context.almostFulfilledPromos.push({
            id: context.promotion.id,
            data: result.data
          });
        }
      }
    }

    if (base.logger.isDebugEnabled()) {
      if (context.fulfilledPromos.length > 0) {
        base.logger.debug(
          '[promotions] fulfilledPromos:',
          JSON.stringify(context.fulfilledPromos, null, 2).replace(/(?:\r\n|\r|\n)/g, nli())
        );
      }
      if (context.almostFulfilledPromos.length > 0) {
        base.logger.debug(
          '[promotions] almostFulfilledPromos:',
          JSON.stringify(context.almostFulfilledPromos, null, 2).replace(/(?:\r\n|\r|\n)/g, nli())
        );
      }
    }

    // console.log('*** This promo result');
    // console.log(JSON.stringify(result, null, 2));
    // console.log('*** This promo context');
    // console.log(JSON.stringify(opContext, null, 2));
    // console.log('*** Cart context');
    // console.log(JSON.stringify(context.cartContext, null, 2));
    // console.log('*** Fulfilled promos');
    // console.log(JSON.stringify(context.fulfilledPromos, null, 2));
    // console.log('*** Almost fulfilled promos');
    // console.log(JSON.stringify(context.almostFulfilledPromos, null, 2));
  };
}

module.exports = promotionFn;
