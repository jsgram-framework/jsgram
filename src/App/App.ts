/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {dispatcher, HttpMethod, router, RouterOptions, DispatcherInterface, RouteGroup} from "gram-route";
import {ServerRequest} from "..";
import {Response} from "..";
import * as http from "http";
import * as https from "https";
import {Queue} from "./Queue";
import {Route, default as RouteCollector} from "../Util/RouteExt";
import * as parseurl from "parseurl";
import {AppOptions, Middleware, RouteHandler} from "..";

export class App
{
	private collector: RouteCollector;

	private dispatcher: DispatcherInterface;

	private handler404: RouteHandler;

	private queue: Middleware[] = [];

	private queueHandler: Queue;

	//options
	private readonly urlTrimLastSlash: boolean = true;

	private readonly x_powered_by_header: boolean = true;

	constructor(options: AppOptions = {})
	{
		let routerOptions: RouterOptions = {};

		if (options.routerOptions !== null && options.routerOptions !== undefined) {
			routerOptions = options.routerOptions;
		}

		routerOptions.collector = require.resolve("../Util/RouteExt");

		const collector = router(routerOptions);

		if (collector instanceof RouteCollector) {
			//collector is always instance of Route Collector
			this.collector = collector;
		}

		if (options.urlTrimLastSlash !== null && options.urlTrimLastSlash !== undefined) {
			this.urlTrimLastSlash = options.urlTrimLastSlash;
		}

		if (options.x_powered_by_header !== null && options.x_powered_by_header !== undefined) {
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
		if (Array.isArray(middleware)) {
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
		return this.collector.add(methods, path, handler);
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
		return this.collector.group(prefix, collector);
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
		return this.map(["GET"], path, handler);
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
		return this.map(["POST"], path, handler);
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
		return this.map(["GET", "POST"], path, handler);
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
		return this.map(["PUT"], path, handler);
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
		return this.map(["PATCH"], path, handler);
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
		return this.map(["HEAD"], path, handler);
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
		return this.map(["DELETE"], path, handler);
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
		return this.map(["OPTIONS"], path, handler);
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
		return this.map(["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"], path, handler);
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
	 */
	public handle(req: ServerRequest, res: Response)
	{
		//prepare the url
		req.urlParts = parseurl(req);

		if (this.x_powered_by_header) {
			res.setHeader("x-powered-by", "jsgram");
		}

		this.queueHandler.handle(req, res).then();
	}

	/**
	 * Start the dispatching from the current url
	 *
	 * @param {ServerRequest} req
	 * @param {Response} res
	 * @returns {Promise<any>}
	 */
	protected handleRoute(req: ServerRequest, res: Response): Promise<any>
	{
		let url = req.urlParts.pathname;

		if (this.urlTrimLastSlash && url !== "/" && url.endsWith("/")) {
			//remove the last / from the url
			url = url.slice(0, -1);
		}

		const result = this.dispatcher.dispatch(req.method, url);

		if (result[0] === 200) {
			//found
			res.statusCode = 200;

			req.param = result[2];

			const route = this.collector.getRoute(result[1]);

			return route.handle(req, res);
		} 
		//not found
		return this.handle404(req, res);
		
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

		if (this.handler404) {
			const result = await this.handler404(req, res);

			if (result && !res.writableEnded) {
				res.send(result);
			}
		} else {
			res.end();
		}
	}

	/**
	 * Creates the dispatcher and the queue
	 *
	 * @returns {module:http.Server}
	 */
	public build(enableHttps = false, options: http.ServerOptions | https.ServerOptions = {}): https.Server | http.Server
	{
		//init the dispatcher
		this.dispatcher = dispatcher();

		//init queue
		this.queueHandler = new Queue(this.queue, this.handleRoute.bind(this));

		options.IncomingMessage = ServerRequest;
		options.ServerResponse = Response;

		if (enableHttps) {
			return https.createServer(options, this.handle.bind(this));
		}

		return http.createServer(options, this.handle.bind(this));
	}

	/**
	 * build the App
	 * and start the server
	 *
	 * @param {number} port
	 * @param {string} hostname
	 * @param {boolean} enableHttps
	 * @param {http.ServerOptions | https.ServerOptions} options
	 * @returns {module:http.Server}
	 */
	public listen(port?: number, hostname?: string, enableHttps?: boolean, options?: http.ServerOptions | https.ServerOptions): https.Server | http.Server
	{
		const server = this.build(enableHttps, options);

		server.listen(port, hostname, () => {
			let prefix = "http";

			if (enableHttps) {
				prefix = "https";
			}

			console.log(`Server running at ${prefix}://${hostname}:${port}/`);
		});

		return server;
	}
}