'use strict';

import config from './config';
import redis from 'redis';
import logger from '../utils/logger';

let redisClient = null;

if(config.redis.isAvailable) {
    redisClient = redis.createClient(config.redis.port, config.redis.host);

    redisClient.auth(config.redis.auth);

    redisClient.on('connect', function () {
        logger.info('Redis connected to ' + config.redis.host + ':' + config.redis.port);
    });

    redisClient.on('error', function (err) {
        logger.error('Redis error: ' + err);
    });
}

export default redisClient;
