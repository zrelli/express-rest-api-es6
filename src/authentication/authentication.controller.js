'use strict';

import logger from '../utils/logger';
import passport from 'passport';
import token from './token.controller';
import User from '../user/user.model';
import wrap from 'co-express';

/**
 * Signin with email after passport authentication.
 *
 * @param {Object} req  The request object
 * @param {Object} res  The request object
 * @param {Object} next The request object
 * @returns {Object} the new created JWT token
 * @api public
 */
const signin =  (req, res, next) => {

    passport.authenticate('local', (err, user, info) => {
        let error = err || info;
        if (error) {
            return res.status(401).send(error);
        }

        // Remove sensitive data before login
        user.password = undefined;
        user.salt = undefined;

        try {
            const jwtToken = token.createToken(user);
            res.status(201).json({
                token: jwtToken
            });
        } catch (err) {
            logger.error(err);
            res.status(401).send(err);
        }

    })(req, res, next);
};

function login(req, res) {
    const redirectTo = req.session.returnTo
        ? req.session.returnTo
        : '/';
    delete req.session.returnTo;
    res.redirect(redirectTo);
}

/**
 * Signout user and expire token.
 *
 * @param {Object} req  The request object
 * @param {Object} res  The request object
 * @api public
 */
const signout = (req, res) => {
    token.expireToken(req.headers, function (err, success) {
        if (err) {
            logger.error(err.message);
            return res.status(401).send(err.message);
        }

        if (success) {
            delete req.user;
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
    });
};

/**
 * Create new user and login user in.
 *
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @returns {Object} the new created JWT token
 * @api public
 */
const signup = (req, res) => {
    // For security measurement we remove the roles from the req.body object
    delete req.body.roles;

    // Init Variables
    var user = new User(req.body);

    // Add missing user fields
    user.provider = 'local';
    user.displayName = user.firstName + ' ' + user.lastName;

    // Then save the user
    user.save(function (err, user) {
        if (err) {
            logger.error(err.message);
            return res.status(400).send(err);
        } else {
            // Remove sensitive data before login
            user.password = undefined;
            user.salt = undefined;
            token.createToken(user, function (res, err, token) {
                if (err) {
                    logger.error(err.message);
                    return res.status(400).send(err);

                }
                res.status(201).json({
                    token: token
                });
            }.bind(null, res));
        }
    });
};

/**
 * Middleware to verify the token and attaches the user object
 * to the request if authenticated.
 *
 * @param {Object} req  The request object
 * @param {Object} res  The request object
 * @param {Object} next The request object
 * @api public
 */
const isAuthenticated = (req, res, next) => {

    token.verifyToken(req.headers, (err, data) => {

        if (err) {
            logger.error(err.message);
            return res.status(401).send(err.message);
        }

        req.user = data;

        next();
    });

};

export default {
    signin, login, signout, signup, isAuthenticated
};