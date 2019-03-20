const expect = require('chai').expect;
const Hapi = require('hapi');
const path = require('path');

describe('hapi-direct', () => {

	it('Registers Plugins', async () => {
		const server = Hapi.server();
	
		await server.register([require('../index.js')]);
		await server.initialize();

		expect(server.registrations).itself.have.property('hapi-direct');
	});
	
	it('Creates directRoute server method', async () => {
		const server = Hapi.server();
	
		await server.register([require('../index.js')]);
		await server.initialize();

		expect(server.methods.directRoute).to.be.a('function');
	});
	
	it('Creates assignHandlers server method', async () => {
		const server = Hapi.server();
	
		await server.register([require('../index.js')]);
		await server.initialize();

		expect(server.methods.assignHandlers).to.be.a('function');
	});
	
	it('Call to assignHandlers builds expected object', async () => {
		const thisServer = Hapi.server({ port: 8000 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			}
		}
		
		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();

		expect(thisServer.plugins['testPlugin'].handlers).itself.have.property(path.normalize('/testDir/v0'));
	});

	it('Call to directRoute does not find an assigned route handler return 404', async () => {
		const thisServer = Hapi.server({ port: 8001 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.expose('handlers', srv.methods.assignHandlers(__dirname));
				srv.route({
					path: '/{path*}',
					method: 'GET',
					handler: srv.methods.directRoute
				});
			}
		}
		
		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();
		
		const res = await thisServer.inject('/testDir2');

		expect(res.statusCode).to.equal(404);
	});

	it('Call to directRoute does find an assigned route handler return 200', async () => {
		const thisServer = Hapi.server({ port: 8002 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.expose('handlers', srv.methods.assignHandlers(__dirname));
				srv.route({
					path: '/{path*}',
					method: 'GET',
					handler: srv.methods.directRoute
				});
			}
		};
		
		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();

		const res = await thisServer.inject('/testDir/v0');

		expect(res.statusCode).to.equal(200);
		expect(res.result).to.equal('test controller file - V0');
	});

	it('Call to directRoute does find an assigned route handler with set request.app.routeVersion, return 200', async () => {
		const thisServer = Hapi.server({ port: 8003 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.expose('handlers', srv.methods.assignHandlers(__dirname));

				srv.route({
					path: '/{path*}',
					method: 'GET',
					handler: srv.methods.directRoute
				});

				srv.ext('onPreHandler', (req, h) => {
					req.app.routeVersion = 'v1';
					return h.continue;
				});
			}
		};

		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();

		const res = await thisServer.inject('/testDir');

		expect(res.statusCode).to.equal(200);
		expect(res.result).to.equal('test controller file - V1');
	});

	it('Call to directRoute does not find an assigned route handler with set request.app.routeVersion, return 404', async () => {
		const thisServer = Hapi.server({ port: 8004 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.expose('handlers', srv.methods.assignHandlers(__dirname));

				srv.route({
					path: '/{path*}',
					method: 'GET',
					handler: srv.methods.directRoute
				});

				srv.ext('onPreHandler', (req, h) => {
					req.app.routeVersion = 'foo';
					return h.continue;
				});
			}
		};

		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();

		const res = await thisServer.inject('/testDir');

		expect(res.statusCode).to.equal(404);
	});

	it('Call to directRoute return 404 for missing base route', async () => {
		const thisServer = Hapi.server({ port: 8005 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.expose('handlers', srv.methods.assignHandlers(__dirname));

				srv.route({
					path: '/{path*}',
					method: 'GET',
					handler: srv.methods.directRoute
				});
			}
		};

		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();

		const res = await thisServer.inject('/foo');

		expect(res.statusCode).to.equal(404);
	});

	it('Call to directRoute default to "/", return 404', async () => {
		const thisServer = Hapi.server({ port: 8006 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.expose('handlers', srv.methods.assignHandlers(__dirname));

				srv.route({
					path: '/',
					method: 'GET',
					handler: srv.methods.directRoute
				});
			}
		};

		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();

		const res = await thisServer.inject('/');

		expect(res.statusCode).to.equal(404);
	});

	it('Call to directRoute with valid route but no call to assignHandlers prior results in a 404', async () => {
		const thisServer = Hapi.server({ port: 8007 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.route({
					path: '/{path*}',
					method: 'GET',
					handler: srv.methods.directRoute
				});
			}
		};

		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();

		const res = await thisServer.inject('/testDir/v0');

		expect(res.statusCode).to.equal(404);
		// expect(res.result).to.equal('test controller file - V0');
	});

	it('Call to directRoute with valid route but path is multiple directories deep', async () => {
		const thisServer = Hapi.server({ port: 8008 });

		const testPlugin = {
			name: 'testPlugin',
			register: async (srv, options) => {
				srv.expose('handlers', srv.methods.assignHandlers(__dirname));

				srv.route({
					path: '/{path*}',
					method: 'GET',
					handler: srv.methods.directRoute
				});
			}
		};

		await thisServer.register([require('../index.js'), testPlugin]);
		await thisServer.initialize();

		const res = await thisServer.inject('/testDir/test1/v0');

		expect(res.statusCode).to.equal(200);
	});
});