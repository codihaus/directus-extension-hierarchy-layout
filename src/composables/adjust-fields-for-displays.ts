import {Field} from '@directus/types';
import {pluralize} from '@directus/utils';

/**
 * Dependencies resolved once in `setup()` and passed in, so this function never
 * calls inject-based composables (`useStores`/`useExtensions`). Calling those
 * inside a reactive `computed` breaks when the computed re-evaluates outside an
 * active component instance (e.g. when the hierarchy layout component is reused
 * across collections) — Vue's `inject` then fails with
 * "[useStores]: The stores could not be found" and every label renders as "--".
 */
export interface AdjustFieldsDeps {
    fieldsStore: { getField: (collection: string, field: string) => Field | null };
    extensions: Record<string, { value: any[] }>;
}

export function adjustFieldsForDisplays(
    fields: readonly string[],
    parentCollection: string,
    deps: AdjustFieldsDeps,
): string[] {
    const {fieldsStore, extensions} = deps;

    const adjustedFields: string[] = fields
        .map((fieldKey) => {
            const field: Field | null = fieldsStore.getField(parentCollection, fieldKey);

            if (!field) return fieldKey;
            if (field.meta?.display === null) return fieldKey;

            const displayId = field.meta?.display ?? null;
            if (!displayId) return fieldKey;

            const display = (extensions[pluralize('display')].value as any[])
                .find(({id}) => id === displayId) ?? null;

            if (!display) return fieldKey;
            if (!display.fields) return fieldKey;

            let fieldKeys: string[] | null = null;

            if (Array.isArray(display.fields)) {
                fieldKeys = display.fields.map((relatedFieldKey: string) => `${fieldKey}.${relatedFieldKey}`);
            }

            if (typeof display.fields === 'function') {
                fieldKeys = display
                    .fields(field.meta?.display_options, {
                        collection: field.collection,
                        field: field.field,
                        type: field.type,
                    })
                    .map((relatedFieldKey: string) => `${fieldKey}.${relatedFieldKey}`);
            }

            if (fieldKeys) {
                return fieldKeys.map((fieldKey) => {
                    /**
                     * This is for the special case where you want to show a thumbnail in a relation to
                     * directus_files. The thumbnail itself isn't a real field, but shows the thumbnail based
                     * on the other available fields (like ID, title, and type).
                     */
                    if (fieldKey.includes('$thumbnail') && field.collection === 'directus_files') {
                        return fieldKey
                            .split('.')
                            .filter((part) => part !== '$thumbnail')
                            .join('.');
                    }

                    return fieldKey;
                });
            }

            return fieldKey;
        })
        .flat();

    return adjustedFields;
}
