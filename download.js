async function typeOfDownload(filePath, epObj, siteType, selectSite, hashHex) {
	for ( let element of selectSite ) {
		if ( element.siteTypeRule.test(siteType) ) {
			return await element.downloadFun(epObj, filePath, hashHex);
		}
	}
	return -1;
}
async function mySelf(epObj, filePath, hashHex) {
	const https = require("https");
	const url = require("url");
	const fs = require("fs");
	const urlHostname = url.parse(epObj.url).hostname;
	const urlPathHeader = epObj.url.match(/(?<=com)\/.+\//g)[0];
	const fileName = filePath+hashHex+'.mp4';
	if (/\.\./.test(fileName)) {
		return -1;
	}
	return new Promise( (resolve,reject) => {
		const reqObj = {
			hostname: url.parse(epObj.url).hostname,
			path: url.parse(epObj.url).path,
			method: "GET",
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
				"Referer": "https://v.myself-bbs.com/",
				"Origin": "https://v.myself-bbs.com",
			},
		};
		const reqBody = https.request(reqObj, (response) => {
			let originData = "";
			response.on("data", (data) => {
				originData += data;
			});
			response.on("end", () => {
				resolve(originData);
			});
		});
		reqBody.on("error", (error) => {
			reject(error);
		});
		reqBody.end();
	}).then( async (m3u8Data) => {
		const m3u8Arry = m3u8Data.match(/(?<=\n).+\.ts/g);
		const streamFile = fs.createWriteStream(fileName);
		for ( let element of m3u8Arry ) {
			await new Promise( (resolve,reject) => {
				const reqObj = {
					hostname: urlHostname,
					path: urlPathHeader + element,
					method: "GET",
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
						"Referer": "https://v.myself-bbs.com/",
						"Origin": "https://v.myself-bbs.com",
					},
				};
				const reqBody = https.request(reqObj, (response) => {
					if ( response.statusCode !== 200 ) {
						reject(new Error(`failed request ${reqObj.hostname}${reqObj.path}`));
					}
					response.pipe(streamFile, {end: false});
					response.on("end", () => {
						resolve();
					})
				});
				reqBody.on("error", (error) => {
					reject(error);
				});
				reqBody.end();
			}).catch((error) => {
				console.log(error);
			});
		}
		streamFile.end();
		return 0;
	}).catch( (error) => {
		return -1;
	})
}
async function animeOne(epObj, filePath, hashHex) {
	const https = require("https");
	const fs = require("fs");
	const url = require("url");
	const fileName = filePath+hashHex+'.mp4';
	if (/\.\./.test(fileName)) {
		return -1;
	}
	await new Promise( (resolve,reject) => {
		const reqObj = {
			hostname: url.parse(epObj.url).hostname,
			path: url.parse(epObj.url).path,
			method: "GET",
			family: 4,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
				"Referer": "https://anime1.me/",
				"Cookie": epObj.cookie
			},
		};
		const streamFile = fs.createWriteStream(fileName);
		const reqBody = https.request(reqObj, (response) => {
			if ( response.statusCode !== 200 ) {
				reject(new Error(`request failed${reqObj.hostname}${reqObj.path}`));
			}
			else {
				response.pipe(streamFile, {end: false});
				response.on("end", () => {
					streamFile.end();
					resolve();
				});
			}
		});
		reqBody.on("error", (error) => {
			reject(error);
		});
		reqBody.end();
	}).then( () => {
		return 0;
	}).catch( (error) => {
		return -1;
	});
}
module.exports = {
	typeOfDownload: typeOfDownload,
	mySelf: mySelf,
	animeOne: animeOne,
}
