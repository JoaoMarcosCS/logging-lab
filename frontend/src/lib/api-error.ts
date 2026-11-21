import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

interface ApiFieldError {
  field: string | null;
  message: string;
}

const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tente de novo.';
const RATE_LIMIT_MESSAGE = 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
const OFFLINE_MESSAGE = 'Não foi possível falar com o servidor. Confira sua conexão.';

function getResponse(error: unknown) {
  return axios.isAxiosError<ApiErrorResponse>(error) ? error.response : undefined;
}

function splitMessage(item: string): ApiFieldError {
  const separator = item.indexOf(': ');
  if (separator === -1) return { field: null, message: item };
  return { field: item.slice(0, separator), message: item.slice(separator + 2) };
}

export function getApiStatus(error: unknown): number | undefined {
  return getResponse(error)?.status;
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return GENERIC_ERROR_MESSAGE;

  const response = getResponse(error);
  if (!response) return OFFLINE_MESSAGE;
  if (response.status === 429) return RATE_LIMIT_MESSAGE;
  if (response.status >= 500) return GENERIC_ERROR_MESSAGE;

  const message = response.data?.message;
  if (Array.isArray(message))
    return message.map((item) => splitMessage(item).message)[0] ?? GENERIC_ERROR_MESSAGE;

  return message ?? GENERIC_ERROR_MESSAGE;
}

function getApiFieldErrors(error: unknown): ApiFieldError[] {
  const response = getResponse(error);
  const message = response?.data?.message;
  if (response?.status !== 400 || !Array.isArray(message)) return [];
  return message.map(splitMessage);
}

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  const items = getApiFieldErrors(error);
  if (!items.length) return getApiErrorMessage(error);

  const general: string[] = [];
  for (const { field, message } of items) {
    const path = fields.find((name) => name === field);
    if (path) setError(path, { message });
    else general.push(message);
  }

  return general[0] ?? null;
}
