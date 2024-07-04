function listenSearch() {
	const searchForm = document.getElementById('anime_search');
	console.log('hello world');
	searchForm.addEventListener('submit', async (event) => {
		const formData = new FormData(searchForm);
		const searchResultList = document.getElementById('search_result');
		searchResultList.innerHTML = '';
		searchResultList.append(document.createElement('li').textContent = 'loading...');
		event.preventDefault();
		const res = await fetch('/search', {
			method: 'POST',
			body: formData,
		}).then((res) => {
			if (! res.ok) {
				throw new Error('Search Request Error'+res.statusCode);
			}
			else {
				return res.json();
			}
		}).then((data) => {
			searchResultList.innerHTML = '';
			data.forEach((element) => {
				addSearchResult(searchResultList, element);
			});
		}).catch((error) => {
			console.log(error);
		});
	});
}
function addSearchResult(List, result) {
	const listItem = document.createElement('li');
	const text = document.createElement('p');
	const button = document.createElement('button');
	listItem.classList.add('result-item');
	text.textContent = result.title;
	text.classList.add('result-text');
	button.textContent = '取得詳細內容';
	button.classList.add('theButton');
	button.addEventListener('click',() => {
		callCrawler(result.url);
	});
	listItem.appendChild(text);
	listItem.appendChild(button);
	List.appendChild(listItem);
}
function callCrawler(url) {
	const infoBox = document.getElementById('crawler_result');
	infoBox.innerHTML = '';
	infoBox.append(document.createElement('li').textContent = 'loading...');
	const res = fetch('/crawler', {
		method: 'POST',
		body: url,
	}).then((res) => {
		if (res.ok) {
			return res.json();
		}
		else {
			throw new Error('Crawler Error'+res.statusCode);
		}
	}).then(async ([data, siteType]) => {
		infoBox.innerHTML = '';
		for ( let index = 0; index < data.length; index+=1 ) {
			const [playAble, videoUID] = await checkFile(url, index);
			addCrawlerResult(infoBox, data[index], playAble, videoUID, siteType);
		}
	});
}
async function checkFile(url, index) {
	const hashHex = await sha1(url + index.toString());
	return fetch (`/check?uuid=${hashHex}`, {
		method: 'GET'
	}).then((res) => {
		return res.json();
	}).then((ans) => {
		return [ans.exists, hashHex];
	});
}
function addCrawlerResult(List, result, playAble=false, videoUID, siteType, theUrl) {
	const listItem = document.createElement('li');
	const text = document.createElement('p');
	const buttonBox = document.createElement('div');
	const cacheButton = document.createElement('button');
	listItem.classList.add('result-item');
	text.classList.add('result-text');
	cacheButton.classList.add('theButton');
	text.textContent = result.title;
	if (playAble) {
		cacheButton.textContent = '播放影片';
		const downloadButton = document.createElement('button');
		downloadButton.textContent = '下載到本地';
		downloadButton.classList.add('theButton');
		cacheButton.addEventListener('click', () => {
			const mainPlayer = document.getElementsByClassName('mainPlayer');
			const player = document.getElementById('main-player');
			for ( let element of mainPlayer ) {
				element.style.display = 'block';
			}
			player.src = `/videos/${videoUID}.mp4`;
		});
		downloadButton.addEventListener('click', () => {
			const download = document.createElement('a');
			download.href = `/videos/${videoUID}.mp4`;
			download.download = 'animeVideo.mp4';
			document.body.appendChild(download);
			download.click();
			document.body.removeChild(download);
		});
		buttonBox.appendChild(cacheButton);
		buttonBox.appendChild(downloadButton);
	}
	else {
		cacheButton.textContent = '下載到伺服器';
		cacheButton.addEventListener('click', async () => {
			await fetch('/cacheVideo', {
				method: 'POST',
				body: JSON.stringify({'epObj': result,'siteType': siteType,'videoUID': videoUID}),
			});
			console.log('disable button');
			cacheButton.disabled = true;
			cacheButton.classList.add('disabled')
		});
		buttonBox.appendChild(cacheButton);
	};
	listItem.appendChild(text);
	listItem.appendChild(buttonBox);
	List.appendChild(listItem);
}
function closePlayer() {
	const mainPlayer = document.getElementsByClassName('mainPlayer');
	for ( let element of mainPlayer ) {
		element.style.display = 'none';
	}
}
window.onload = () => {
	listenSearch();
};
