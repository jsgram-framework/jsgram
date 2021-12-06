/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {ServerResponse} from "http";

export class Response extends ServerResponse
{
	public sendWithHeader(data: any, header: string)
	{
		this.setHeader("Content-Type", header);
		this.end(data);
		return this;
	}

	public send(data: any)
	{
		if (typeof data === "object") {
			return this.json(data);
		}

		return this.sendWithHeader(data, "text/html");
	}

	public json(data)
	{
		return this.sendWithHeader(JSON.stringify(data), "application/json");
	}

	public text(data)
	{
		return this.sendWithHeader(data, "text/plaintext");
	}
}