export type ServiceFailure = {
  ok: false;
  status: number;
  message: string;
  errors?: Record<string, string[]>;
};

export type ServiceResult<T> = { ok: true; data: T } | ServiceFailure;

export type ServiceVoidResult = { ok: true } | ServiceFailure;
