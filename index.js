'use strict';

const fs = require('fs');
const path = require('path');
const boom = require('boom');

exports.register = (server, options, next) => {

	server.method('directRoute', (request, reply) => {
		const uriParams = (request.paramsArray.length > 0) ? '/' + request.paramsArray.join('/') : '';
		const resolutions = [
			() => {
				try {
					return request.server.plugins[request.route.realm.plugin].handlers[path.join(uriParams, request.route.version)];
				} catch (e) {
					return e;
				}
			},

			() => {
				try {
					return request.server.plugins[request.route.realm.plugin].handlers[path.normalize(uriParams)];
				} catch (e) {
					return e;
				}
			}
		];

		// Assign controller to route handler and continue
		for (const resolver of resolutions){
			let handler = resolver(), notFound = (handler instanceof Error || handler == null);
			if (!notFound){
				return handler(request, reply);
			}
		}

		return reply(boom.notFound('Not Found'));
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

	next();
};

exports.register.attributes = {
	pkg: require('./package.json')
};