/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {ServerRequest} from "..";
import {Response} from "..";
import {Readable} from "stream";
import {BodyReaderOptions, NextFunction} from "../index";

/**
 * Reads the body from the request
 */
export class SimpleBody
{
	//std = 1 mb
	private readonly limit: number | string = 1e6;

	private readonly encoding: BufferEncoding = 'utf8';

	constructor(options: BodyReaderOptions = {})
	{
		if(options.limit) {
			this.limit = options.limit;
		}

		if(options.encoding) {
			this.encoding = options.encoding;
		}
	}

	/**
	 * The middleware function
	 *
	 * placed the raw body into the request object
	 *
	 * @param {ServerRequest} req
	 * @param {Response} res
	 * @param {NextFunction} next
	 */
	public process(req: ServerRequest, res: Response, next: NextFunction)
	{
		this.read(req)
			.then((body: string) => {
				req.rawBody = body;

				next();
			})
			.catch((err) => {
				next(err,413);
			})
	}

	/**
	 * Warps the reading process into a promise
	 *
	 * @param {ServerRequest} req
	 * @returns {Promise}
	 */
	public read(req: ServerRequest): Promise<any>
	{
		req.setEncoding(this.encoding);

		return new Promise((resolve, reject) => {
			this.readStream(req,(err: string, body: string) => {
				if(err) {
					return reject(err);
				}

				resolve(body);
			})
		});
	}

	/**
	 * Reads the request body chunks and combined it to a string
	 *
	 * @param {module:stream.internal.Readable} stream
	 * @param {(err: string, body: string) => void} cb
	 */
	public readStream(stream: Readable, cb: (err: string, body: string) => void)
	{
		let body: string = "";

		let length: number = 0;

		let limit = this.limit;

		function onData(chunk) {
			length += chunk.length;

			if(length > limit) {
				onEnd('request entity too large');
			}

			body += chunk;
		}

		function onEnd(err: string = null) {
			if(err) {
				cb(err,null);
				onClose();
				return;
			}

			cb(null,body);

			onClose();
		}

		function onClose() {
			body = null;

			stream.removeListener("data",onData);
			stream.removeListener("end",onEnd);
			stream.removeListener("close",onClose);
		}

		stream.on("data",onData);
		stream.on("end",onEnd);
		stream.on("close",onClose);
	}
}