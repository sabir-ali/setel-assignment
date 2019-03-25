'use strict';
// dependencies setup
const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const router = express.Router();

// required configuration
const config = require('../config/setting');
const HTTPCode = require('../config/HTTPResponseCode');
const Common = require('../common');
const errorFormatter = Common.errorFormatter;

// require models
const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product');

// required validation check & filter
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

/* GET HOME */
router.get('/', [], (req, res) => res.send('All orders will list here'));

/* CREATE ORDER */
router.post('/', [
  check('user', 'Invalid user supplied')
    .isMongoId()
    .custom(async (value, { req }) => {
      const userData = await User.findOne({
        _id: mongoose.Types.ObjectId(value),
        status: 'active'
      }, config.commonFieldsToExclude);

      if (!userData)
        return false;

      // associate record with req
      req.user = userData;

      return true;
    }),
  check('deliveryAddress', 'Invalid delivery address supplied')
    .isLength({ min: 1 }),
  check('items', 'Items list is missing').exists(),
  check('items.*', 'One or more items are invalid')
    .custom(async (value, { req }) => {
      if (!(value.product && value.quantity > 0 && value.price > 0))
        return false;

      const productData = await Product.findOne({
        _id: mongoose.Types.ObjectId(value.product),
        status: 'active'
      }, config.commonFieldsToExclude);

      if (!productData)
        return false;

      return true;
    }),
  sanitize('user').trim().customSanitizer(value => mongoose.Types.ObjectId(value)),
  sanitize('deliveryAddress').trim(),
  sanitize('items.*').customSanitizer((value, { req }) => {
    return {
      product: mongoose.Types.ObjectId(value.product),
      quantity: parseInt(value.quantity),
      price: parseFloat(value.price)
    }
  }),
], async (req, res) => {
  try {
    const validRes = validationResult(req).formatWith(errorFormatter);
    if (!validRes.isEmpty())
      throw new Error(validRes.array().join('\n'))

    const totalAmount = req.body.items.reduce((prevVal, currVal) => prevVal + parseFloat(currVal.price), 0);
    
    const result = await new Order({
      ...req.body,
      totalAmount
    }).save({ new: true });

    if (!result)
      throw new Error('Order not created, please try again');

    // send result back
    res.json(result);
  } catch (error) {
    let message = error.message ? error.message : HTTPCode.badRequest.message;
    let resCode = error.code ? error.code : HTTPCode.badRequest.code;
    return res.status(resCode).json({ message });
  }
});

/* UPDATE ORDER STATE */
router.put('/:id', [
  check('id', 'Invalid order id supplied')
    .custom(async (value, { req }) => {
      const orderData = await Order.findOne({
        _id: mongoose.Types.ObjectId(req.params.id),
        status: 'active',
        orderState: 'created'
      }, config.commonFieldsToExclude)

      if (!orderData)
        return false;

      // associate record with req
      req.order = orderData;
      return true;
    }),
  check('orderState', 'Invalid order state supplied')
    .isIn(['confirmed', 'delivered', 'cancelled']),
  sanitize('id').trim().customSanitizer(value => mongoose.Types.ObjectId(value)),
  sanitize('orderState').trim(),
], async (req, res) => {
  try {
    const validRes = validationResult(req).formatWith(errorFormatter);
    if (!validRes.isEmpty())
      throw new Error(validRes.array().join('\n'))

    // extract order data from request
    const orderData = req.order;
    // remove order from request
    delete req.order;
    // update existing record properties
    orderData.orderState = req.body.orderState;
    orderData.modifiedDate = new Date();
    // update record
    const result = await orderData.save({ new: true });

    if (!result)
      throw new Error('Order not updated, please try again.');
    
    if (result.orderState === 'confirmed') {
      setTimeout(async () => {
        // update existing record properties
        result.orderState = 'delivered';
        result.modifiedDate = new Date();
        // update record
        await result.save({ new: true });
      }, 5000);
    }
    // send result back
    res.json({ result });
  } catch (error) {
    let message = error.message ? error.message : HTTPCode.badRequest.message;
    let resCode = error.code ? error.code : HTTPCode.badRequest.code;
    return res.status(resCode).json({ message });
  }
});

/* GET ORDER DETAILS */
router.get('/:id', [
  check('id', 'Invalid order id supplied')
  .custom(async (value, { req }) => {
    const orderData = await Order.findOne({
      _id: mongoose.Types.ObjectId(req.params.id),
      status: 'active'
    }, config.commonFieldsToExclude)

    if (!orderData)
      return false;

    // associate record with req
    req.order = orderData;
    return true;
  }),
  sanitize('id').trim().customSanitizer(value => mongoose.Types.ObjectId(value)),
], async (req, res) => {
  try {
    const validRes = validationResult(req).formatWith(errorFormatter);
    if (!validRes.isEmpty())
      throw new Error(validRes.array().join('\n'))

    // extract order data from request
    const result = req.order;
    // remove order from request
    delete req.order;

    // send result back
    res.json({ result });
  } catch (error) {
    let message = error.message ? error.message : HTTPCode.badRequest.message;
    let resCode = error.code ? error.code : HTTPCode.badRequest.code;
    return res.status(resCode).json({
      message
    });
  }
});

module.exports = router;