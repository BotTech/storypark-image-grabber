import $ from 'jquery'
import {onElementAdded, onElementRemoved, onElementsAdded} from './observation'

const dropdownArrowWidth = 28
const dropdownArrowMargin = 5
const iconWidth = 21
const openTabIconPadding = (2 * dropdownArrowMargin) + dropdownArrowWidth
const openTabIconWidth = iconWidth + openTabIconPadding

type PostType = 'story'

function isPostType(postType: string): postType is PostType {
	return postType === 'story'
}

type IgnoredPostType = 'community-post'

function isIgnoredPostType(postType: string): postType is IgnoredPostType {
	return postType === 'community-post'
}

function postSelector(postType: PostType): string {
	// This has to be an element that contains div.sp-o-flex h1
	switch (postType) {
		case 'story': { return 'a[data-type="story"]' }
	}
}

function postUrl(postId: string, dataType: PostType): string {
	switch (dataType) {
		case 'story': { return `stories/${postId}` }
	}
}

function maybeAddOpenInTabLink(child: HTMLElement, postId: string, dataType: PostType): boolean {
	const url = postUrl(postId, dataType)
	const result = $(child)
		.find('div.sp-o-flex' as string)
		.filter(function () {
			return $(this).children('h1').length > 0
		})
		.first()
		.append(() => $('<a>')
			.attr('href', url)
			.attr('target', '_blank')
			.on('click', event => {
				// Don't let the click event on the div that is the parent of the flex container fire as that will
				// prevent the default from firing.
				event.stopPropagation()
			})
			.addClass(['sp-c-card__icon', 'sp-u-padding-left--none'])
			.attr('style', `padding-right: ${openTabIconPadding}px; width: ${openTabIconWidth}px;`)
			.append(
				$('<i>').addClass(['sp-h__icon', 'fa', 'fa-external-link', 'sp-u-text-color--teal-60'])
			))
		.each(function () {
			$(this)
				.children('h1')
				.addClass('sp-u-padding-right--none')
				.attr('style', 'flex-grow: 1;')
		})
	return result.length > 0
}

function observePost(post: HTMLElement, postType: "story") {
	const postId = $(post).attr('data-post-id') ?? ''
	const selector = postSelector(postType)
	// The post gets added but the contents isn't there until a bit later.
	onElementsAdded(post, selector, (children, observer) => {
		// Disconnect the observer once we managed to add a link.
		if (children.some(child => maybeAddOpenInTabLink(child, postId, postType))) {
			console.debug('Added open in tab link to post.', post)
			observer.disconnect()
		} else {
			console.debug('Unable to add open in tab link to post. Will try again on next change.', post)
		}
	})
}

export function observeNewMainPosts() {
	console.debug('observeNewMainPosts')
	onElementAdded(document, '#content-container', contentContainer => {
		onElementRemoved(contentContainer, observeNewMainPosts)
		onElementsAdded(contentContainer, 'article.post', posts => {
			console.debug('New posts added', posts)
			for (const post of posts) {
				const postType = $(post).attr('data-type') ?? ''
				if (isPostType(postType)) {
					observePost(post, postType)
				} else if (isIgnoredPostType(postType)) {
					console.debug(`Ignoring post type: ${postType}`)
				} else {
					console.warn(`Unknown post type: ${postType}`)
					debugger
				}
			}
		})
	})
}
