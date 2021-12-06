const jsgram = require("../dist/index");

const app = jsgram.default();

app.get("/", (req, res) => {
	res.send("Hello World");
});

const hostname = "127.0.0.1";
const port = 3000;

app.listen(port, hostname);