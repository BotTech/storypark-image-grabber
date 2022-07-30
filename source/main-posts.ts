import $ from 'jquery'
import {onElementAdded, onElementRemoved, onElementsAdded} from "./observation";
import {observeNewStoryContent} from "./story-content";

function addOpenInTabLink(post: HTMLElement) {
	// TODO: Make this idempotent
}

export function observeNewMainPosts() {
	onElementAdded(document, '#content-container', (showPost) => {
		onElementRemoved(showPost, observeNewMainPosts)
		onElementsAdded(showPost, 'article.post', (posts) => {
			posts.forEach(addOpenInTabLink)
		})
	})
}
