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
		if(typeof data === 'object') {
			return this.json(data);
		}

		return this.sendWithHeader(data,"text/html")
	}

	public json(data)
	{
		return this.sendWithHeader(JSON.stringify(data), "application/json");
	}

	public text(data)
	{
		return this.sendWithHeader(data,"text/plaintext");
	}
}