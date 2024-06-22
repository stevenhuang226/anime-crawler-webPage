document.addEventListener('DOMContentLoaded', () => {
	animeSearch();
})

function animeSearch() {
	const searchForm = document.getElementById('anime_search');

	searchForm.addEventListener('submit', () => {
		event.prevenDefault();
		
		const formData = new FormData(searchForm);
		
		fetch('192.168.3.10/searchapi', {
			method: 'POST',
			body: formData
		}).then( (res) => {

		}).catch( (error) => {
			console.log("ERROR:", error);
		})
	})
}
