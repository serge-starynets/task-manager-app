import { NextResponse } from 'next/server';

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function jsonMessage(message: string, status = 200) {
  return NextResponse.json({ message }, { status });
}

export function jsonError(
  error: string,
  status: number,
  errors?: Record<string, string[]>,
) {
  const body: { error: string; errors?: Record<string, string[]> } = { error };
  if (errors) {
    body.errors = errors;
  }
  return NextResponse.json(body, { status });
}

export function jsonUnauthorized() {
  return jsonError('Unauthorized', 401);
}

export function jsonNotFound(message = 'Not found') {
  return jsonError(message, 404);
}
