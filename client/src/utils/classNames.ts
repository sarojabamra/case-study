export function joinClassNames(...classNameParts: Array<string | false | null | undefined>): string {
  return classNameParts.filter(Boolean).join(" ");
}
