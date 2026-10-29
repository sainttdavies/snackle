export function fillCopy(template:string, values:Record<string,string|number> = {}) {
  return template.replace(/\{([a-zA-Z]+)\}/g,(match,key)=>key in values ? String(values[key]) : match);
}
