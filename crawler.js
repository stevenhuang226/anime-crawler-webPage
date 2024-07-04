async function typeOfSite(unknowUrl, selectSite) {
	for ( let element of selectSite ) {
		if ( element.rule.test(unknowUrl) ) {
			return [ await element.function(unknowUrl), element.name];
		}
	}
	return -1;
};

async function mySelf(theUrl) {
	const https = require("node:https");
	const url = require("node:url");
	const crypto = require("node:crypto")
	return new Promise( (resolve,reject) => {
		const reqObj = {
			hostname: url.parse(theUrl).hostname,
			path: url.parse(theUrl).path,
			method: "GET",
			family: 4,
			headers: {
				"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv; 78.0) Gecko/20100101 Firefox/78.0",
			},
		};
		const reqBody = https.request(reqObj, (response) => {
			let originData = "";
			response.on("data", (data) => {
				originData += data.toString();
			})
			response.on("end", async () => {
				let episodeObj = [];
				const playerCodeArry = originData.match(/(?<=myself-bbs\.com\/player\/).+/g) || ["Error No Data"];
				const titleArry = originData.match(/(?<=<a href="javascript:;">).+?(?=<\/a>)/g) || ["Error No Data"];
				if ( playerCodeArry.length !== titleArry.length ) {
				}
				for ( let ptr = 0; ptr < playerCodeArry.length; ptr++ ) {
					episodeObj[ptr] = {title: "Error No Data", url: "Error No Data", playerCode: null};
					episodeObj[ptr].title = titleArry[ptr];
					episodeObj[ptr].playerCode = playerCodeArry[ptr];
				}
				resolve(episodeObj);
			});
		});
		reqBody.on("error", (error) => {
			reject(error);
		});
		reqBody.end();
	}).then( async (episodeObj) => {
		let runTimes = parseInt(episodeObj.length / 12) + parseInt(11/episodeObj.length);
		for ( let runtime = 0; runtime < runTimes; runtime++ ) {
			let promises = [];
			episodeObj.slice(12*runtime, 12*(runtime+1)).forEach( (element,index) => {
				const promise = new Promise( (resolve,reject) => {
					const socket = new WebSocket("wss://v.myself-bbs.com/ws");
					const socketTimer = setTimeout( () => {
						socket.close(1000,"");
						setTimeout( () => {
							if ( socket.readyState !== 3 ) {
								socket.close(1000,"");
								reject("Erro web socket not close");
							}
							else {
								episodeObj[ runtime*12 + index ].url = "https:" + originData.match(/(?<="video":").+?(?=")/g)[0];
								resolve();
							};
						}, 200);
					}, 10000);
					socket.onopen = (open) => {
						if ( /play/.test(element.playerCode) ) {
							socket.send(`{"tid":"${element.playerCode.match(/(?<=\/)\d{5}(?=\/)/g)[0]}","vid":"${element.playerCode.match(/(?<=\/)\d{3}/g)[1]}","id":""}`);
						}
						else {
							socket.send(`{"tid":"","vid":"","id":"${element.playerCode}"}`);
						}
					};
					let originData = "";
					socket.onmessage = (event) => {
						originData += event.data;
						if ( /(?<="video":").+?(?=")/.test(originData) ) {
							clearTimeout(socketTimer);
							socket.close(1000,"");
							setTimeout( () => {
								if ( socket.readyState !== 3 ) {
									socket.close(1000,"");
									reject("Error web socket not close");
								}
								else {
									episodeObj[ runtime*12 + index ].url = "https:" + originData.match(/(?<="video":").+?(?=")/g)[0];
									resolve();
								}
							}, 200)
						};
					};
					socket.onerror = (error) => {
						reject(error);
					};
				});
				promises.push(promise);
			});
			await Promise.all(promises);
		}
		return episodeObj;
	}).catch( (error) => {
		return error.toString();
	});
}
async function animeOne(theUrl) {
	const https = require("https");
	const url = require("url");
	let titleArry = [];
	return new Promise( (resolve,reject) => {
		const reqObj = {
			hostname: url.parse(theUrl).hostname,
			path: url.parse(theUrl).path,
			method: "GET",
			header: {
				"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv; 78.0) Gecko/20100101 Firefox/78.0"
			}
		};
		const reqBody = https.request(reqObj, (response) => {
			let originData = "";
			let apireqList = [];
			response.on("data", (data) => {
				originData += data;
			})
			response.on("end", async () => {
				let apireqList = await originData.match(/(?<=data-apireq=")[^"].*?(?=")/g) || ["Error No Data"];
				titleArry = await originData.match(/(?<=rel="bookmark">)[^<].*?(?=<\/a>)/g) || ["Error No Data"];
				if ( apireqList.length != titleArry.length ) {
				}
				resolve(apireqList);
			})
		})
		reqBody.on("error", (error) => {
			reject(error);
		})
		reqBody.end();
	} ).then( (apireqList) => {
		let promises = [];
		apireqList.forEach( (apireqData) => {
			const postToApi = new Promise( (resolve,reject) => {
				const postData = `d=${apireqData}`;
				const reqObj = {
					hostname: "v.anime1.me",
					path: "/api",
					method: "POST",
					credentials: "omit",
					headers: {
						"Accept": "*/*",
						"Accept-Language": "en-us,en;q=0.5",
						"Content-Type": "application/x-www-form-urlencoded",
						"Content-Length": postData.length,
						"Sec-GPC": "1",
						"Sec-Fetch-Dest": "empty",
						"Sec-Fetch-Mode": "no-cors",
						"Sec-Fetch-Site": "same-site",
						"Progrma": "no-cache",
						"User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.3",
						"origin": "https://anime1.me",
						"referer": "https://anime1.me/",
					}
				};
				const reqBody = https.request(reqObj, (response) => {
					let originData = "";
					response.on("data", (data) => {
						originData += data;
					})
					response.on("end", () => {
						let matchArry = originData.match(/(?<=src":")[^,].*?(?=")/g) || ["Error No Data"];
						let originCookie = response.headers["set-cookie"];
						let cookie = originCookie[0].match(/e=\d+?;/g)[0] + " " + originCookie[1].match(/p=.+?;/g)[0] + " " + originCookie[2].match(/h=.+?(?=;)/g)[0];
						resolve([matchArry[0], cookie]);
					})
				})
				reqBody.on("error", (error) => {
					reject(error);
				})
				reqBody.write(postData)
				reqBody.end();
			});
			promises.push(postToApi);
		})
		return Promise.all(promises).then( (results) => {
			let resultArry = [];
			let cookieArry = [];
			results.forEach( ([retUrl, cookie]) => {
				resultArry.push("https:"+retUrl);
				cookieArry.push(cookie);
			} )
			return [resultArry, cookieArry];
		} ).catch( (error) => {
			return -1;
		} );
	} ).then( ([urlArry,cookieArry]) => {
		let episodeObj = [{}];
		for ( let ptr = 0; ptr < urlArry.length; ptr++ ) {
			episodeObj[ptr] = {title: "Error No Data", url: "Error No Data", cookie: "Error No Data"};
			episodeObj[ptr]["title"] = titleArry[ptr];
			episodeObj[ptr]["url"] = urlArry[ptr];
			episodeObj[ptr]["cookie"] = cookieArry[ptr];
		}
		episodeObj.reverse();
		return episodeObj;
	} ).catch( (error) => {
		return error.toString();
	} );
}
module.exports = {
	typeOfSite: typeOfSite,
	mySelf: mySelf,
	animeOne: animeOne,
}
