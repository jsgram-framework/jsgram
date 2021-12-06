import jsgram from "../../src/index";

const app = jsgram();

app.get("/", (req, res) => {
	res.send("hello world");
});

const hostname = "127.0.0.1";
const port = 3000;

app.listen(port, hostname);