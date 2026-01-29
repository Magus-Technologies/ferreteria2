export function focusNext() {
  const formElements = Array.from(
    document.querySelectorAll(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
    )
  ) as HTMLElement[]

  const index = formElements.findIndex(el => el === document.activeElement)
  if (index > -1 && index + 1 < formElements.length) {
    formElements[index + 1].focus()
  }
}
