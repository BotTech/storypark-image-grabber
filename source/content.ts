import $ from 'jquery'
import browser from 'webextension-polyfill'
import ClickEvent = JQuery.ClickEvent

const initialisationTimeoutMs = 500

const imageContainer = $('<div>').addClass('sig-image-container')

function download(url: string): (event: ClickEvent) => void {
	return (event: ClickEvent) => {
		event.preventDefault()
		console.debug(`Downloading: ${url}`)
		browser.runtime.sendMessage({url}).then(
			() => {
				console.debug(`Finished downloading: ${url}`)
			},
			error => {
				console.error(`Failed to download: ${url}`, error)
			})
	}
}

function addImageLinks(storyContent: JQuery<HTMLDivElement>) {
	storyContent
		.find<HTMLImageElement>('img')
		.wrap(imageContainer)
		.after(function () {
			const link = $('<a>')
				.addClass('sig-image-download-link')
				.attr('href', $(this).attr('src') ?? null)
				.text('\u2913')
			const url = $(this).attr('src')
			if (url !== undefined) {
				return link.on('click', download(url))
			}

			return link
		})
}

function init() {
	console.debug('Initializing.')
	const storyContent = $<HTMLDivElement>('#story-content')
	if (storyContent.length > 0) {
		console.debug('Found story content.')
		addImageLinks(storyContent)
	} else {
		console.debug(`Did not find story content. Waiting ${initialisationTimeoutMs}ms.`)
		setTimeout(init, initialisationTimeoutMs)
	}
}

$(init)
