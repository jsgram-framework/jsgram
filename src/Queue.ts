/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {Response} from "./Response";
import {ServerRequest} from "./ServerRequest";

export type LastHandler = (req: ServerRequest, res: Response, param?: Map<string, any>) => Promise<any> ;

export type NextFunction = (err?) => Promise<any>;

export type Middleware = (req: ServerRequest, res: Response, next: NextFunction) => Promise<any> | void;

/**
 * Handles the middleware queue
 */
export class Queue
{
	constructor(
		private queue: Middleware[],
		private lastHandler: LastHandler
	) {}

	public async handle(req: ServerRequest, res: Response, param: Map<string, any> = new Map,i: number = 0): Promise<any>
	{
		const mw: Middleware = this.queue[i];

		if(!mw) {
			return this.lastHandler(req,res,param);
		}

		return mw(req,res,(err) => {
			if(err) {
				return this.handleError(err,req,res);
			}

			return this.handle(req,res,param,i+1);
		});
	}

	private async handleError(err,req,res): Promise<any>
	{
		if(res.writableEnded) {
			return;
		}

		if(typeof err === 'string') {
			res.write(err);
		}

		if(typeof err === 'function') {
			err(req, res);
		}

		res.statusCode = 500;
		res.end("500");
	}
}