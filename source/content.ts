import $ from 'jquery'
import {observeMain, observeNewStoryContent} from './story-content'
import {observeNewMainPosts} from './main-posts'

function onLoad() {
	console.debug('onLoad')
	// OnElementAdded(document, '*', (element) => {
	// 	console.debug("Added element", element)
	// })
	observeNewStoryContent()
	observeNewMainPosts()
	observeMain()
}

$(onLoad)
