import $ from 'jquery'
import {observeStoryMain, observeNewStoryContent} from './story-content'
import {observeNewMainPosts} from './main-posts'

function onLoad() {
	console.debug('onLoad')
	observeNewStoryContent()
	observeNewMainPosts()
	observeStoryMain()
}

$(onLoad)
