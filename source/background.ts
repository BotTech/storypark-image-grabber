import browser from 'webextension-polyfill'

function isUrlMessage(message: any): message is {url: string} {
	return typeof message.url === 'string'
}

function listen(message: any): Promise<any> | void {
	if (isUrlMessage(message)) {
		return browser.downloads.download({
			url: message.url,
			conflictAction: 'uniquify'
		})
	}

	console.error('Unexpected message:', message)
}

browser.runtime.onMessage.addListener(listen)
