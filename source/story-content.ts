import $ from 'jquery'
import browser from 'webextension-polyfill'
import {onElementAdded, onElementRemoved, onElementsAdded} from './observation'
import ClickEvent = JQuery.ClickEvent

const linkContainer
	= $('<div>').addClass('sig-image-container')

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

// Old
function addImageLinks(storyContent: HTMLElement) {
	$(storyContent)
		.find<HTMLImageElement>('img')
		.wrap(linkContainer)
		// Uses an anonymous function rather than a lambda to get this.
		.after(downloadLink)
}

function downloadLink(this: HTMLElement) {
	// Uses an anonymous function rather than a lambda to get this.
	const link = $('<a>')
		.addClass('sig-image-download-link')
		.attr('href', $(this).attr('src') ?? null)
		.text('\u2913')
	const url = $(this).attr('src')
	if (url !== undefined) {
		return link.on('click', download(url))
	}

	return link
}

// Old
function observeStoryContent(showPost: HTMLElement) {
	onElementAdded(showPost, '#story-content', storyContent => {
		onElementRemoved(storyContent, () => {
			observeStoryContent(showPost)
		})
		addImageLinks(storyContent)
	})
}

// Old
export function observeNewStoryContent() {
	console.debug('observeNewStoryContent')
	onElementAdded(document, '#show-post', showPost => {
		onElementRemoved(showPost, () => {
			observeNewStoryContent()
		})
		observeStoryContent(showPost)
	})
}

function observeContainerImages(child: HTMLElement) {
	console.debug('observeContainerImages')
	onElementsAdded(child, '.image-container > img', image => {
		$(image).after(downloadLink)
	})
}

function observeVideos(child: HTMLElement) {
	console.debug('observeVideos')
	onElementsAdded(child, 'video', video => {
		$(video)
			.wrap(linkContainer)
			.after(downloadLink)
	})
}

export function observeStoryMain() {
	console.debug('observeMain')
	onElementAdded(document, 'main', main => {
		onElementRemoved(main, () => {
			observeStoryMain()
		})
		observeContainerImages(main)
		observeVideos(main)
	})
}
