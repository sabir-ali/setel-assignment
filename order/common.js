'use strict';
// dependencies setup

// custom module to replace multiple sub-string 
module.exports.replacer = ((str, mapObj) => {
  let re = new RegExp(Object.keys(mapObj).join('|'), 'gmi');

  return str.replace(re, (matched) => {
    return mapObj[matched.toLowerCase()];
  });
})

// express validator error formatter
module.exports.errorFormatter = (arg) => {
  return `${arg.msg}`;
}

// validate route permission
module.exports.validate = (...allowed) => {
  const isAllowed = role => allowed.includes(role);

  // return a middleware
  return (req, res, next) => {
    if (req.user && isAllowed(req.user.role))
      next(); // role is allowed, so continue on the next middleware
    else {
      res.status(403).send("Forbidden");
    }
  }
}