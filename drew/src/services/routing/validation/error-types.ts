// src/services/routing/validation/error-types.ts
/**
 * Routing System Error Types
 * 
 * Custom error classes for the routing system enabling precise error handling
 * and logging. Includes specific error types for different failure scenarios.
 * 
 * @packageDocumentation
 */

export class RoutingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'RoutingError'

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RoutingError.prototype)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details
    }
  }
}

export class NotDiamondError extends RoutingError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'NOT_DIAMOND_ERROR', details)
    this.name = 'NotDiamondError'

    Object.setPrototypeOf(this, NotDiamondError.prototype)
  }
}

export class ConfigurationError extends RoutingError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'CONFIGURATION_ERROR', details)
    this.name = 'ConfigurationError'

    Object.setPrototypeOf(this, ConfigurationError.prototype)
  }
}

export class ValidationError extends RoutingError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'

    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class RoutingCapacityError extends RoutingError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'CAPACITY_ERROR', details)
    this.name = 'RoutingCapacityError'

    Object.setPrototypeOf(this, RoutingCapacityError.prototype)
  }
}

export class RoutingTimeoutError extends RoutingError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'TIMEOUT_ERROR', details)
    this.name = 'RoutingTimeoutError'

    Object.setPrototypeOf(this, RoutingTimeoutError.prototype)
  }
}