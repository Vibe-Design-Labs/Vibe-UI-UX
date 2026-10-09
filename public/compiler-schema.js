// Small validator for the JSON Schema vocabulary used by compiler/schema.json.
// Schemas are bundled project data; remote schemas and executable expressions are not supported.
export function validateCompilerSchema(value, schema, root = schema, path = '$') {
  const fail = () => { throw new Error('Invalid compiler data at ' + path); };
  if (schema.$ref) {
    if (!schema.$ref.startsWith('#/$defs/')) fail();
    const definition = root.$defs?.[schema.$ref.slice(8)];
    if (!definition) fail();
    return validateCompilerSchema(value, definition, root, path);
  }
  if (schema.anyOf) {
    for (const branch of schema.anyOf) { try { validateCompilerSchema(value, branch, root, path); return value; } catch {} }
    fail();
  }
  if ('const' in schema && value !== schema.const) fail();
  if (schema.enum && !schema.enum.includes(value)) fail();
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const accepted = schema.type ? (Array.isArray(schema.type) ? schema.type : [schema.type]) : null;
  if (accepted && !accepted.includes(type) && !(type === 'number' && accepted.includes('integer') && Number.isInteger(value))) fail();
  if (type === 'number' && (!Number.isFinite(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity))) fail();
  if (type === 'string' && (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? Infinity) || schema.pattern && !new RegExp(schema.pattern).test(value))) fail();
  if (type === 'array') {
    if (value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? Infinity)) fail();
    if (schema.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) fail();
    value.forEach((item, index) => validateCompilerSchema(item, schema.items || {}, root, path + '[' + index + ']'));
  }
  if (type === 'object') {
    if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail();
    const keys = Object.keys(value);
    if (keys.length > (schema.maxProperties ?? Infinity)) fail();
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) fail();
    for (const key of keys) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) fail();
      if (Object.hasOwn(schema.properties || {}, key)) validateCompilerSchema(value[key], schema.properties[key], root, path + '.' + key);
      else if (schema.additionalProperties === false) fail();
      else if (typeof schema.additionalProperties === 'object') validateCompilerSchema(value[key], schema.additionalProperties, root, path + '.' + key);
    }
  }
  return value;
}
export function assertCompilerType(value, name, schemas) {
  return validateCompilerSchema(value, {$ref:'#/$defs/' + name}, schemas);
}
