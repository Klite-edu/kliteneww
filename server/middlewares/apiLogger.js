// const redisClient = require('../config/redisConfig');
// const { getCurrentTimestamp } = require('../utils/dateUtils');

// const trackApiCalls = async (req, res, next) => {
//   try {
//     const log = {
//       endpoint: req.originalUrl,
//       method: req.method,
//       ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
//       userAgent: req.headers['user-agent'],
//       timestamp: getCurrentTimestamp(),
//     };

//     const logKey = `apiLog:${log.timestamp}`;
//     await redisClient.hSet(logKey, log);
//     await redisClient.expire(logKey, 60 * 60 * 24 * 7); // Expire after 7 days

//     console.log('API Call Logged:', log);
//   } catch (error) {
//     console.error('Error logging API call:', error);
//   }
  
//   next();
// };

// module.exports = trackApiCalls;
