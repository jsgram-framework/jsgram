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

export * from "./Util/Response";
export * from "./Util/ServerRequest";

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

export type BodyReaderOptions = {
	limit?: number | string;
	encoding?: BufferEncoding;
};

let appObj: App;

export default function jsgram(options: AppOptions = {}): App
{
	if(!appObj) {
		appObj = new App(options);
	}

	return appObj;
}