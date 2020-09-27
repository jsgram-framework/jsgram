import {assert} from "chai";
import chaiHttp = require("chai-http");
import {Response} from "superagent";
// @ts-ignore
import {simpleServer} from "../helper/SimpleServer";
import {SimpleBody} from "../../src/Middleware/SimpleBody";
import {Response as GramResponse} from "../../src/Util/Response";
import {ServerRequest} from "../../src/Util/ServerRequest";

let chai = require('chai');

chai.use(chaiHttp);

describe("SimpleBodyTest",() => {
	it('should read the request body', function (done) {
		const sb = new SimpleBody();

		const cb = async (req: ServerRequest ,res: GramResponse) => {
			const body = await sb.read(req);

			res.send(body);
		};

		const server = simpleServer(cb);

		const data = "Name";

		chai.request(server)
			.post('/')
			.send({
				"name":data
			})
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,'{"name":"Name"}');

				done();
			});
	});
});