/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {RouteCollector as RC, Route as R} from "gram-route";
import {HttpMethod} from "gram-route";
import {ServerRequest} from "./ServerRequest";
import {Response} from "./Response";
import {Queue} from "../App/Queue";
import {Middleware} from "../index";

/**
 * Extends the gram-route Collector
 * to return Route Object from RouteExt
 */
class RouteCollector extends RC
{
	protected routes: Map<number, Route> = new Map();

	/**
	 * @inheritDoc
	 */
	public add(methods: HttpMethod[], path: string, handler: any): Route
	{
		const route = super.add(methods, path, handler);
		
		if (route instanceof Route) {
			//super.add() returns always instance of the extended Route.
			//because we override the createRoute() function
			return route;
		}
	}

	/**
	 * @inheritDoc
	 */
	protected createRoute(methods: HttpMethod[], path: string, handler: any): Route
	{
		return new Route(
			methods,
			path,
			this.routeId,
			[... this.routeGroupIds],
			handler
		);
	}

	/**
	 * @inheritDoc
	 */
	public getRoute(id: number): Route
	{
		return this.routes.get(id);
	}
}

/**
 * Extends the gram-route Route
 *
 */
export class Route extends R
{
	private queue: Queue;

	public add(middleware: Middleware)
	{
		//middleware with this
		return super.add(middleware);
	}

	public build()
	{
		this.prepareRoute();
		this.queue = new Queue(this.middleware, this.call.bind(this));
	}

	protected async call(req: ServerRequest, res: Response): Promise<void>
	{
		const callback = this.handler;

		const param = req.param;

		const returns = await callback(req, res, ...Object.values(param));

		if (returns && !res.writableEnded) {
			res.send(returns);
		}
	}

	public handle(req: ServerRequest, res: Response): Promise<any>
	{
		return this.queue.handle(req, res);
	}
}

export default RouteCollector;