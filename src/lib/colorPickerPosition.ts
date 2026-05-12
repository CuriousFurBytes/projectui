/**
 * Determines which side a color picker dropdown should open toward.
 * Returns 'left' when the dropdown would overflow the viewport to the right.
 */
export function getColorPickerSide(
  buttonLeft: number,
  viewportWidth: number,
  dropdownWidth: number,
): 'left' | 'right' {
  return buttonLeft + dropdownWidth <= viewportWidth ? 'right' : 'left';
}
