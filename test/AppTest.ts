// @ts-ignore
import {MockRouteGroup} from "./helper/MockRouteGroup";

let chai = require('chai');

import {assert} from "chai";
import jsgram, {NextFunction} from "../src";
import chaiHttp = require("chai-http");
import {App} from "../src/App/App";
import {SimpleBody} from "../src/Middleware/SimpleBody";
import {ServerRequest} from "../src/Util/ServerRequest";
import {Response as GramResponse} from "../src/Util/Response";
import {Response} from "superagent";

chai.use(chaiHttp);

/**
 * Creates random routes for the App
 *
 * Routes are typically CRUD routes
 *
 * @param {App} app
 */
export function createRealSampleApp(app: App)
{
	const bodyMw = new SimpleBody();

	const parseMw = (req: ServerRequest,res: GramResponse,next: NextFunction) => {
		bodyMw.read(req)
			.then((body: string) => {
				req.body = JSON.parse(body);

				next();
			})
			.catch((err) => {
				next(err);
			});
	};

	app.set404((req: ServerRequest,res: GramResponse) => {
		res.send("Page not found");
	});

	app.get("/",(req: ServerRequest,res: GramResponse)=>{
		res.send("hello world");
	});

	//legacy route
	app.getpost("/legacy",(req: ServerRequest,res: GramResponse) => {
		res.send("method: " + req.method);
	});

	app.group("/v1",() => {
		app.group("/user",() => {
			//route with simple body
			app.post("",(req: ServerRequest,res: GramResponse) => {
				const body = JSON.parse(req.rawBody);

				res.send("user created with this name: "+body.name);
			}).add(bodyMw.process.bind(bodyMw));

			app.group("/:id",() => {
				app.get("",(req: ServerRequest,res: GramResponse,id) => {
					res.send("user id: "+id);
				});

				//routes with simple body and json parse
				app.put("",(req: ServerRequest,res: GramResponse,id) => {
					res.send("user edit: " + id + " with this new name: " + req.body.name);
				}).add(parseMw);

				app.patch("",(req: ServerRequest,res: GramResponse,id) => {
					res.send("user changed: " + id + " with this new name: " + req.body.name);
				}).add(parseMw);
			});
		});
	});
}

describe("AppTest",() => {
	afterEach( () => {
		//reset route groups (static array) after each test
		MockRouteGroup.overrideMw();
	});

	it('should match a get Route from singleton', function (done) {
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

	it('should match a get Route and was started', function (done) {
		const app = new App();

		app.get("/",(req,res)=>{
			res.send("hello world");
		});

		const server = app.listen(3000);

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"hello world");

				done();
			});
	});

	it('should not match Route with handler', function (done) {
		const app = new App();

		app.set404((req,res) => {
			res.send("Page not found");
		});

		app.get("/",(req,res)=>{
			res.send("hello world");
		});

		const server = app.build();

		chai.request(server)
			.get('/123')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,404);
				assert.equal(res.text,"Page not found");

				done();
			});
	});

	it('should not match Route with async handler', function (done) {
		const app = new App();

		app.set404(async () => {
			return "Page not found";
		});

		app.get("/",(req,res)=>{
			res.send("hello world");
		});

		const server = app.build();

		chai.request(server)
			.get('/123')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,404);
				assert.equal(res.text,"Page not found");

				done();
			});
	});

	it('should not match Route without handler', function (done) {
		const app = new App();

		app.get("/",(req,res)=>{
			res.send("hello world");
		});

		const server = app.build();

		chai.request(server)
			.get('/123')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,404);

				done();
			});
	});

	it('should do a post request incl body', function (done) {
		const app = new App();

		createRealSampleApp(app);

		const server = app.build();

		let userName = "John Doe";

		chai.request(server)
			.post('/v1/user/')
			.send({
				"name":userName
			})
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"user created with this name: "+userName);

				done();
			});
	});
});