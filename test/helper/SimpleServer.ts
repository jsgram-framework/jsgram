import * as http from "http";
import {ServerRequest} from "../../src/Util/ServerRequest";
import {Response as GramResponse, Response} from "../../src/Util/Response";

export function simpleServer(cb: (req: ServerRequest ,res: GramResponse) => void | Promise<void>, port?: string | number) {
	const server = http.createServer(
		{ServerResponse: Response, IncomingMessage:ServerRequest},
		cb
	);

	if(port) {
		server.listen(port);
	}

	return server;
}