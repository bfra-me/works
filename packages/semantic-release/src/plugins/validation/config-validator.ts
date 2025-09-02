/**
 * Plugin configuration validation utilities.
 */

import type {
  ConfigValidationOptions,
  SchemaValidationError,
  SchemaValidationResult,
  ValidationRule,
  ValidationRuleResult,
} from './types.js'

/**
 * Plugin configuration validator class.
 */
export class PluginConfigValidator {
  private readonly rules: ValidationRule[]

  constructor(rules: ValidationRule[] = []) {
    this.rules = [...getDefaultValidationRules(), ...rules]
  }

  /**
   * Validate plugin configuration.
   *
   * @param config - Configuration to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateConfig(config: unknown, options: ConfigValidationOptions = {}): SchemaValidationResult {
    const errors: SchemaValidationError[] = []

    // Apply validation rules
    for (const rule of this.rules) {
      const result = rule.validate(config)
      if (!result.valid) {
        errors.push({
          path: rule.name,
          message: result.message ?? `Rule '${rule.name}' failed`,
          expected: rule.description,
          actual: config,
        })
      }
    }

    // Schema validation if provided
    if (options.schema !== undefined) {
      const schemaErrors = this.validateAgainstSchema(config, options.schema)
      errors.push(...schemaErrors)
    }

    // Strict mode validation
    if (options.strict === true && !options.allowUnknown) {
      const unknownProps = this.findUnknownProperties(config, options.schema)
      for (const prop of unknownProps) {
        errors.push({
          path: prop,
          message: `Unknown property '${prop}'`,
          expected: 'Known property',
          actual: config,
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      value: config,
    }
  }

  /**
   * Add custom validation rule.
   *
   * @param rule - Validation rule to add
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove validation rule by name.
   *
   * @param name - Rule name to remove
   */
  removeRule(name: string): void {
    const index = this.rules.findIndex(rule => rule.name === name)
    if (index !== -1) {
      this.rules.splice(index, 1)
    }
  }

  /**
   * Get all validation rules.
   *
   * @returns Array of validation rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules]
  }

  /**
   * Validate configuration against schema.
   *
   * @param config - Configuration to validate
   * @param schema - Schema to validate against
   * @returns Array of validation errors
   */
  private validateAgainstSchema(
    config: unknown,
    schema: Record<string, unknown>,
  ): SchemaValidationError[] {
    const errors: SchemaValidationError[] = []

    // Basic schema validation - in a real implementation this would use a proper schema validator
    if (typeof config !== 'object' || config === null) {
      errors.push({
        path: 'root',
        message: 'Configuration must be an object',
        expected: 'object',
        actual: config,
      })
      return errors
    }

    const configObj = config as Record<string, unknown>

    // Check required properties
    if ('required' in schema && Array.isArray(schema.required)) {
      for (const requiredProp of schema.required) {
        if (typeof requiredProp === 'string' && !(requiredProp in configObj)) {
          errors.push({
            path: requiredProp,
            message: `Required property '${requiredProp}' is missing`,
            expected: 'Present property',
            actual: undefined,
          })
        }
      }
    }

    // Check property types
    if (
      'properties' in schema &&
      typeof schema.properties === 'object' &&
      schema.properties !== null
    ) {
      const properties = schema.properties as Record<string, unknown>
      for (const [propName, propSchema] of Object.entries(properties)) {
        if (propName in configObj) {
          const propValue = configObj[propName]
          const propErrors = this.validateProperty(propName, propValue, propSchema)
          errors.push(...propErrors)
        }
      }
    }

    return errors
  }

  /**
   * Validate individual property against its schema.
   *
   * @param propName - Property name
   * @param propValue - Property value
   * @param propSchema - Property schema
   * @returns Array of validation errors
   */
  private validateProperty(
    propName: string,
    propValue: unknown,
    propSchema: unknown,
  ): SchemaValidationError[] {
    const errors: SchemaValidationError[] = []

    if (typeof propSchema === 'object' && propSchema !== null) {
      const schema = propSchema as Record<string, unknown>

      // Type validation
      if ('type' in schema && typeof schema.type === 'string') {
        const expectedType = schema.type
        const actualType = Array.isArray(propValue) ? 'array' : typeof propValue

        if (actualType !== expectedType) {
          errors.push({
            path: propName,
            message: `Property '${propName}' must be of type '${expectedType}'`,
            expected: expectedType,
            actual: propValue,
          })
        }
      }

      // Enum validation
      if ('enum' in schema && Array.isArray(schema.enum)) {
        const isValidEnum = schema.enum.includes(propValue)
        if (!isValidEnum) {
          errors.push({
            path: propName,
            message: `Property '${propName}' must be one of: ${schema.enum.join(', ')}`,
            expected: schema.enum.join(' | '),
            actual: propValue,
          })
        }
      }
    }

    return errors
  }

  /**
   * Find unknown properties in configuration.
   *
   * @param config - Configuration object
   * @param schema - Schema to check against
   * @returns Array of unknown property names
   */
  private findUnknownProperties(config: unknown, schema?: Record<string, unknown>): string[] {
    if (typeof config !== 'object' || config === null || schema === undefined) {
      return []
    }

    const configObj = config as Record<string, unknown>
    const knownProps = new Set<string>()

    // Get known properties from schema
    if (
      'properties' in schema &&
      typeof schema.properties === 'object' &&
      schema.properties !== null
    ) {
      const properties = schema.properties as Record<string, unknown>
      for (const propName of Object.keys(properties)) {
        knownProps.add(propName)
      }
    }

    // Find unknown properties
    const unknownProps: string[] = []
    for (const propName of Object.keys(configObj)) {
      if (!knownProps.has(propName)) {
        unknownProps.push(propName)
      }
    }

    return unknownProps
  }
}

/**
 * Get default validation rules for plugin configurations.
 *
 * @returns Array of default validation rules
 */
function getDefaultValidationRules(): ValidationRule[] {
  return [
    {
      name: 'not-null',
      description: 'Configuration should not be null',
      validate: (config: unknown): ValidationRuleResult => ({
        valid: config !== null,
        message: config === null ? 'Configuration cannot be null' : undefined,
      }),
    },
    {
      name: 'not-undefined',
      description: 'Configuration should be defined',
      validate: (config: unknown): ValidationRuleResult => ({
        valid: config !== undefined,
        message: config === undefined ? 'Configuration cannot be undefined' : undefined,
      }),
    },
    {
      name: 'object-type',
      description: 'Configuration should be an object when provided',
      validate: (config: unknown): ValidationRuleResult => {
        if (config === null || config === undefined) {
          return {valid: true} // Allow null/undefined, other rules handle this
        }
        const isObject = typeof config === 'object'
        return {
          valid: isObject,
          message: isObject ? undefined : `Configuration must be an object, got ${typeof config}`,
        }
      },
    },
    {
      name: 'no-circular-references',
      description: 'Configuration should not contain circular references',
      validate: (config: unknown): ValidationRuleResult => {
        try {
          JSON.stringify(config)
          return {valid: true}
        } catch {
          return {
            valid: false,
            message: 'Configuration contains circular references',
          }
        }
      },
    },
  ]
}

/**
 * Create a new plugin configuration validator.
 *
 * @param rules - Custom validation rules
 * @returns Plugin configuration validator instance
 */
export function createPluginConfigValidator(rules: ValidationRule[] = []): PluginConfigValidator {
  return new PluginConfigValidator(rules)
}

/**
 * Validate plugin configuration using default validator.
 *
 * @param config - Configuration to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validatePluginConfig(
  config: unknown,
  options: ConfigValidationOptions = {},
): SchemaValidationResult {
  const validator = createPluginConfigValidator(options.customRules)
  return validator.validateConfig(config, options)
}
