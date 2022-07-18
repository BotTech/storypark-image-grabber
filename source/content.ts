import $ from 'jquery'
import browser from 'webextension-polyfill'

const imageContainer = $('<div>').addClass('sig-image-container')

function download(url: string): (e: MouseEvent) => void {
	return (e: MouseEvent) => {
		e.preventDefault()
		browser.runtime.sendMessage({"url": url})
	}
}

function addImageLinks(storyContent: JQuery<HTMLDivElement>) {
	storyContent.find<HTMLImageElement>('img')
		.wrap(imageContainer)
		.after(function () {
			return $('<a>')
				.addClass('sig-image-download-link')
				.attr('href', $(this).attr('src'))
				.text('\u2913')
				.on('click', download($(this).attr('src')))
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
