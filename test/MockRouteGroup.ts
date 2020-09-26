import RouteGroup from "../src/RouteGroup";

export class MockRouteGroup extends RouteGroup
{
	public static overrideMw()
	{
		RouteGroup.middleware = new Map();
	}
}