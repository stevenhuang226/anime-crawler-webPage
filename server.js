const logger = require("./lib/logger.js");
const {LOGPATH} = require("./config.json")
const http = require("node:http");
const fs = require("node:fs");
const hostname = '0.0.0.0';
const port = 80
const server = http.createServer((req, res) => {
	if ( req.method = 'GET' && req.url === '/' ) {
		fs.readFile("./index.html", (err,data) => {
			res.writeHead( 200, {
				'Content-Type': 'text/html',
			});
			res.end(data);
		})
	}
	else if ( req.method = 'POST' && req.url === '/searchapi' ) {
		let body = '';
		req.on('data', chunk => {
			body += chunk.toString();
		});
		req.on('end', () => {
			const formData = parse(body);
		})
	}
});

server.listen(port, hostname, () => {
	logger.write(LOGPATH, `running at port ${port}`);
});
