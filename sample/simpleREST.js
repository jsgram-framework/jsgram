const jsgram = require("../dist/index");

const app = jsgram.default();

//req body
const SimpleBody_1 = require("../dist/Middleware/SimpleBody");

const body = new SimpleBody_1.SimpleBody();

/**
 * simple CORS
 */
app.add((req,res,next) => {
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
app.add((req,res,next) => {
	if(req.method !== "POST" && req.method !== "PUT") {
		return next();
	}

	body.read(req)
		.then((body) => {
			req.body = JSON.parse(body);

			next();
		})
		.catch((err) => {
			next(err,413);
		})
});

app.get("/",(req,res) => {
	res.send("Hello World");
});

app.group("/api",() => {
	app.group("/v1",() => {
		app.group("/posts",() => {
			app.get("",(req,res) => {
				res.send("get all posts");
			});

			app.post("",(req,res) => {
				res.send("new post created");
			});

			app.group("/:id",() => {
				app.get("",(req,res, id) => {
					res.send("Post: " + id);
				});

				app.delete("",(req,res, id) => {
					res.send("Post: " + id + "deleted");
				});

				app.put("",(req,res, id) => {
					res.send("Post: " + id + "edited");
				});
			});
		});
	});
});

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname);