import ReactNativeBlobUtil from 'react-native-blob-util';

import type {
  CatalogPart,
  CatalogPartOption,
  Make,
  MakeOption,
  Model,
  ModelOption,
  ModelYear,
  PartCategory,
  PartCategoryOption,
  VariantOption,
  VehicleVariant,
  YearOption,
} from '../types';
import { resolveCatalogProvenance } from '../utils/catalogProvenance';
import type { GarageExportPayload } from '../utils/garageExport';
import {
  arrayBufferToBase64,
  buildVehicleExportFilename,
  parseContentDispositionFilename,
} from '../utils/garageExport';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_VERSION = 'v1';

export function mapMake(raw: Make): MakeOption {
  return { ...raw, id: String(raw.id), name: raw.name };
}

export function mapModel(raw: Model): ModelOption {
  return { ...raw, id: String(raw.id), name: raw.name };
}

export function mapModelYear(raw: ModelYear): YearOption {
  return { ...raw, id: String(raw.year), name: String(raw.year) };
}

export function mapCategory(raw: PartCategory): PartCategoryOption {
  return {
    id: String(raw.id),
    name: raw.name,
    parent_id: raw.parent_id ?? null,
  };
}

export function mapPart(raw: CatalogPart): CatalogPartOption {
  return {
    ...raw,
    id: String(raw.id),
    name: raw.name,
    categoryId: raw.category_id != null ? String(raw.category_id) : undefined,
  };
}

export function mapVariant(raw: VehicleVariant): VariantOption {
  const provenance = resolveCatalogProvenance(raw);
  return {
    ...raw,
    id: String(raw.id),
    name: raw.trim,
    catalogConfidence: provenance.confidence,
    independentlyVerified: provenance.independentlyVerified,
  };
}

let apiBearerToken = '';

export function normalizeBearerToken(token: string): string {
  const trimmed = token.trim();
  if (/^bearer\s+/i.test(trimmed)) {
    return trimmed.replace(/^bearer\s+/i, '').trim();
  }
  return trimmed;
}

export function setApiBearerToken(token: string): void {
  apiBearerToken = normalizeBearerToken(token);
}

export function getApiBearerToken(): string {
  return apiBearerToken;
}

export function buildRequestHeaders(
  init?: RequestInit,
  token: string = apiBearerToken,
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (init?.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (init?.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => {
      headers[key] = value;
    });
  }
  return headers;
}

async function request<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: buildRequestHeaders(init),
    });
  } catch {
    throw new ApiError('Unable to reach API. Check the base URL and network.');
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : String(body.message);
      } else if (body?.error) {
        message = String(body.error);
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function getMakes(
  baseUrl: string,
  region: string,
): Promise<MakeOption[]> {
  const rows = await request<Make[]>(
    baseUrl,
    `/api/${API_VERSION}/vehicles/makes?region=${encodeURIComponent(region)}`,
  );

  return rows.map(mapMake);
}

export async function getModels(
  baseUrl: string,
  makeId: string,
): Promise<ModelOption[]> {
  const rows = await request<Model[]>(
    baseUrl,
    `/api/${API_VERSION}/vehicles/models?make_id=${encodeURIComponent(makeId)}`,
  );
  return rows.map(mapModel);
}

export async function getModelYears(
  baseUrl: string,
  modelId: string,
): Promise<YearOption[]> {
  const rows = await request<ModelYear[]>(
    baseUrl,
    `/api/${API_VERSION}/vehicles/years?model_id=${encodeURIComponent(
      modelId,
    )}`,
  );
  return rows.map(mapModelYear);
}

export async function getVariants(
  baseUrl: string,
  modelId: string,
  year: string,
): Promise<VariantOption[]> {
  console.log(
    'getVariants',
    baseUrl,
    modelId,
    year,
    `/api/${API_VERSION}/vehicles/models/${modelId}/variants?year=${encodeURIComponent(
      year,
    )}`,
  );
  const rows = await request<VehicleVariant[]>(
    baseUrl,
    `/api/${API_VERSION}/vehicles/models/${modelId}/variants?year=${encodeURIComponent(
      year,
    )}`,
  );
  return rows.map(mapVariant);
}

export async function getCategories(
  baseUrl: string,
  parentId?: string,
): Promise<PartCategoryOption[]> {
  const qs =
    parentId != null ? `?parent_id=${encodeURIComponent(parentId)}` : '';
  const rows = await request<PartCategory[]>(baseUrl, `/categories${qs}`);
  return rows.map(mapCategory);
}

export async function getParts(
  baseUrl: string,
  categoryId: string,
): Promise<CatalogPartOption[]> {
  const rows = await request<CatalogPart[]>(
    baseUrl,
    `/api/${API_VERSION}/parts?category_id=${encodeURIComponent(categoryId)}`,
  );
  return rows.map(mapPart);
}

export async function probeApiHealth(
  baseUrl: string,
  bearerToken?: string,
): Promise<boolean> {
  try {
    const token =
      bearerToken !== undefined
        ? normalizeBearerToken(bearerToken)
        : apiBearerToken;
    const url = `${baseUrl.replace(/\/$/, '')}/health`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return false;
    }
    const result = (await response.json()) as {ok?: boolean};
    return result.ok === true;
  } catch {
    return false;
  }
}

export type VehiclePdfExportResult = {
  path: string;
  filename: string;
};

export async function exportVehiclePdf(
  baseUrl: string,
  payload: GarageExportPayload,
): Promise<VehiclePdfExportResult> {
  const vehicle = payload.vehicles[0];
  if (vehicle == null) {
    throw new ApiError('Export requires at least one vehicle.');
  }

  const fallbackFilename = buildVehicleExportFilename(vehicle);
  const url = `${baseUrl.replace(/\/$/, '')}/vehicles/export`;
  const body = JSON.stringify(payload);
  const headers = buildRequestHeaders({ body });
  headers.Accept = 'application/pdf';

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
  } catch {
    throw new ApiError('Unable to reach API. Check the base URL and network.');
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = Array.isArray(errorBody.message)
          ? errorBody.message.join(', ')
          : String(errorBody.message);
      } else if (errorBody?.error) {
        message = String(errorBody.error);
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  const filename =
    parseContentDispositionFilename(
      response.headers.get('content-disposition'),
    ) ?? fallbackFilename;
  const buffer = await response.arrayBuffer();
  const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${filename}`;
  await ReactNativeBlobUtil.fs.writeFile(
    path,
    arrayBufferToBase64(buffer),
    'base64',
  );

  return { path, filename };
}
