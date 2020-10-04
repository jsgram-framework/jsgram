// @ts-ignore
import {MockRouteGroup} from "../helper/MockRouteGroup";

let chai = require('chai');

import {assert} from "chai";
import jsgram, {NextFunction} from "../../src/index";
import chaiHttp = require("chai-http");

import {SimpleBody} from "../../src";
import {ServerRequest} from "../../src";
import {Response as GramResponse} from "../../src/Util/Response";
import {Response} from "superagent";
import {App} from "../../src";

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
				next(err,413);
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

	app.head("/noBody",(req: ServerRequest,res: GramResponse) => {
		res.end();
	});

	app.options("/",(req: ServerRequest,res: GramResponse) => {
		res.end();
	});

	app.any("/any",(req: ServerRequest,res: GramResponse) => {
		res.end();
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

				app.delete("",(req: ServerRequest,res: GramResponse,id) => {
					res.send("user deleted: " + id);
				});
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
				assert.equal(res.header['x-powered-by'],"jsgram");
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

	it('should get content from a route handler', function (done) {
		const app = new App();

		app.get("/",async (req,res)=>{
			return "hello world"
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

	//middleware test

	it('should use global middleware', function (done) {
		const app = new App();

		app.add((req: ServerRequest, res: GramResponse,next: NextFunction) => {
			req.setAttribute("mwtest","mwtest");

			next();
		});

		app.get("/",(req: ServerRequest, res: GramResponse)=>{
			res.send(req.getAttribute("mwtest"));
		});

		app.group("/mwgrouptest",() => {
			app.get("",(req: ServerRequest, res: GramResponse)=>{
				res.send(req.getAttribute("mwtest"));
			});
		});

		const server = app.build();

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"mwtest");

				chai.request(server)
					.get('/')
					.end((err, res: Response) => {
						assert.equal(err,null);
						assert.equal(res.status,200);
						assert.equal(res.text,"mwtest");

						done();
					});
			});
	});

	it('should use global middleware from an array', function (done) {
		const app = new App();

		app.add([
			(req: ServerRequest, res: GramResponse,next: NextFunction) => {
				req.setAttribute("mwtest","mwtest");

				next();
			},
			(req: ServerRequest, res: GramResponse,next: NextFunction) => {
				req.setAttribute("mwtest1","mwtest1");

				next();
			}
		]);

		app.get("/",(req: ServerRequest, res: GramResponse)=>{
			res.send(req.getAttribute("mwtest") + req.getAttribute("mwtest1"));
		});

		app.group("/mwgrouptest",() => {
			app.get("",(req: ServerRequest, res: GramResponse)=>{
				res.send(req.getAttribute("mwtest") + req.getAttribute("mwtest1"));
			});
		});

		const server = app.build();

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"mwtestmwtest1");

				chai.request(server)
					.get('/')
					.end((err, res: Response) => {
						assert.equal(err,null);
						assert.equal(res.status,200);
						assert.equal(res.text,"mwtestmwtest1");

						done();
					});
			});
	});

	it('should use route and route group middleware', function (done) {
		const app = new App();

		const mw = (req: ServerRequest, res: GramResponse,next: NextFunction) => {
			req.setAttribute("route","routemwtest");

			next();
		};

		const groupMw = (req: ServerRequest, res: GramResponse,next: NextFunction) => {
			req.setAttribute("group","groupmwtest");

			next();
		};

		app.get("/",(req: ServerRequest, res: GramResponse)=>{
			res.send(req.getAttribute("route"));
		}).add(mw);

		app.group("/mwgrouptest",() => {
			app.get("",(req: ServerRequest, res: GramResponse)=>{
				const text = req.getAttribute("group") + req.getAttribute("route");

				res.send(text);
			}).add(mw);
		}).add(groupMw);

		const server = app.build();

		chai.request(server)
			.get('/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,200);
				assert.equal(res.text,"routemwtest");

				chai.request(server)
					.get('/mwgrouptest')
					.end((err, res: Response) => {
						assert.equal(err,null);
						assert.equal(res.status,200);
						assert.equal(res.text,"groupmwtestroutemwtest");

						done();
					});
			});
	});

	//option test

	it('should not show x-powered-by header when it is disabled', function (done) {
		const app = new App({
			x_powered_by_header: false
		});

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
				assert.isUndefined(res.header['x-powered-by']);

				done();
			});
	});

	it('should trim the last slash when it is disabled', function (done) {
		const app = new App({
			urlTrimLastSlash: false
		});

		app.get("/test",(req,res)=>{
			res.send("hello world");
		});

		const server = app.build();

		chai.request(server)
			.get('/test/')
			.end((err, res: Response) => {
				assert.equal(err,null);
				assert.equal(res.status,404);	//404 because the route doesn't expected a / at the end

				done();
			});
	});

	//this test must always be the last test because the router isn't resetting after each test
	it('should use other router options', function (done) {
		const genPath = require.resolve("gram-route/dist/src/Generator/RegexBased/GroupPosBased");
		const disPath = require.resolve("gram-route/dist/src/Dispatcher/RegexBased/GroupPosBased");

		const app = new App({
			routerOptions: {
				generator: genPath,
				dispatcher: disPath
			}
		});

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