/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import DispatcherInterface from "gram-route/dist/src/Interfaces/DispatcherInterface";
import {dispatcher, HttpMethod, router, RouterOptions} from "gram-route";
import RouteGroup from "gram-route/dist/src/RouteGroup";
import {ServerRequest} from "./ServerRequest";
import {Response} from "./Response";
import * as http from "http";
import {Server} from "http";
import {Middleware, Queue} from "./Queue";
import {Route, default as RouteCollector} from "./RouteExt";
import * as parseurl from "parseurl";

export type AppOptions = {
	/**
	 * Options to config the router and dispatcher
	 */
	routerOptions?: RouterOptions;
	urlTrimLastSlash?: boolean;
	x_powered_by_header?: boolean;
}

export type RouteHandler =
	((req: ServerRequest, res: Response) => (Promise<any> | void)) |
	((req: ServerRequest, res: Response, ... args: any[]) => (Promise<any> | void));


export class App
{
	private server: Server;

	private collector: RouteCollector;
	private dispatcher: DispatcherInterface;

	private handler404: RouteHandler;

	private queue: Middleware[] = [];
	private queueHandler: Queue;

	//options
	readonly urlTrimLastSlash: boolean = true;
	readonly x_powered_by_header: boolean = true;

	constructor(options: AppOptions = {})
	{
		let routerOptions: RouterOptions = {};

		if(options.routerOptions) {
			routerOptions = options.routerOptions;
		}

		routerOptions.collector = "../../../../dist/RouteExt";

		let collector = router(routerOptions);

		if(collector instanceof RouteCollector) {
			//collector is always instance of Route Collector
			this.collector = collector;
		}

		if(options.urlTrimLastSlash) {
			this.urlTrimLastSlash = options.urlTrimLastSlash;
		}

		if(options.x_powered_by_header) {
			this.x_powered_by_header = options.x_powered_by_header;
		}
	}

	/**
	 * Add a middleware or an array of middleware to the queue
	 *
	 * Middleware will be served like first in first out
	 *
	 * @param {Middleware[] | Middleware} middleware
	 * @returns {App}
	 */
	public add(middleware: Middleware[] | Middleware): App
	{
		if(Array.isArray(middleware)) {
			this.queue.push(... middleware);
		} else {
			this.queue.push(middleware);
		}

		return this;
	}

	/**
	 * Creates a new route from type of RouteExt with one or more methods
	 *
	 * Uses the route collector from RouteExt to create the new Route
	 *
	 * @param {HttpMethod[]} methods
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public map(methods: HttpMethod[], path: string, handler: RouteHandler): Route
	{
		return this.collector.add(methods,path,handler);
	}

	/**
	 * Creates a group of routes with the route collector
	 *
	 * @param {string} prefix
	 * @param {() => void} collector
	 * @returns {RouteGroup}
	 */
	public group(prefix: string, collector: () => void): RouteGroup
	{
		return this.collector.group(prefix,collector);
	}

	/**
	 * Get Route
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public get(path: string, handler: RouteHandler): Route
	{
		return this.map(['GET'],path,handler);
	}

	/**
	 * Post route
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public post(path: string, handler: RouteHandler): Route
	{
		return this.map(['POST'],path,handler);
	}

	/**
	 * Route can be GET or POST
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public getpost(path: string, handler: RouteHandler): Route
	{
		return this.map(['GET','POST'],path,handler);
	}

	/**
	 * Put route
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public put(path: string, handler: RouteHandler): Route
	{
		return this.map(['PUT'],path,handler);
	}

	/**
	 * Patch route
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public patch(path: string, handler: RouteHandler): Route
	{
		return this.map(['PATCH'],path,handler);
	}

	/**
	 * Head route
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public head(path: string, handler: RouteHandler): Route
	{
		return this.map(['HEAD'],path,handler);
	}

	/**
	 * Delete route
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public delete(path: string, handler: RouteHandler): Route
	{
		return this.map(['DELETE'],path,handler);
	}

	/**
	 * Opions route
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public options(path: string, handler: RouteHandler): Route
	{
		return this.map(['OPTIONS'],path,handler);
	}

	/**
	 * Route with all methods
	 *
	 * @param {string} path
	 * @param {RouteHandler} handler
	 * @returns {Route}
	 */
	public any(path: string, handler: RouteHandler): Route
	{
		return this.map(["GET","POST","PUT","DELETE","OPTIONS","PATCH","HEAD"],path,handler);
	}

	/**
	 * A custom 404 error page
	 *
	 * @param {RouteHandler} handler
	 */
	public set404(handler: RouteHandler)
	{
		this.handler404 = handler;
	}

	/**
	 * Start the middleware queue and invoke the routing process after
	 *
	 * @param {ServerRequest} req
	 * @param {Response} res
	 * @returns {Promise<void>}
	 */
	public async handle(req: ServerRequest, res: Response): Promise<void>
	{
		//prepare the url
		req.urlParts = parseurl(req);

		if(this.x_powered_by_header) {
			res.setHeader('x-powered-by','jsgram');
		}

		await this.queueHandler.handle(req,res);
	}

	/**
	 * Start the dispatching from the current url
	 *
	 * @param {ServerRequest} req
	 * @param {Response} res
	 * @returns {Promise<any>}
	 */
	protected handleRoute(req: ServerRequest,res: Response): Promise<any>
	{
		let url = req.urlParts.pathname;

		if(this.urlTrimLastSlash && url !== "/" && url.endsWith("/")) {
			url = url.slice(0, -1);
		}

		const result = this.dispatcher.dispatch(req.method,url);

		if(result[0] === 200) {
			//found
			res.statusCode = 200;

			req.param = result[2];

			const route = this.collector.getRoute(result[1]);

			return route.handle(req,res);
		} else {
			//not found
			return this.handle404(req,res);
		}
	}

	/**
	 * Creates the 404 error
	 *
	 * @param {ServerRequest} req
	 * @param {Response} res
	 * @returns {Promise<void>}
	 */
	protected async handle404(req: ServerRequest, res: Response): Promise<void>
	{
		res.statusCode = 404;

		if(this.handler404) {
			const result = await this.handler404(req,res);

			if(result && !res.writableEnded) {
				res.send(result);
			}
		} else {
			res.end();
		}
	}

	/**
	 * Creates the dispatcher and the queue
	 */
	public build()
	{
		//init the dispatcher
		this.dispatcher = dispatcher();

		//init queue
		this.queueHandler = new Queue(this.queue,this.handleRoute.bind(this));
	}

	/**
	 * build the App
	 * and start the server
	 *
	 * @param {number} port
	 * @param {string} hostname
	 */
	public listen(port?: number, hostname?: string)
	{
		this.build();

		this.server = http.createServer(
			{ServerResponse: Response, IncomingMessage:ServerRequest},
			this.handle.bind(this)
		);

		this.server.listen(port, hostname, () => {
			console.log(`Server running at http://${hostname}:${port}/`);
		});
	}
}