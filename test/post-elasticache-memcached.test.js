/* 
 * AWS Lambda Fan-Out Utility
 * 
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 * 
 *  http://aws.amazon.com/apache2.0
 * 
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 * 
 */

/* 
 * This Node.js script tests the features from the post-elasticache-memcached.js
 */

/* global describe:false, it:false */

'use strict';

const uuid   = require('uuid');
const assert = require('assert');
const post   = require('../lib/post-elasticache-memcached.js');
const mch    = require('../test-hosts/memcached-host.js');

let config   = null;
const server = mch({ shards: 2 }).then((c) => config = c);

describe('post-elasticache-memcached', () => {
	it('setAWS', (done) => {
		post.setAWS(null);
		done();
	});

	it('destinationRegex', (done) => {
		assert(! post.destinationRegex.test(""));
		assert(! post.destinationRegex.test("nothing"));
		assert(post.destinationRegex.test("test-memcached.abcdef.cfg.euw1.cache.amazonaws.com:11211"));
		done();
	});

	it('configure', (done) => {
		let conf = post.configure();
		assert.strictEqual(conf.service, 'memcached');
		conf = post.configure(null);
		assert.strictEqual(conf.service, 'memcached');
		conf = post.configure({});
		assert.strictEqual(conf.service, 'memcached');
		conf = post.configure({ service: "OtherService" });
		assert.strictEqual(conf.service, 'OtherService');
		done();
	});

	it('target', (done) => {
		let target = { };
		post.targetSettings(target);
		assert.deepEqual(target, { });
		target = { collapse: "JSON" };
		post.targetSettings(target);
		assert.deepEqual(target, { collapse: "multiple" });
		target = { role: "roleName" };
		post.targetSettings(target);
		assert.deepEqual(target, { role: null });
		target = { region: "myRegion" };
		post.targetSettings(target);
		assert.deepEqual(target, { region: null });
		done();
	});

	it('store item', (done) => {
		const key     = uuid();
		let   service = null;
		const target  = { destination: `localhost:${config.configPort}` };

		server.then(() => {
			return post.create(target);
		}).then((s) => {
			service = s;
		}).then(() => {
			return post.send(service, target, [ { key: key, data: `AZERTY${key}` } ]);
		}).then(() => {
			done();
		}).catch((err) => {
			done(err);
		});
	});

	it('store invalid item', (done) => {
		const key     = uuid();
		let   service = null;
		const target  = { destination: `localhost:${config.configPort}` };

		server.then(() => {
			return post.create(target);
		}).then((s) => {
			service = s;
		}).then(() => {
			return post.send(service, target, [ { key: `invalid ${key}`, data: `AZERTY${key}` } ]);
		}).then(() => {
			done(new Error("An error should have been raised"));
		}).catch((err) => {
			assert(err instanceof Error);
			assert.strictEqual(err.message, "Errors occured when processing elements");
			done();
		}).catch((err) => {
			done(err);
		});
	});

	it('store items', (done) => {
		const key     = uuid();
		let   service = null;
		const target  = { destination: `localhost:${config.configPort}` };

		server.then(() => {
			return post.create(target);
		}).then((s) => {
			service = s;
		}).then(() => {
			return post.send(service, target, [ { key: `${key}-1`, data: `AZERTY${key}` } ]);
		}).then(() => {
			return post.send(service, target, [ { key: `${key}-2`, data: `QWERTY${key}` } ]);
		}).then(() => {
			done();
		}).catch((err) => {
			done(err);
		});
	});

	it('store item with options', (done) => {
		const key     = uuid();
		let   service = null;
		const target  = { destination: `localhost:${config.configPort}` };

		server.then(() => {
			return post.create(target, { test: true });
		}).then((s) => {
			service = s;
		}).then(() => {
			return post.send(service, target, [ { key: key, data: `AZERTY${key}` } ]);
		}).then(() => {
			done();
		}).catch((err) => {
			done(err);
		});
	});
});