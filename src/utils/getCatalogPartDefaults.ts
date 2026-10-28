import { CatalogPartOption } from '../types';

export function getCatalogPartDefaults(
  catalog: CatalogPartOption,
  category: string,
) {
  return {
    name: catalog.name,
    partNumber: catalog.part_number || '',
    category,
  };
}
