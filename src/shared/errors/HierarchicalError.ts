export class HierarchicalError extends Error {
  public cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
  }

  // 階層的にエラーを文字列化
  public override toString(): string {
    let errorMessage = `${this.message}`;
    if (this.cause) {
      errorMessage += `\n原因: ${this.cause}`;
    }
    return errorMessage;
  }
}
