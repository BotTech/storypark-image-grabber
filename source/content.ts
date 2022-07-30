import $ from 'jquery'
import {observeNewStoryContent} from "./story-content";
import {observeNewMainPosts} from "./main-posts";

function onLoad() {
	observeNewStoryContent()
	observeNewMainPosts()
}

$(onLoad)
