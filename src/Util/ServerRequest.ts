/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {IncomingMessage} from "http";
import {Url} from "url";

export class ServerRequest extends IncomingMessage
{
	private attributes: Map<string, any> = new Map();

	public param: {} = {};

	public urlParts: Url;

	public rawBody: string;

	public body: any;

	public setAttribute(key: string, value: any)
	{
		this.attributes.set(key,value);
	}

	public getAttribute(key: string)
	{
		return this.attributes.get(key);
	}
}