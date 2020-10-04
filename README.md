[![](https://gitlab.com/grammm/php-gram/phpgram/raw/master/docs/img/Feather_writing.svg.png)](https://gitlab.com/grammm/jsgram/jsgram)


# jsgram

[![pipeline status](https://gitlab.com/grammm/jsgram/jsgram/badges/master/pipeline.svg)](https://gitlab.com/grammm/jsgram/jsgram/-/commits/master)
[![coverage report](https://gitlab.com/grammm/jsgram/jsgram/badges/master/coverage.svg)](https://gitlab.com/grammm/jsgram/jsgram/-/commits/master)
[![npm](https://img.shields.io/npm/v/jsgram)]()
[![npm](https://img.shields.io/npm/l/jsgram)](https://gitlab.com/grammm/jsgram/jsgram/-/blob/master/LICENSE)

A fast and lightweight framework for node with middleware.

# Still in beta 
work in progress

## Example
prints hello world

`````typescript
const jsgram = require("jsgram");

const app = jsgram.default();

app.get("/",(req,res) => {
	res.send("Hello World");
});

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname);
`````

## Routes
- A route has a method, a pattern, a handler and possibly middleware.

- Methods are all Http Methods and can quickly added with the corresponding function. E. g. app.get() for http Method GET. Or methods can be manually added by calling the map function.

- Routes can have parameters: `"/:id"` The parameter id can be anything.

- Routes ca be organized in groups. Every route in a group got the same group prefix and the same middleware.

````typescript
const jsgram = require("jsgram");

const app = jsgram.default();

//Get Route
app.get("/",(req,res) => {
	res.send("Hello World");
});

//Route with parameter
app.get("/:id",(req,res,id) => {
	res.send("The requested id was: " + id);
});

//post route
app.post("/post",(req,res) => {
	res.send("Hello World");
});

app.map(["POST","GET","PUT"],"/manually",(req,res) => {
	res.send("Hello World");
});

//every route in this group got the prefix /v1
app.group("/v1",() => {
	app.get("/admin",(req,res) => {
		res.send("Hello admin");
	});
	
	//nested groups are also possible
	//here with crud like routes example
	app.group("/posts",() => {
		//this route has /v1/posts as pattern
		app.get("",(req,res) => {
			res.send("Get all posts");
		});
		
		app.post("",(req,res) => {
			res.send("post added");
		});
		
		//every route in this group expected an id
		app.group("/:id",() => {
			app.get("",(req,res, id) => {
				res.send("Get post: " + id);
			});
			
			app.put("",(req,res, id) => {
				res.send("post: " + id + " successfully updated");
			});
			
			app.delete("",(req,res, id) => {
				res.send("post: " + id + " successfully deleted");
			});
		});
	});
});

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname);
````

## Middleware

- a middleware is a function which is invoked before the route handler (e.g. a controller or a function).

- middleware arte organized as a queue: First in First out, Last in Last out.

- all middleware get a request, response and a next function as parameters. To call the next middleware in the queue: `next()`

- middleware can be:
	- global: so they will be invoked on every request
	- group: only invoked for all routes in this group
	- route: only invoked if the route is matched
	
````typescript
const jsgram = require("jsgram");

const app = jsgram.default();

//global middleware

app.add((req,res,next) => {
	//do something before the handler
	next();	//calling the next middleware
	//do something after the handler
});

//group

app.group("/admin",() => {
	app.get("/",(req,res) => {
		res.send("Welcome user");
	});
	
	app.get("/hidden_routes",(req,res) => {
		res.send("only for authenticated users");
	});
}).add((req,res,next) => {
	//e.g. check if user is authenticated 
	//got the user info elswhere
	const user = 123;
	
	//not login -> show login page
	if(!user) {
		res.send("not login");
	}
	
	//else go to the next middleware
	next();
});

//route

app.get("/hidden_routes",(req,res) => {
	res.send("only for authenticated users");
}).add((req,res,next) => {
	next();
})
````  

## Async support

- route handlers and middleware are supporting async and await operations

- async handler can return there result instead of using res.send. 

````typescript
const jsgram = require("jsgram");

const app = jsgram.default();

app.add(async (req,res,next) => {
	
	await next();
	//do something after the promise is done e.g. logging
});

app.get("/async",async () => {
	return "Hello world";
});
````