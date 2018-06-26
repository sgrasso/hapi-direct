'use strict';

const fs = require('fs');
const path = require('path');
const boom = require('boom');
const async = require('async');

exports.register = (server, options, next) => {

	server.method('directRoute', (request, reply) => {

		const uriParams = (request.paramsArray.length > 0) ? '/' + request.paramsArray.join('/') : '';

		// Assign controller to route handler and continue
		async.tryEach([
			function(cb) {
				try {
					let handler = request.server.plugins[request.route.realm.plugin].handlers[path.join(uriParams, request.route.version)];

					if (handler && !(handler instanceof Error)) {
						return cb(null, handler);
					}

					return cb('Not Found');
				} catch (e) {
					return cb(e);
				}
			},
			function(cb) {
				try {
					let handler = request.server.plugins[request.route.realm.plugin].handlers[path.normalize(uriParams)];

					if (handler && !(handler instanceof Error)) {
						return cb(null, handler);
					}

					return cb('Not Found');
				} catch (e) {
					return cb(e);
				}
			}
		],
		function(e, result){
			if (e) {
				return reply(boom.notFound('Not Found'));
			}
			return result(request, reply);
		})
	});

	server.method('assignHandlers', basePath => {
		let handlers = {};

		const getHandlers = dir => {
			fs.readdirSync(dir)
				.filter(file => {
					return (file.indexOf('.') === -1) && (file.indexOf('_') === -1);
				})
				.map(file => {
					const fullPath = path.join(dir, file);
					try {
						require.resolve(fullPath);
					} catch (e) {
						return getHandlers(fullPath);
					}
					handlers[path.join(dir.replace(basePath, ''), file)] = require(fullPath);
				});
			return handlers;
		}
		return getHandlers(basePath);
	});

	return next();
};

exports.register.attributes = {
	pkg: require('./package.json')
};