import {SimpleBody} from "../../src/Middleware/SimpleBody";
import {ServerRequest} from "../../src/ServerRequest";
import {Response} from "../../src/Response";
import {NextFunction} from "../../src/Queue";
import jsgram from "../../src";

const app = jsgram();

const body = new SimpleBody();

/**
 * simple CORS
 */
app.add((req: ServerRequest,res: Response,next: NextFunction) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization');

	if(req.method === "OPTIONS") {
		//Preflighted
		res.setHeader('Content-Length', '0');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.send("");
	}

	return next();
});

/**
 * simple parser
 *
 * only for post and put methods
 *
 * parse the raw body to json
 */
app.add((req: ServerRequest,res: Response,next: NextFunction) => {
	if(req.method !== "POST" && req.method !== "PUT") {
		return next();
	}

	body.read(req)
		.then((body: string) => {
			req.body = JSON.parse(body);

			next();
		})
		.catch((err) => {
			next(err);
		})
});

app.get("/",(req: ServerRequest, res: Response)=>{
	res.send("hello world");
});

app.group("/api",() => {
	app.group("/v1",() => {
		app.group("/posts",() => {
			app.get("",(req: ServerRequest, res: Response) => {
				res.send("get all posts");
			});

			app.post("",(req: ServerRequest, res: Response) => {
				res.send("new post created");
			});

			app.group("/:id",() => {
				app.get("",(req: ServerRequest, res: Response, id) => {
					res.send("Post: " + id);
				});

				app.delete("",(req: ServerRequest, res: Response, id) => {
					res.send("Post: " + id + "deleted");
				});

				app.put("",(req: ServerRequest, res: Response, id) => {
					res.send("Post: " + id + "edited");
				});
			});
		});
	});
});

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname);