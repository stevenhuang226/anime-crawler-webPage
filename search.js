async function search(keyword, selectSite, filter) {
	const https = require('node:https');
	const url = require('node:url');
	return new Promise(async (resolve,reject) => {
		let promises = [];
		let result = [];
		selectSite.forEach((element) => {
			const promise = new Promise((ret,rej) => {
				const reqObj = {
					hostname: 'www.google.com',
					path: `/search?q=${encodeURIComponent(keyword)}site%3A${element.path}`,
					method: 'GET',
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
					},
				};
				const resBody = https.request(reqObj, (res) => {
					let data = '';
					let matchArry = [];
					res.on('data', (chunk) => {
						data += chunk.toString();
					});
					res.on('end', () => {
						ret(data.match(element.regExp) || []);
					})
				});
				resBody.on('error', (error) => {
					rej(error);
				});
				resBody.end();
			})
			promises.push(promise);
		});
		await Promise.all(promises).then((res) => {
			res.forEach((res) => {
				result.push(...res);
			})
		}).catch((error) => {
			reject(error);
		})
		resolve(result);
	}).then(async (res) => {
		let ret = [];
		res.forEach((element) => {
			if (! ret.includes(element)) {
				ret.push(element);
			}
		});
		return ret;
	}).then(async (res) => {
		let promises = [];
		res.forEach((element) => {
			const promise = new Promise((resolve,reject) => {
				const reqObj = {
					hostname: url.parse(element).hostname,
					path: url.parse(element).path,
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
					}
				};
				const reqBody = https.request(reqObj, (res) => {
					let data = '';
					res.on('data', (chunk) => {
						data += chunk.toString();
					});
					res.on('end', async () => {
						let bufferObj = {'url': element, 'title':''};
						bufferObj.title = data.match(/(?<=<title>)(.*?)(?=<\/title>)/g)[0] || 'Error No Data';
						resolve(bufferObj);
					})
				});
				reqBody.on('error', (error) => {
					reject(error);
				});
				reqBody.end();
			});
			promises.push(promise);
		});
		const results = await Promise.all(promises);
		let srcObj = [];
		results.forEach((result) => {
			let stat = true;
			filter.forEach((element) => {
				if (element.test(result.title)) {
					stat = false;
				}
			})
			if (stat) {
				srcObj.push(result);
			}
		})
		return srcObj;
	}).catch((error) => {
		return -1;
	})
};
module.exports = {
	search: search
}
/*
async function main() {
	const selectSite = [
		{
			path: 'myself-bbs.com',
			regExp: /https:\/\/myself-bbs\.com\/thread-\d{4,6}-\d{1,2}-\d{1,2}\.html/g

		},
		{
			path: "anime1.me",
			regExp: /https:\/\/anime1\.me\/category\/[^\s"&]+/g
		}
	];
	//let res = await search('狼與辛香料', selectSite, [/找不到/]);
	//console.log(res);
	await new Promise(async(resolve) => {
		let ret = await search('狼與辛香料', selectSite, [/找不到/]);
		resolve(ret);
	}).then(ret => {
		console.log(ret);
	})
}
main();*/
