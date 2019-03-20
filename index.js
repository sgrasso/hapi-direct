const fs = require('fs');
const path = require('path');
const boom = require('boom');

exports.name = 'hapi-direct';

exports.register = server => {

	server.method('directRoute', async (request, h) => {

		const uriParams = (request.paramsArray.length > 0) ? '/' + request.paramsArray.join('/') : '';

		// Assign controller to route handler and continue
		const verifier = [
			() => {
				try {
					let handler = request.server.plugins[request.route.realm.plugin].handlers[path.join(uriParams, request.app.routeVersion)];

					if (handler && !(handler instanceof Error)) {
						return handler;
					}

					return false;
				} catch (e) {
					return false;
				}
			},
			() => {
				try {
					let handler = request.server.plugins[request.route.realm.plugin].handlers[path.normalize(uriParams)];

					if (handler && !(handler instanceof Error)) {
						return handler;
					}

					return false;
				} catch (e) {
					return false;
				}
			}
		]

		// Assign controller to route handler and continue
		for (let i = 0; i < verifier.length; i++) {

			let result = await verifier[i]();

			if (result) {
				return result(request, h);
			}
		}

		return boom.notFound('Not Found');

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
};
