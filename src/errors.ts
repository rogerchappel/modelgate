export class ModelgateError extends Error {
  constructor(message: string, readonly code = "MODELGATE_ERROR") {
    super(message);
    this.name = "ModelgateError";
  }
}

export class ConfigError extends ModelgateError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}
