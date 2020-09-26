/**
 * @package jsgram
 *
 * @link https://gitlab.com/grammm/jsgram/jsgram
 * @licence https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE
 *
 * @author Jörn Heinemann <joernheinemann@gxm.de>
 */

import {App, AppOptions} from "./App";

let appObj: App;

export default function jsgram(options: AppOptions = {}): App
{
	if(!appObj) {
		appObj = new App(options);
	}

	return appObj;
}