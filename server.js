const logger = require('./lib/logger.js');
const search = require('./search.js');
const crawler = require('./crawler.js');
const download = require('./download.js');
const {LOGPATH, VIDEOPATH, CACHEPATH, PORT} = require('./config.json');
const selectSite = [
	{
		name: 'mySelf',
		path: 'myself-bbs.com',
		regExp: /https:\/\/myself-bbs\.com\/thread-\d{4,6}-\d{1,2}-\d{1,2}\.html/g,
		rule: /https:\/\/myself-bbs\.com/,
		function: crawler.mySelf,
		siteTypeRule: /mySelf/,
		downloadFun: download.mySelf,
	},
	{
		name: 'animeOne',
		path: 'anime1.me',
		regExp: /https:\/\/anime1\.me\/category\/[^\s"&]+/g,
		rule: /https:\/\/anime1\.me/,
		function: crawler.animeOne,
		siteTypeRule: /animeOne/,
		downloadFun: download.animeOne,
	}
];
const filter = [
	/找不到符合條件的頁面/,
	/tg群怎麼進不去/,
	/建議事項/,
	/玻放器很慢/,
	/休閒聊天/,
	/查詢及建議/,
	/提示信息/,
]
const http = require('node:http');
const fs = require('node:fs');
const url = require('node:url');
const multiparty = require('multiparty');
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('node:crypto');
const hostname = '0.0.0.0';
const server = http.createServer(async (req, res) => {
	if ( req.method === 'GET' && req.url === '/' ) {
		await fs.readFile("./index.html", (err,data) => {
			res.writeHead(200, {
				'Content-Type': 'text/html',
			});
			res.end(data);
		});
	}
	else if ( req.method === 'GET' && req.url === '/javascript.js') {
		await fs.readFile('./javascript.js', (err, data) => {
			res.writeHead(200, {
				'Content-Type': 'application/javascript',
			});
			res.end(data);
		});
	}
	else if ( req.method === 'GET' && req.url === '/style.css' ) {
		await fs.readFile('./style.css', (err, data) => {
			res.writeHead(200, {
				'Content-Type': 'text/css',
			});
			res.end(data);
		});
	}
	else if ( req.method === 'POST' && req.url === '/search' ) {
		const form = new multiparty.Form();
		form.parse(req, async (err, fields, files) => {
			const keyword = fields.search[0];
			await new Promise((resolve) => {
				const resData = search.search(keyword, selectSite, filter);
				resolve(resData);
			}).then((resData) => {
				res.writeHead(200, {
					'Content-Type': 'application/json',
				});
				res.end(JSON.stringify(resData));
			})
		});
	}
	else if ( req.method === 'POST' && req.url === '/crawler' ) {
		let data = '';
		req.on('data', (chunk) => {
			data += chunk;
		});
		req.on('end', async () => {
			await new Promise(async (resolve) => {
				const resData = await crawler.typeOfSite(data, selectSite);
				resolve(resData);
			}).then((resData) => {
				res.writeHead(200, {
					'Content-Type': 'application/json',
				});
				res.end(JSON.stringify(resData));
			});
		});
	}
	else if ( req.method === 'GET' && /check\?uuid=/.test(req.url) ) {
		const keyword = req.url.match(/(?<=check\?uuid=).*/g)[0];
		if(fs.existsSync(VIDEOPATH+keyword+'.mp4')) {
			res.writeHead(200, {
				'Content-Type': 'application/json',
			});
			res.end(JSON.stringify({'exists': true}));
		}
		else {
			res.writeHead(200, {
				'Content-Type': 'application/json',
			});
			res.end(JSON.stringify({'exists': false}));
		};
	}
	else if ( req.method === 'POST' && req.url === '/cacheVideo' ) { // {epObj: theEpObj, videoUID: videoUID, siteType: siteType};
		let data = '';
		req.on('data', (chunk) => {
			data += chunk;
		});
		req.on('end', () => {
			res.writeHead(200, {
				'Content-Type': 'text/plain',
			});
			res.end(`downloading video`);
			new Promise((resolve, reject) => {
				try{resolve(JSON.parse(data));}catch(error) {reject(error)};
			}).then(async (resData) => {
				if (! fs.existsSync(VIDEOPATH+resData.videoUID+'.mp4') && ! fs.existsSync(CACHEPATH+resData.videoUID+'.mp4')) {
					logger.write(LOGPATH, `downloading ${resData.videoUID}`);
					const downRes = ! await download.typeOfDownload(CACHEPATH, resData.epObj, resData.siteType, selectSite, resData.videoUID);
					if ( downRes ) {
						const ffmpegFun = ffmpeg()
							.input(`${CACHEPATH}${resData.videoUID}.mp4`)
							.output(`${VIDEOPATH}${resData.videoUID}.mp4`)
							.videoCodec('copy').audioCodec('copy')
							.outputOptions('-movflags faststart')
							.on('end', () => {
								fs.unlink(`${CACHEPATH}${resData.videoUID}.mp4`, (error) => {
									if (error) {
										logger.write(LOGPATH, `remove ${resData.videoUID} failed`);
									}
								})
							})
							.on('error', (error) => {
								logger.write(LOGPATH, `translate ${resData.epObj.url} failed`);
							})
							.run();
					}
					else {
						logger.write(LOGPATH, `downloading ${resData.epObj.url} failed`);
					}
				}
			}).catch((error) => {
				logger.write(LOGPATH, error);
			});
		});
	}
	else if ( req.method === 'GET' && /\/videos\//.test(req.url) && (! /\.\./.test(req.url)) ) {
		const filePath = VIDEOPATH + (req.url.match(/(?<=videos\/).*/)[0]);
		const range = req.headers.range;
		if ( range && fs.existsSync(filePath) ) {
			const fileSize = fs.statSync(filePath).size;
			const parts = range.replace(/bytes=/, '').split('-');
			const start = parseInt(parts[0], 10);
			const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
			res.writeHead(200, {
				'Content-Type': 'video/mp4',
				'Content-Length': end-start+1,
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Range': 'bytes',
				'Cache-Control': 'no-cache',
			});
			const fileStream = fs.createReadStream(filePath, {start, end});
			fileStream.pipe(res);
		}
		else if ( ! range && fs.existsSync(filePath) ) {
			const fileSize = fs.statSync(filePath).size;
			res.writeHead(200, {
				'Content-Type': 'video/mp4',
				'Content-Length': fileSize,
				'Cache-Control': 'no-cache',
			})
		}
		else {
			res.writeHead(404, {
				'Content-Type': 'text/plain',
			});
			res.end('404 not found');
		}
	}
	else if ( req.method === 'GET' && req.url === '/about.html' ) {
		await fs.readFile("./about.html", (err,data) => {
			res.writeHead(200, {
				'Content-Type': 'text/html',
			});
			res.end(data);
		});
	}
	else {
		logger.write(LOGPATH, `unknow path:${req.url}`)
		res.writeHead(404,{
			'Content': 'text/plain',
		});
		res.end('page not found');
	}
});
async function cleanCache(filePath) {
	fs.readdirSync(filePath).forEach((file) => {
		fs.unlinkSync(`${filePath}${file}`);
	});
	logger.write(LOGPATH, `clean cache(${filePath})`);
	return 0;
}
cleanCache(CACHEPATH);
server.listen(PORT, hostname, () => {
	logger.write(LOGPATH, `running at port ${PORT}`);

});
process.on('uncaughtException', (error) => {
	logger.write(LOGPATH, `uncaughtExceptionError: ${error}`);
});
process.on('unhandledRejection', (error) => {
	logger.write(LOGPATH, `uncaughtRejection: ${error}`);
});
