import $ from 'jquery'

type FindSelector<E extends HTMLElement> = JQuery.Selector | Element | E | JQuery<E>

function isSigElement(element: HTMLElement): boolean {
	const classString = $(element).attr("class")
	if (classString === undefined) return false
	const classNames = classString.split(' ')
	return classNames.find(name => name.startsWith("sig-")) !== undefined
}

function ignoreElement(element: HTMLElement): boolean {
	// Adding a wrapper element will fire an added event for the existing node which will cause it to be wrapped
	// infinitely. We need to ensure that we tag every SIG element and check it here.
	return isSigElement(element) || (element.parentElement !== null && ignoreElement(element.parentElement))
}

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
	f: (elements: TElement[], observer: MutationObserver) => void,
	debug?: boolean): void {
	console.debug("Observing added elements that match selector", selector)
	// This is a bit hacky but will work so long as we remember to include spaces in any descendent selectors.
	const isLocal = typeof selector === 'string' && !selector.includes(' ')
	const find: () => JQuery<TElement> = () => $(root).find<TElement>(selector)
	const observer = new MutationObserver((mutations, observer) => {
		// The selector might not be a local selector so we get all the matching elements and then find the intersection
		// of that and the added nodes.
		const currentElements = new Set<HTMLElement>(find().get())
		const addedElements: TElement[] = []
		mutations.forEach((mutation) => {
			if (debug) console.debug(mutation)
			mutation.addedNodes.forEach((node) => {
				// if (debug && currentElements.size > 0) {
				// 	debugger
				// }
				// The addedNodes only contains the parent node. We have to traverse the whole thing to find them all.
				if (node instanceof HTMLElement && !ignoreElement(node)) {
					if (isLocal) {
						// Check if the added node matches the jQuery selector
						if ($(node).is(selector)) {
							debugger
							addedElements.push(node as TElement)
						}
						// Also check if any descendants of the added node match the selector
						$(node).find(selector).each(function() {
							debugger
							addedElements.push(this as TElement)
						});
					} else {
						if (currentElements.has(node)) {
							addedElements.push(node as TElement)
						} else {
							$(node).find('*')
								.filter((i, e) => currentElements.has(e))
								.each((i, e) => { addedElements.push(e as TElement) })
						}
					}
				}
			})
		})
		if (addedElements.length > 0) {
			console.debug("Added elements", addedElements)
			f(addedElements, observer)
		}
	});
	observer.observe(root, {childList: true, subtree: true});
	const existingElements = find()
	if (existingElements.length > 0) {
		const elements = existingElements.get()
		console.debug("Existing elements", elements)
		f(elements, observer)
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
