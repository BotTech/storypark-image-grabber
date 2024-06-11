import $ from 'jquery'

type FindSelector<E extends HTMLElement> = JQuery.Selector | Element | E | JQuery<E>

function isLocalSelector(selector: FindSelector<any>): boolean {
	return typeof selector === 'string' && !selector.includes(' ')
}

function isSigElement(element: HTMLElement): boolean {
	const classString = $(element).attr('class')
	if (classString === undefined) {
		return false
	}

	const classNames = classString.split(' ')
	return classNames.some(name => name.startsWith('sig-'))
}

function ignoreElement(element: HTMLElement): boolean {
	// Adding a wrapper element will fire an added event for the existing node which will cause it to be wrapped
	// infinitely. We need to ensure that we tag every SIG element and check it here.
	return isSigElement(element) || (element.parentElement !== null && ignoreElement(element.parentElement))
}

function localSelectorMatches<Element extends HTMLElement = HTMLElement>(node: Node, selector: FindSelector<Element>): Element[] {
	const matches: Element[] = []
	if (node instanceof HTMLElement && !ignoreElement(node)) {
		if ($(node).is(selector)) {
			matches.push(node as Element)
		} else {
			$(node).find(selector).each(function () {
				matches.push(this)
			})
		}
	}

	return matches
}

function elementMatches<Element extends HTMLElement = HTMLElement>(node: Node, allElements: Set<Element>): Element[] {
	const matches: Element[] = []
	if (node instanceof HTMLElement && !ignoreElement(node)) {
		if (allElements.has(node as Element)) {
			matches.push(node as Element)
		} else {
			$(node).find('*')
				.filter((i, element) => allElements.has(element as Element))
				.each((i, element) => {
					matches.push(element as Element)
				})
		}
	}

	return matches
}

// Disconnects once an element is found.
export function onElementAdded<Element extends HTMLElement = HTMLElement>(
	root: Node,
	selector: FindSelector<Element>,
	f: (element: Element) => void): void {
	const isLocal = isLocalSelector(selector)
	const find = () => $(root).find<Element>(selector)
	const existingElement = find()
	if (existingElement.length > 0) {
		f(existingElement[0])
	} else {
		const observer = new MutationObserver((mutations, observer) => {
			if (isLocal) {
				for (const mutation of mutations) {
					for (const node of mutation.addedNodes) {
						const matches = localSelectorMatches(node, selector)
						if (matches.length > 0) {
							observer.disconnect()
							f(matches[0])
							return
						}
					}
				}
			} else {
				find().first().each((i, element) => {
					observer.disconnect()
					f(element)
				})
			}
		})
		observer.observe(root, {childList: true, subtree: true})
	}
}

// Stays connected forever.
export function onElementsAdded<Element extends HTMLElement = HTMLElement>(
	root: Node,
	selector: FindSelector<Element>,
	f: (elements: Element[], observer: MutationObserver) => void): void {
	// This is a bit hacky but will work so long as we remember to include spaces in any descendent selectors.
	const isLocal = isLocalSelector(selector)
	const find: () => JQuery<Element> = () => $(root).find<Element>(selector)
	const observer = new MutationObserver((mutations, observer) => {
		const addedElements: Element[] = []
		if (isLocal) {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					const matches = localSelectorMatches(node, selector)
					addedElements.push(...matches)
				}
			}
		} else {
			// The selector is not a local selector, so we get all the matching elements and then find the intersection
			// of that and the added nodes.
			const allElements = new Set<Element>(find().get())
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					const matches = elementMatches(node, allElements)
					addedElements.push(...matches)
				}
			}
		}

		if (addedElements.length > 0) {
			f(addedElements, observer)
		}
	})
	observer.observe(root, {childList: true, subtree: true})
	const existingElements = find()
	if (existingElements.length > 0) {
		const elements = existingElements.get()
		f(elements, observer)
	}
}

export function onElementRemoved<Element extends HTMLElement = HTMLElement>(
	element: Element,
	f: (element: Element) => void): void {
	const observer = new MutationObserver((mutations, observer) => {
		for (const mutation of mutations) {
			for (const node of mutation.removedNodes) {
				if (node === element) {
					observer.disconnect()
					f(element)
				}
			}
		}
	})
	if (element.parentElement !== null) {
		const parent = element.parentElement
		observer.observe(parent, {childList: true})
		onElementRemoved(parent, () => {
			f(element)
		})
	}
}
