# Hapi-Direct

[![Travis](https://img.shields.io/travis/hapi-direct/hapi-direct.svg)]()
[![Codecov](https://img.shields.io/codecov/c/github/codecov/hapi-direct.svg)]()
[![npm](https://img.shields.io/npm/v/hapi-direct.svg)]()
[![npm](https://img.shields.io/npm/dt/hapi-direct.svg)]()
[![npm](https://img.shields.io/npm/l/hapi-direct.svg)]()

Dynamic Hapi route handling through directory structure. Allowing you to create a single route to handle all requests and serve different controllers/handlers. Supports ability to version routes.

## Install
```
npm install hapi-direct --save
```

``` js
server.register({
    register: require('hapi-direct'),
    options: {}
}, (err) => {
    if (err) throw err;
});
```

## Overview

Used to obtain the assigned handler for a plugin's requested route. `Request.path` is not used because its uniqueness may not be consistent. It performs two different checks in order to find a routes handler. 

1. plugin name + request.paramsArray + request.route.version
2. plugin name + request.paramsArray

You have the ability to create versioned routes and still keep the URL path consistent.  The request.route.version is currently the location checked for versioned or A/B tested routes. For this to be successful you will need another method outside hapi-direct to set this value or A/B scenario. 

For example the an application I work with makes use of a simple resource security module that speaks with a backend database to determine the feature versions I have access too. Of course if this value does not exist hapi-direct proceeds by checking without an appended version.

## Use

### assignHandlers

Recursively register all possible routes by directory.
Folders prefixed with `_` or `.` are ignored

*Run this method on server startup since it will be a synchronous operation and not on each request*

``` js
//Used within a hapi plugin's exports.register
server.expose('handlers', server.methods.assignHandlers(__dirname));
```

The return result is a flat object of cached required handlers.  If this object contains a lot of routes I would recommend that a caching solution such as Redis is used, rather than storing this in memory.


```js
{
	plugin/page1/v0: require('/www/apps/plugin/page1/v0/'),
	plugin/page1/v1: require('/www/apps/plugin/page1/v1/)',
	plugin/page2/v0: require('/www/apps/plugin/page2/v0/'),
	plugin/page3/: require('/www/apps/plugin/page3/')
}
```

```
//Example Directory Structure
├── www/
|	index.js
|	package.json
│   ├── app/
│   │   ├── plugin/
│   │   |	├── page1/
│   │   |	│   ├── v0/
|	│   │   |	│   ├── index.js
|	│   │   |	│   ├── client.js
│   │   |	│   ├── v1/
|	│   │   |	│   ├── index.js
|	│   │   |	│   ├── client.js
│   │   |	├── page2/
│   │   |	│   ├── v0/
|	│   │   |	│   ├── index.js
|	│   │   |	│   ├── client.js
│   │   |	├── page3/
|	│   │   |	│   ├── index.js
|	│   │   |	│   ├── client.js
```

### directRoute

Takes the plugin of the requested route and determines if a handler exists for it or returns 404. The handler object that you previously populated and exposed during the plugin register is now checked against the `request.paramsArray` and `request.route.version` if present.

Then you can execute this within the route handler as `server.methods.directRoute`.

``` js
server.route({
	path: '/{path*}',
	method: 'GET',
	handler: server.methods.directRoute
});
```