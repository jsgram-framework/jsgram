/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {App} from "./App/App";
import {ServerRequest} from "./Util/ServerRequest";
import {Response} from "./Util/Response";
import {RouterOptions} from "gram-route";

export type LastHandler = (req: ServerRequest, res: Response) => Promise<any> ;

export type NextFunction = (err?, status?: number) => Promise<any>;

export type Middleware = (req: ServerRequest, res: Response, next: NextFunction) => Promise<any> | void;

export {Response};
export {ServerRequest};
export {SimpleBody} from "./Middleware/SimpleBody";

export type AppOptions = {
	/**
	 * Options to config the router and dispatcher
	 * default = {
	 * 	dispatcher: TreeDispatcher
	 * 	generator: TreeGenerator
	 * 	collector: RouteCollector from RouteExt
	 * }
	 */
	routerOptions?: RouterOptions;
	/**
	 * cut of the last / from the request url
	 * default = true
	 */
	urlTrimLastSlash?: boolean;
	/**
	 * show the powered by header
	 * default = true
	 */
	x_powered_by_header?: boolean;
}

export type RouteHandler =
	((req: ServerRequest, res: Response) => (Promise<any> | void)) |
	((req: ServerRequest, res: Response, ... args: any[]) => (Promise<any> | void));

export type BodyReaderOptions = {
	limit?: number | string;
	encoding?: BufferEncoding;
};

let appObj: App;

/**
 * Singleton for the App class
 *
 * returns always the same instance of App class
 *
 * @param {AppOptions} options
 * @returns {App}
 */
export default function jsgram(options: AppOptions = {}): App
{
	if(!appObj) {
		appObj = new App(options);
	}

	return appObj;
}