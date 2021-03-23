import RouteGroup from "gram-route/dist/RouteGroup";


export class MockRouteGroup extends RouteGroup
{
	public static overrideMw()
	{
		RouteGroup.middleware = new Map();
	}
}