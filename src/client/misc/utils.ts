export function isNaturalNumber(value: any): boolean {
  if (isNaN(value)) return false
  let x = parseFloat(value)
  return (x | 0) === x && x > 0
}
