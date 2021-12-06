import {assert} from "chai";
import chaiHttp = require("chai-http");
import {Response} from "superagent";
// @ts-ignore
import {simpleServer} from "../helper/SimpleServer";
import {SimpleBody} from "../../src";
import {Response as GramResponse} from "../../src/Util/Response";
import {ServerRequest} from "../../src";

const chai = require("chai");

chai.use(chaiHttp);

describe("SimpleBodyTest", () => {
	it("should read the request body", function(done) {
		const sb = new SimpleBody();

		const cb = async (req: ServerRequest, res: GramResponse) => {
			const body = await sb.read(req);

			res.send(body);
		};

		const server = simpleServer(cb);

		const data = "Name";

		chai.request(server)
			.post("/")
			.send({
				"name": data
			})
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 200);
				assert.equal(res.text, "{\"name\":\"Name\"}");

				done();
			});
	});

	it("should react to the limit", function(done) {
		const sb = new SimpleBody({
			limit: 1
		});

		const cb = async (req: ServerRequest, res: GramResponse) => {
			let body: string;

			try {
				body = await sb.read(req);
			} catch (e) {
				if (e instanceof Error) {
					body = e.message;
				} else if (typeof e === "string") {
					body = e;
				}
			}

			res.send(body);
		};

		const server = simpleServer(cb);

		const data = "Name";

		chai.request(server)
			.post("/")
			.send({
				"name": data
			})
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 200);
				assert.equal(res.text, "request entity too large");

				done();
			});
	});

	it("should read the body with the middleware", function(done) {
		const sb = new SimpleBody();

		const cb = (req: ServerRequest, res: GramResponse) => {
			sb.process(req, res, async () => {
				res.send(req.rawBody);
			});
		};

		const server = simpleServer(cb);

		const data = "Name";

		chai.request(server)
			.post("/")
			.send({
				"name": data
			})
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 200);
				assert.equal(res.text, "{\"name\":\"Name\"}");

				done();
			});
	});

	it("should react to limit errors with the middleware", function(done) {
		const sb = new SimpleBody({
			limit: 1,
			encoding: "utf8"
		});

		const cb = (req: ServerRequest, res: GramResponse) => {
			sb.process(req, res, async (err, status) => {
				res.statusCode = status;
				res.send(err);
			});
		};

		const server = simpleServer(cb);

		const data = "Name";

		chai.request(server)
			.post("/")
			.send({
				"name": data
			})
			.end((err, res: Response) => {
				assert.equal(err, null);
				assert.equal(res.status, 413);
				assert.equal(res.text, "request entity too large");

				done();
			});
	});

	//TODO edge cases
});