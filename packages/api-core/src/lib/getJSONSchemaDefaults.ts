import type {SchemaWrapper} from 'oas/operation/get-parameters-as-json-schema'
import type {SchemaObject} from 'oas/types'

import traverse from 'json-schema-traverse'

/**
 * Run through a JSON Schema object and compose up an object containing default data for any schema
 * property that is required and also has a defined default.
 *
 * Code partially adapted from the `json-schema-default` package but modified to only return
 * defaults of required properties.
 *
 * @todo This is a good candidate to be moved into a core `oas` library method.
 * @see {@link https://github.com/mdornseif/json-schema-default}
 */
export default function getJSONSchemaDefaults(jsonSchemas: SchemaWrapper[]) {
  return jsonSchemas
    .map(({type: payloadType, schema: jsonSchema}) => {
      const defaults: Record<string, unknown> = {}
      traverse(
        jsonSchema,
        (
          schema: SchemaObject,
          pointer: string,
          _rootSchema: SchemaObject,
          parentPointer?: string,
          _parentKeyword?: string,
          parentSchema?: SchemaObject,
          indexProperty?: number | string,
        ) => {
          if (!pointer.startsWith('/properties/')) {
            return
          }

          if (
            Array.isArray(parentSchema?.required) &&
            parentSchema?.required.includes(String(indexProperty))
          ) {
            if (schema.type === 'object' && indexProperty) {
              defaults[indexProperty] = {}
            }

            let destination = defaults
            if (parentPointer) {
              // To map nested objects correct we need to pick apart the parent pointer.
              parentPointer
                .replace(/\/properties/g, '')
                .split('/')
                .forEach((subSchema: string) => {
                  if (subSchema === '') {
                    return
                  }

                  destination = (destination?.[subSchema] as Record<string, unknown>) || {}
                })
            }

            if (schema.default !== undefined) {
              if (indexProperty !== undefined) {
                destination[indexProperty] = schema.default
              }
            }
          }
        },
      )

      if (!Object.keys(defaults).length) {
        return {}
      }

      return {
        // @todo should we filter out empty and undefined objects from here with `remove-undefined-objects`?
        [payloadType]: defaults,
      }
    })
    .reduce((prev, next) => Object.assign(prev, next))
}
