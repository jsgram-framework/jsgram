import {IncomingMessage} from "http";
import {Url} from "url";

export class ServerRequest extends IncomingMessage
{
	private attributes: Map<string, any> = new Map();

	public param: Map<string,any> = new Map;

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