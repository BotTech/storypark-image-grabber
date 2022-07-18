import browser from 'webextension-polyfill'

function listen(message) {
	if ('url' in message) {
		return browser.downloads.download({
			url: message.url,
			conflictAction: 'uniquify'
		});
	} else {
		console.error('Unexpected message:', message)
	}
}

browser.runtime.onMessage.addListener(listen);
