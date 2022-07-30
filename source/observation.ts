import $ from 'jquery'

type FindSelector = Parameters<JQuery['find']>[0]

// Disconnects once an element is found.
// TODO: Optimise this when the selector is a local selector and can be used with $.is().
export function onElementAdded<TElement extends Element = HTMLElement>(
	root: Node,
	selector: FindSelector,
	f: (element: TElement) => void): void {
	const find = () => $(root).find(selector)
	const existingElement = find()
	if (existingElement.length > 0) {
		f(existingElement[0])
	} else {
		const observer = new MutationObserver((mutations, observer) => {
			const result = find()
			if (result.length > 0) {
				observer.disconnect()
				f(result[0])
			}
		});
		observer.observe(root, {childList: true, subtree: true});
	}
}

// Stays connected forever.
// TODO: Optimise this when the selector is a local selector and can be used with $.is().
export function onElementsAdded<TElement extends Element = HTMLElement>(
	root: Node,
	selector: FindSelector,
	f: (elements: TElement[]) => void): void {
	const find: () => JQuery<TElement> = () => $(root).find(selector)
	const existingElements = find()
	if (existingElements.length > 0) {
		f(existingElements.get())
	}
	const observer = new MutationObserver((mutations, observer) => {
		const results = new Set(find().get())
		const matches = []
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node instanceof Element && results.has(node)) {
					matches.push(node)
				}
			})
		})
		if (matches.length > 0) {
			f(matches)
		}
	});
	observer.observe(root, {childList: true, subtree: true});
}

export function onElementRemoved<TElement extends Element = HTMLElement>(
	element: TElement,
	f: (element: TElement) => void): void {
	const observer = new MutationObserver((mutations, observer) => {
		mutations.forEach(mutation => {
			mutation.removedNodes.forEach(node => {
				if (node === element) {
					observer.disconnect()
					f(element)
				}
			})
		})
	});
	if (element.parentElement !== null) {
		const parent = element.parentElement
		observer.observe(parent, {childList: true});
		onElementRemoved(parent, () => f(element))
	}
}
