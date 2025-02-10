interface Section {
  name: string
  content: string
}

export function buildPrompt(sections: Section[]): string {
  return sections
    .map(section => `
<${section.name}>
${section.content}
</${section.name}>`.trim())
    .join('\n\n')
    .trim()
}