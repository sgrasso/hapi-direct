'use strict';

const expect = require('chai').expect;
const Hapi = require('hapi');
const path = require('path');

describe('hapi-direct', () => {

	before(function(done) {
		let server = this.server = new Hapi.Server();
		server.connection();

		server.register([{register: require('../index.js')}], function(e){
			server.initialize(function(err) {
				if (err) throw err;
				done();
			});
		});
	});

	it('Registers Plugins', function() {
		expect(this.server.registrations).itself.have.property('hapi-direct');
	});

	it('Creates directRoute server method', function() {
		expect(this.server.methods.directRoute).to.be.a('function');
	});

	it('Creates assignHandlers server method', function() {
		expect(this.server.methods.assignHandlers).to.be.a('function');
	});
	
	it('Call to assignHandlers builds expected object', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8000});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				expect(thisServer.plugins['testPlugin'].handlers).itself.have.property(path.normalize('/testDir/v0'));
				done();
			});
		});
	});

	it('Call to directRoute does not find an assigned route handler return 404', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			srv.route({
				path: '/{path*}',
				method: 'GET',
				handler: srv.methods.directRoute
			});
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8001});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				thisServer.inject({url: '/testDir2'}, (request, reply) => {
					expect(request.statusCode).to.equal(404);
					done();
				});
			});
		});
	});

	it('Call to directRoute does find an assigned route handler return 200', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			srv.route({
				path: '/{path*}',
				method: 'GET',
				handler: srv.methods.directRoute
			});
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8002});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				thisServer.inject({url: '/testDir/v0'}, (request, reply) => {
					expect(request.statusCode).to.equal(200);
					expect(request.result).to.equal('test controller file - V0');
					done();
				});
			});
		});
	});

	it('Call to directRoute does find an assigned route handler with set request.route.version, return 200', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			srv.route({
				path: '/{path*}',
				method: 'GET',
				handler: srv.methods.directRoute
			});
			srv.ext('onPreHandler', (req, rep) => {
				req.route.version = 'v1';
				rep.continue();
			});
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8003});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				thisServer.inject({url: '/testDir'}, (request, reply) => {
					expect(request.statusCode).to.equal(200);
					expect(request.result).to.equal('test controller file - V1');
					done();
				});
			});
		});
	});

	it('Call to directRoute does not find an assigned route handler with set request.route.version, return 404', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			srv.route({
				path: '/{path*}',
				method: 'GET',
				handler: srv.methods.directRoute
			});
			srv.ext('onPreHandler', (req, rep) => {
				req.route.version = 'v2';
				rep.continue();
			});
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8007});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				thisServer.inject({url: '/testDir'}, (request, reply) => {
					expect(request.statusCode).to.equal(404);
					done();
				});
			});
		});
	});

	it('Call to directRoute return 404 for missing base route', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			srv.route({
				path: '/{path*}',
				method: 'GET',
				handler: srv.methods.directRoute
			});
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8004});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				thisServer.inject({url: '/foo'}, (request, reply) => {
					expect(request.statusCode).to.equal(404);
					done();
				});
			});
		});
	});

	it('Call to directRoute default to "/", return 404', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			srv.route({
				path: '/',
				method: 'GET',
				handler: srv.methods.directRoute
			});
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8004});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				thisServer.inject({url: '/'}, (request, reply) => {
					expect(request.statusCode).to.equal(404);
					done();
				});
			});
		});
	});

	it('Call to directRoute with valid route but no call to assignHandlers prior results in a 404', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.route({
				path: '/{path*}',
				method: 'GET',
				handler: srv.methods.directRoute
			});
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8005});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				thisServer.inject({url: '/testDir/v0'}, (request, reply) => {
					expect(request.statusCode).to.equal(404);
					// expect(request.result).to.equal('test controller file - V0');
					done();
				});
			});
		});
	});

	it('Call to directRoute with valid route but path is multiple directories deep', function(done) {
		const thisServer = new Hapi.Server();
		const testPlugin = function (srv, options, next) {
			srv.expose('handlers', srv.methods.assignHandlers(__dirname));
			srv.route({
				path: '/{path*}',
				method: 'GET',
				handler: srv.methods.directRoute
			});
			return next();
		};

		testPlugin.attributes = {
			name: 'testPlugin'
		};
		
		thisServer.connection({ port: 8006});

		thisServer.register([{register: require('../index.js')}, {register: testPlugin}], function(e){
			thisServer.initialize(function(err) {
				if (err) throw err;
				thisServer.inject({url: '/testDir/test1/v0'}, (request, reply) => {
					expect(request.statusCode).to.equal(200);
					done();
				});
			});
		});
	});
});