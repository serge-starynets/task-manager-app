export function forbiddenOrMessage(status: number, message: string): string {
  if (status === 403) {
    return 'Forbidden';
  }
  return message;
}

export function relationErrorCode(status: number): string {
  if (status === 403) {
    return 'Forbidden';
  }
  if (status === 404) {
    return 'NotFound';
  }
  return 'Invalid';
}

export function attachmentErrorCode(status: number, message: string): string {
  if (status === 403) {
    return 'Forbidden';
  }
  if (status === 404) {
    return 'Not found';
  }
  return message;
}
