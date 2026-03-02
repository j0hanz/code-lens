type JsonRecord = Record<string, unknown>;

const CONSTRAINT_KEY_VALUES = [
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minItems',
  'maxItems',
  'multipleOf',
  'pattern',
  'format',
] as const;
const CONSTRAINT_KEYS = new Set<string>(CONSTRAINT_KEY_VALUES);
const INTEGER_JSON_TYPE = 'integer';
const NUMBER_JSON_TYPE = 'number';

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripConstraintValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const stripped = new Array<unknown>(value.length);
    for (let index = 0; index < value.length; index += 1) {
      stripped[index] = stripConstraintValue(value[index]);
    }
    return stripped;
  }

  if (isJsonRecord(value)) {
    return stripJsonSchemaConstraints(value);
  }

  return value;
}

export function stripJsonSchemaConstraints(schema: JsonRecord): JsonRecord {
  const result: JsonRecord = {};

  for (const [key, value] of Object.entries(schema)) {
    if (CONSTRAINT_KEYS.has(key)) {
      continue;
    }

    if (key === 'type' && value === INTEGER_JSON_TYPE) {
      result[key] = NUMBER_JSON_TYPE;
      continue;
    }

    result[key] = stripConstraintValue(value);
  }

  return result;
}
