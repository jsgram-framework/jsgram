import {ServerRequest} from "../ServerRequest";
import {Response} from "../Response";
import {NextFunction} from "../Queue";
import {Readable} from "stream";

export type BodyParserOptions = {
	limit?: number | string;
	encoding?: BufferEncoding;
};

export class SimpleBody
{
	//std = 1 mb
	private readonly limit: number | string = 1e6;

	private readonly encoding: BufferEncoding = 'utf8';

	constructor(options: BodyParserOptions = {})
	{
		if(options.limit) {
			this.limit = options.limit;
		}

		if(options.encoding) {
			this.encoding = options.encoding;
		}
	}

	public process(req: ServerRequest, res: Response, next: NextFunction)
	{
		this.read(req)
			.then((body: string) => {
				req.rawBody = body;

				next();
			})
			.catch((err) => {
				next(err);
			})
	}

	public read(req: ServerRequest)
	{
		req.setEncoding(this.encoding);

		return new Promise((resolve, reject) => {
			this.readStream(req,(err,body) => {
				if(err) {
					return reject(err);
				}

				resolve(body);
			})
		});
	}

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