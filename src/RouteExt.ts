/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import RC from "gram-route/dist/src/Collector/RouteCollector";
import R from "gram-route/dist/src/Route";
import {HttpMethod} from "gram-route";
import {ServerRequest} from "./ServerRequest";
import {Response} from "./Response";
import {Queue,Middleware} from "./Queue";

/**
 * Extends the gram-route Collector
 * to return Route Object from RouteExt
 */
class RouteCollector extends RC
{
	protected routes: Map<number,Route> = new Map();

	/**
	 * @inheritDoc
	 */
	public add(methods: HttpMethod[], path: string, handler: any): Route
	{
		const route = super.add(methods,path,handler);

		if(route instanceof Route) {
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
	private queueDone: boolean = false;

	private queue: Queue;


	public add(middleware: Middleware)
	{
		//middleware with this
		return super.add(middleware);
	}

	protected createQueue()
	{
		//erstelle compose queue
		const mw: Middleware[] = this.getMiddleware();

		this.queue = new Queue(mw,this.call.bind(this));

		//set done to true
		this.queueDone = true;
	}

	protected async call(req: ServerRequest, res: Response, param: Map<string, any>): Promise<void>
	{
		const callback = this.handler;

		const returns = await callback(req,res, ... Array.from(param.values()));

		if(returns && !res.writableEnded) {
			res.send(returns);
		}
	}

	public handle(req: ServerRequest, res: Response, param: Map<string, any>): Promise<any>
	{
		if(!this.queueDone) {
			this.createQueue();
		}

		return this.queue.handle(req,res,param);
	}
}

export default RouteCollector;