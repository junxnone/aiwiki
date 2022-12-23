document.addEventListener('DOMContentLoaded', function() {
	var editBtn = document.createElement('div')
	editBtn.id = 'edit-btn'
	document.body.append(editBtn)
	
	var repo = window.$docsify.repo
	editBtn.addEventListener('click', function() {
		if (!repo) return
		if (!/https?:\/\//.exec(repo))
			repo = 'https://github.com/' + repo
		var mdfile = 'README.md'
		if (location.hash.slice(1) != '/')
			mdfile = location.hash.slice(1) + '.md'
		var url = repo + '/tree/main/docs/' + mdfile
		window.open(url)
	})
})
