function renderDynamicTemplate(template, dataMap) {
    return template.replace(/\{%([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)%\}/g, (_, module, key) => {
      const value = dataMap?.[module]?.[key];
      if (!value) return "";
      return Array.isArray(value) ? value.join("\n") : value;
    });
  }
  
  module.exports = { renderDynamicTemplate };
  