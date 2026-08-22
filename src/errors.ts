import { AxiError } from "axi-sdk-js";

export class AzdoAxiError extends AxiError {
  constructor(message: string, code: string, suggestions: string[] = []) {
    super(message, code, suggestions);
    this.name = "AzdoAxiError";
  }
}

export function validationError(
  message: string,
  suggestions: string[] = [],
): AzdoAxiError {
  return new AzdoAxiError(message, "VALIDATION_ERROR", suggestions);
}
