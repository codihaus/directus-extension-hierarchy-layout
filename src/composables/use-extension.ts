import {useExtensions} from "@directus/extensions-sdk";
import {computed, unref} from "vue";
import { pluralize } from '@directus/utils';

export function useExtension<T extends AppExtensionType | HybridExtensionType>(
    type: T | Ref<T>,
    name: string | Ref<string | null>,
): Ref<AppExtensionConfigs[Plural<T>][number] | null> {
    const extensions = useExtensions();

    return computed(() => {
        if (unref(name) === null) return null;
        return (extensions[pluralize(unref(type))].value as any[]).find(({ id }) => id === unref(name)) ?? null;
    });
}
