/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {Response} from "../Util/Response";
import {ServerRequest} from "../Util/ServerRequest";
import {LastHandler, Middleware} from "../index";

/**
 * Handles the middleware queue
 */
export class Queue
{
	/**
	 * Gets all middleware as array
	 *
	 * and a lastHandler which will be invoked
	 * when all middleware are done
	 *
	 * @param {Middleware[]} queue
	 * @param {LastHandler} lastHandler
	 */
	constructor(
		private queue: Middleware[],
		private lastHandler: LastHandler
	) {}

	/**
	 * Dispatch all middleware until it's done
	 *
	 * then invoke the last handler
	 *
	 * @param {ServerRequest} req
	 * @param {Response} res
	 * @param {number} i
	 * @returns {Promise<any>}
	 */
	public async handle(req: ServerRequest, res: Response, i: number = 0): Promise<any>
	{
		const mw: Middleware = this.queue[i];

		if(!mw) {
			return this.lastHandler(req,res);
		}

		return mw(req,res,(err) => {
			if(err) {
				return Queue.handleError(err,req,res);
			}

			return this.handle(req,res,i+1);
		});
	}

	public static async handleError(err,req,res): Promise<any>
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

		if(err instanceof Error) {
			res.statusCode = 500;
			res.end();
			throw err;
		}

		res.statusCode = 500;
		res.end("500");
	}
}