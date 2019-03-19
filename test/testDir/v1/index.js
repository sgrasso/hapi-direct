'use strict';

module.exports = (request, h) => {
	return h.response('test controller file - V1').code(200);
};