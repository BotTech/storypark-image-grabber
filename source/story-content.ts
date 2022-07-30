import $ from 'jquery'
import browser from 'webextension-polyfill'
import {onElementAdded, onElementRemoved} from "./observation";
import ClickEvent = JQuery.ClickEvent;

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

function addImageLinks(storyContent: HTMLElement) {
	$(storyContent)
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

function observeStoryContent(showPost: HTMLElement) {
	onElementAdded(showPost, '#story-content', (storyContent) => {
		onElementRemoved(storyContent, () => observeStoryContent(showPost))
		addImageLinks(storyContent)
	})
}

export function observeNewStoryContent() {
	onElementAdded(document, '#show-post', (showPost) => {
		onElementRemoved(showPost, () => observeNewStoryContent())
		observeStoryContent(showPost)
	})
}
