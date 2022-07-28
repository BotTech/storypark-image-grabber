import $ from 'jquery'
import browser from 'webextension-polyfill'
import ClickEvent = JQuery.ClickEvent

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
	// TODO: Make this idempotent
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

function addOpenInTabLink(contentContainer: HTMLement) {
	// TODO: Make this idempotent
}

function whenElementLoads<TElement = HTMLElement>(
	root: Node,
	find: () => JQuery<TElement>,
	f: (element: TElement) => void): void {
	const result = find()
	if (result.length > 0) {
		f(result[0])
	} else {
		const observer = new MutationObserver((mutations, observer) => {
			const result = find()
			if (result.length > 0) {
				observer.disconnect()
				f(result[0])
			}
		});
		observer.observe(root, { childList: true, subtree: true });
	}
}

let storyContentObserver: MutationObserver | null = null

function observeNewStoryContent() {
	$('#show-post').find<HTMLDivElement>('#story-content').get().forEach(addImageLinks)
	function containerLoaded(container: HTMLDivElement) {
		if (storyContentObserver !== null) storyContentObserver.disconnect()
		storyContentObserver = new MutationObserver((mutations) => {
			mutations.forEach(mutation => {
				mutation.addedNodes.forEach(node => {
					if (node instanceof HTMLElement) {
						$(node).filter('#story-content').get().forEach(addImageLinks)
					}
				})
			})
		});
		storyContentObserver.observe(container, { childList: true, subtree: true });
	}
	whenElementLoads<HTMLDivElement>(document, () => $('#show-post'), containerLoaded)
}

let mainPostObserver: MutationObserver | null = null

function observeNewMainPosts() {
	$('#content-container').find('.post').get().forEach(addOpenInTabLink)
	function containerLoaded(container: HTMLDivElement) {
		mainPostObserver?.disconnect()
		mainPostObserver = new MutationObserver((mutations) => {

		});
		mainPostObserver.observe(container, { childList: true, subtree: true });
	}
	whenElementLoads<HTMLDivElement>(document, () => $('#content-container'), containerLoaded)
}

function observeActivityPage() {
	observeNewStoryContent()
	observeNewMainPosts()
}

function removeObservers() {
	storyContentObserver?.disconnect()
	mainPostObserver?.disconnect()
}

function onPageChange() {
	console.debug('Page changed.')
	removeObservers()
	const pathSegments = window.location.pathname.split('/').filter(segment => segment.length !== 0)
	if (pathSegments[0] === 'activity') {
		console.debug('Activity page detected.')
		observeActivityPage()
	} else {
		console.debug('Unknown page:', window.location)
	}
}

function listenForPageChanges() {
	let location: string = window.location.pathname
	const observer = new MutationObserver(() => {
		if (location !== window.location.pathname) {
			location = window.location.pathname
			onPageChange()
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

function onLoad() {
	onPageChange()
	listenForPageChanges()
}

$(onLoad)
