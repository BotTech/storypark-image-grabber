import $ from 'jquery'
import {onElementAdded, onElementRemoved, onElementsAdded} from "./observation";

const dropdownArrowWidth = 28
const dropdownArrowMargin = 5
const iconWidth = 21
const openTabIconPadding = 2 * dropdownArrowMargin + dropdownArrowWidth
const openTabIconWidth = iconWidth + openTabIconPadding

function addOpenInTabLink(post: HTMLElement): boolean {
	console.debug("Adding open in tab link to post", post)
	const postId = $(post).attr('data-post-id') ?? ''
	const href = `${window.location.href}?community_post_id=${postId}`
	const result = $(post)
		.find('div.sp-o-flex' as string)
		.filter(function () {
			return $(this).children('h1').length > 0
		})
		.first()
		.append(function () {
			return $('<a>')
				.attr('href', href)
				.attr('target', '_blank')
				.on('click', function (e) {
					// Don't let the click event on the div that is the parent of the flex container fire as that will
					// prevent the default from firing.
					e.stopPropagation()
				})
				.addClass(['sp-c-card__icon', 'sp-u-padding-left--none'])
				.attr('style', `padding-right: ${openTabIconPadding}px; width: ${openTabIconWidth}px;`)
				.append(
					$('<i>').addClass(['sp-h__icon', 'fa', 'fa-external-link', 'sp-u-text-color--teal-60'])
				)
		})
		.each(function () {
			$(this)
				.children('h1')
				.addClass('sp-u-padding-right--none')
				.attr('style', 'flex-grow: 1;')
		})
	return result.length > 0
}

export function observeNewMainPosts() {
	console.debug("observeNewMainPosts")
	onElementAdded(document, '#content-container', (contentContainer) => {
		onElementRemoved(contentContainer, observeNewMainPosts)
		onElementsAdded(contentContainer, 'article.post', (posts) => {
			console.debug("New posts added", posts)
			posts.forEach((post) => {
				// The post gets added but the contents isn't there until a bit later.
				onElementsAdded(post, '*', (children, observer) => {
					// Disconnect the observer once we managed to add a link.
					if (children.find(addOpenInTabLink)) observer.disconnect()
				})
			})
		})
	})
}
