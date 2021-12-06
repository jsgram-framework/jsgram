import {Middleware, NextFunction} from "../../src";

const chai = require("chai");

import {assert} from "chai";
import chaiHttp = require("chai-http");
import {ServerRequest} from "../../src";
import {Response as GramResponse} from "../../src/Util/Response";
import {Response} from "superagent";
// @ts-ignore
import {simpleServer} from "../helper/SimpleServer";
import {Queue} from "../../src/App/Queue";


chai.use(chaiHttp);

function createQueue(extraMw: Middleware[] = [], queueKey = "queue")
{
	const mw: Middleware[] = [
		(req: ServerRequest, res: GramResponse, next: NextFunction) => {
			req.setAttribute(queueKey, "mw1");

			next();
		},
		(req: ServerRequest, res: GramResponse, next: NextFunction) => {
			const string = req.getAttribute(queueKey);

			req.setAttribute(queueKey, string + "mw2");

			next();
		},
		(req: ServerRequest, res: GramResponse, next: NextFunction) => {
			const string = req.getAttribute(queueKey);

			req.setAttribute(queueKey, string + "mw3");

			next();
		}
	];

	mw.push( ...extraMw);	//pushing the extra middleware

	const last = async (req: ServerRequest, res: GramResponse) => {
		res.send(req.getAttribute(queueKey));
	};

	return new Queue(mw, last);
}

describe("QueueTest", () => {
	it("should work without middleware", function(done) {
		const last = async (req: ServerRequest, res: GramResponse) => {
			res.send("worked");
		};

		const queue = new Queue([], last);

		const cb = async (req: ServerRequest, res: GramResponse) => {
			await queue.handle(req, res);
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get("/")
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 200);
				assert.equal(res.text, "worked");

				done();
			});
	});

	it("should invoke simple middleware", function(done) {
		const queue = createQueue();

		const cb = async (req: ServerRequest, res: GramResponse) => {
			await queue.handle(req, res);
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get("/")
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 200);
				assert.equal(res.text, "mw1mw2mw3");

				done();
			});
	});

	it("should react to errors from middleware with string", function(done) {
		//string error
		const queue = createQueue([
			(req: ServerRequest, res: GramResponse, next: NextFunction) => {
				next("Error test");
			}
		]);

		const cb = async (req: ServerRequest, res: GramResponse) => {
			await queue.handle(req, res);
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get("/")
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 500);
				assert.equal(res.text, "Error test");

				done();
			});
	});

	it("should react to errors from middleware as callback and ending response", function(done) {
		const errorCallback = (req: ServerRequest, res: GramResponse) => {
			res.send("Error test");
		};

		//cb error
		const queue = createQueue([
			(req: ServerRequest, res: GramResponse, next: NextFunction) => {
				next(errorCallback);
			}
		]);

		const cb = async (req: ServerRequest, res: GramResponse) => {
			await queue.handle(req, res);
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get("/")
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 500);
				assert.equal(res.text, "Error test");

				done();
			});
	});

	it("should react to errors from middleware as callback without ending response", function(done) {
		const errorCallback = (req: ServerRequest, res: GramResponse) => {
			res.write("Error test");
		};

		//cb error
		const queue = createQueue([
			(req: ServerRequest, res: GramResponse, next: NextFunction) => {
				next(errorCallback);
			}
		]);

		const cb = async (req: ServerRequest, res: GramResponse) => {
			await queue.handle(req, res);
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get("/")
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 500);
				assert.equal(res.text, "Error test");

				done();
			});
	});

	it("should react to errors from middleware when the res is already closed", function(done) {
		const queue = createQueue([
			(req: ServerRequest, res: GramResponse, next: NextFunction) => {
				res.send("Res closed");
				next("Error test");
			}
		]);

		const cb = async (req: ServerRequest, res: GramResponse) => {
			await queue.handle(req, res);
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get("/")
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 200);
				assert.equal(res.text, "Res closed");

				done();
			});
	});

	it("should react to errors from middleware with another status", function(done) {
		const queue = createQueue([
			(req: ServerRequest, res: GramResponse, next: NextFunction) => {
				next("Error test", 413);
			}
		]);

		const cb = async (req: ServerRequest, res: GramResponse) => {
			await queue.handle(req, res);
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get("/")
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 413);
				assert.equal(res.text, "Error test");

				done();
			});
	});
});