'use strict';
// define global settings used in throughout the API
module.exports = {
  port: process.env.PORT || 3000,
  database: process.env.MONGO_URL || `your mongo url`,
  secret: process.env.SECRET || `your app secret`,
  siteURL: process.env.SITE_URL,
  commonFieldsToExclude: {
    '__v': 0,
    'password': 0,
    'resetExpires': 0,
    'resetToken': 0,
    'securePin': 0
  },
  escapedSymbols: /[|\\{}()[\]^$+*?.]/g,
  companyName: process.env.COMPANY_NAME || `your company name`,
  noReplyEmail: process.env.NO_REPLY_EMAIL || `your no reply email`
}