import $ from 'jquery'

const imageContainer = $('<div>').addClass('sig-image-container')

function addImageLinks(storyContent: JQuery<HTMLDivElement>) {
	storyContent.find<HTMLImageElement>('img')
		.wrap(imageContainer)
		.after(function () {
			return $('<a>')
				.addClass('sig-image-download-link')
				.attr('target', '_blank')
				.attr('href', $(this).attr('src'))
				.text('Download')
		})
}

function init() {
	console.debug('Initializing...')
	const storyContent = $<HTMLDivElement>('#story-content')
	if (storyContent.length >= 1) {
		console.debug('Found story content.')
		addImageLinks(storyContent)
	} else {
		console.debug('Did not find story content. Waiting...')
		setTimeout(init, 500)
	}
}

$(init)
