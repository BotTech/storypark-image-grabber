import $ from 'jquery'

type FindSelector<E extends HTMLElement> = JQuery.Selector | Element | E | JQuery<E>

// Disconnects once an element is found.
// TODO: Optimise this when the selector is a local selector and can be used with $.is().
export function onElementAdded<TElement extends HTMLElement = HTMLElement>(
	root: Node,
	selector: FindSelector<TElement>,
	f: (element: TElement) => void): void {
	const find = () => $(root).find<TElement>(selector)
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
export function onElementsAdded<TElement extends HTMLElement = HTMLElement>(
	root: Node,
	selector: FindSelector<TElement>,
	f: (elements: TElement[], observer: MutationObserver) => void): void {
	console.debug("Observing added elements that match selector", selector)
	const find: () => JQuery<TElement> = () => $(root).find<TElement>(selector)
	const observer = new MutationObserver((mutations, observer) => {
		// The selector might not be a local selector so we get all the matching elements and then find the intersection
		// of that and the added nodes.
		const currentElements = new Set<HTMLElement>(find().get())
		const addedElements: TElement[] = []
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node instanceof HTMLElement && currentElements.has(node)) {
					addedElements.push(node as TElement)
				}
			})
		})
		console.debug("Added elements", addedElements)
		if (addedElements.length > 0) {
			f(addedElements, observer)
		}
	});
	observer.observe(root, {childList: true, subtree: true});
	const existingElements = find()
	console.debug("Existing elements", existingElements)
	if (existingElements.length > 0) {
		f(existingElements.get(), observer)
	}
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
