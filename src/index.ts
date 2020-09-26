import {App, AppOptions} from "./App";

let appObj: App;

export default function jsgram(options: AppOptions = {}): App
{
	if(!appObj) {
		appObj = new App(options);
	}

	return appObj;
}