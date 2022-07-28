import $ from 'jquery'
import browser from 'webextension-polyfill'
import ClickEvent = JQuery.ClickEvent

const imageContainer = $('<div>').addClass('sig-image-container')

const postQueryRegex = /[?&]community_post_id=(\d+)(&|$)/

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

function onStoryChange() {
	console.debug('Story changed.')
	// This should always be on the page even before the content is loaded.
	const showPostElement = $<HTMLDivElement>('#show-post')
	if (showPostElement.length === 0) {
		throw 'Unable to find #show-post element.'
	}
	const storyContent = $<HTMLDivElement>('#story-content')
	if (storyContent.length > 0) {
		console.debug('Found story content.')
		addImageLinks(storyContent)
	} else {
		console.debug('Story content has not been loaded yet.')
		const observer = new MutationObserver((mutations, observer) => {
			const storyContent = $<HTMLDivElement>('#story-content')
			if (storyContent.length > 0) {
				console.debug('Found story content.')
				observer.disconnect()
				addImageLinks(storyContent)
			}
		});
		observer.observe(showPostElement[0], { childList: true, subtree: true });
	}
}

function onPageChange() {
	console.debug('Page changed.')
	const pathSegments = window.location.pathname.split('/').filter(segment => segment.length !== 0)
	if (pathSegments[0] === 'activity') {
		console.debug('Activity page detected.')
		if (postQueryRegex.test(window.location.search)) {
			onStoryChange()
		}
	} else {
		console.debug('Unknown page:', window.location)
	}
}

function onLoad() {
	var location: string = window.location.href
	onPageChange()
	const observer = new MutationObserver((mutations, observer) => {
		if (location !== window.location.href) {
			location = window.location.href
			onPageChange()
		}
	});
	console.debug('observing')
	observer.observe(document, { childList: true, subtree: true });
}

$(onLoad)
