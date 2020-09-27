// @ts-ignore
import {MockRouteGroup} from "./MockRouteGroup";

let chai = require('chai');
import {assert} from "chai";
import jsgram from "../src";
import chaiHttp = require("chai-http");
import {Response} from "superagent";

chai.use(chaiHttp);

describe("AppTest",() => {
	afterEach( () => {
		MockRouteGroup.overrideMw();
	});

	it('should match a get Route', function (done) {
		const app = jsgram();

		app.get("/",(req,res)=>{
			res.send("hello world");
		});

		const server = app.build();

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"hello world");

				done();
			});
	});
});