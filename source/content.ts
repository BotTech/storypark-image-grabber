import $ from 'jquery'
import {observeStoryMain, observeNewStoryContent} from './story-content'
import {observeNewMainPosts} from './main-posts'

function onLoad() {
	console.debug('onLoad')
	observeNewStoryContent()
	observeNewMainPosts()
	// TODO: Maybe this should only be added on the story page?
	observeStoryMain()
}

$(onLoad)
