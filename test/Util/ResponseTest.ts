import {assert} from "chai";

let chai = require('chai');

import chaiHttp = require("chai-http");
import {Response} from "superagent";
import {Response as GramResponse} from "../../src/Util/Response";
// @ts-ignore
import {simpleServer} from "../helper/SimpleServer";
import {ServerRequest} from "../../src";

chai.use(chaiHttp);

describe("ResponseTest",() => {
	it('should return a string with text', function (done) {
		const cb = async (req: ServerRequest ,res: GramResponse) => {
			res.text("Test")
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"Test");
				assert.equal(res.header['content-type'],"text/plaintext");

				done();
			});
	});

	it('should return a string with json', function (done) {
		const cb = async (req: ServerRequest ,res: GramResponse) => {
			res.json({test:"test"})
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"{\"test\":\"test\"}");
				assert.equal(res.header['content-type'],"application/json");

				done();
			});
	});

	it('should return a string with send', function (done) {
		const cb = async (req: ServerRequest ,res: GramResponse) => {
			res.send("Test")
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"Test");
				assert.equal(res.header['content-type'],"text/html");

				done();
			});
	});

	it('should return a string from json with send', function (done) {
		const cb = async (req: ServerRequest ,res: GramResponse) => {
			res.send({test:"test"})
		};

		const server = simpleServer(cb);

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"{\"test\":\"test\"}");
				assert.equal(res.header['content-type'],"application/json");

				done();
			});
	});
});