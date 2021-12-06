/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {QueueError, Response} from "..";
import {ServerRequest} from "..";
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
	public handle(req: ServerRequest, res: Response, i = 0): Promise<any>
	{
		const mw: Middleware = this.queue[i];

		if (!mw) {
			return this.lastHandler(req, res);
		}

		return Promise.resolve(mw(req, res, (err?: QueueError, status?: number) => {
			if (err) {
				return this.handleError(req, res, err, status);
			}

			return this.handle(req, res, i + 1);
		}));
	}

	public handleError(req: ServerRequest, res: Response, err: QueueError, status = 500): Promise<void>
	{
		if (res.writableEnded) {
			return;
		}

		res.statusCode = status;

		if (typeof err === "function") {
			err(req, res);

			if (!res.writableEnded) {
				res.end();
			}

			return;
		}

		if (typeof err === "string" || typeof err === "object") {
			res.send(err);
			return;
		}
	}
}