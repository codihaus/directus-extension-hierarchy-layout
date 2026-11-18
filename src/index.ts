import {
    defineLayout,
    getFieldsFromTemplate,
    useCollection,
    useExtensions,
    useItems,
    useStores,
    useSync
} from '@directus/extensions-sdk';
import LayoutComponent from './layout.vue';
import ForestOptions from "./hierarchy-options.vue";
import {computed, ref, toRefs, unref, watch} from 'vue';
import {syncRefProperty} from "./composables/use.sync.ref.property";
import {useRouter} from "vue-router";
import {adjustFieldsForDisplays} from "./composables/adjust-fields-for-displays";

export default defineLayout({
    id: 'hierarchy',
    name: `Hierarchy`,
    icon: 'account_tree',
    component: LayoutComponent,
    slots: {
        options: ForestOptions,
        sidebar: () => null,
        actions: () => null,
    },
    setup(props, {emit}) {
        const name = ref('Hierarchy Layout');
        const selection = useSync(props, 'selection', emit);
        const layoutOptions = useSync(props, 'layoutOptions', emit);
        const layoutQuery = useSync(props, 'layoutQuery', emit);
        const router = useRouter()

        const {collection, filter, search, filterUser} = toRefs(props);
        const {info, primaryKeyField, fields: fieldsInCollection} = useCollection(collection);

        // Resolve inject-based dependencies once, here in setup(), where Vue's
        // `inject` is valid. Passing them into the `fields` computed avoids calling
        // `useStores`/`useExtensions` on re-evaluation when this layout component is
        // reused across collections and no component instance is active.
        const {useFieldsStore} = useStores();
        const fieldsStore = useFieldsStore();
        const extensions = useExtensions();

        function useLayoutQuery() {
            const page = syncRefProperty(layoutQuery, 'page', 1);
            const limit = syncRefProperty(layoutQuery, 'limit', -1);
            const defaultSort = computed(() => (primaryKeyField.value ? [primaryKeyField.value?.field] : []));
            const sort = syncRefProperty(layoutQuery, 'sort', defaultSort);

            const fields = computed<string[]>(() => {
                if (!primaryKeyField.value || !props.collection) return [];
                const fields = [
                    primaryKeyField.value.field,
                    optParentField.value,
                ];

                if (info.value.meta.sort_field) {
                    fields.push(info.value.meta.sort_field);
                }

                const templateFields: string[] = [];
                if(optTitle.value) {
                    templateFields.push(
                        ...getFieldsFromTemplate(optTitle.value)
                    );
                }

                const titleFields = adjustFieldsForDisplays(templateFields, props.collection, {
                    fieldsStore,
                    extensions,
                });

                /**
                 * A title that reads a field off the parent relation
                 * (`{{parent.title}}`, or a `{{parent}}` whose display expands to
                 * one) makes Directus answer with the related object instead of
                 * the bare key, and that object holds only the fields that were
                 * asked for. Request the parent's primary key alongside, so
                 * `useBuildForest` can read the id back out; without it every
                 * lookup misses and the tree renders as a flat list.
                 */
                if (titleFields.some((field) => field.startsWith(`${optParentField.value}.`))) {
                    fields.push(`${optParentField.value}.${primaryKeyField.value.field}`);
                }

                return [...fields, ...titleFields];
            });

            return { sort, limit, page, fields };
        }

        function useLayoutOptions() {
            const optParentField = createViewOption<number>('parentField', "parent");
            const optTitle = createViewOption<number>('title', "{{name}}");

            return {
                optParentField,
                optTitle
            };

            function createViewOption<T>(key: keyof LayoutOptions, defaultValue: any) {
                return computed<T>({
                    get() {
                        return layoutOptions.value?.[key] !== undefined ? layoutOptions.value[key] : defaultValue;
                    },
                    set(newValue: T) {
                        layoutOptions.value = {
                            ...layoutOptions.value,
                            [key]: newValue,
                        };
                    },
                });
            }
        }

        const {
            optParentField,
            optTitle
        } = useLayoutOptions();

        const parentField = computed(() => {
            return fieldsInCollection.value.find(field => field.field === optParentField.value);
        })

        const relationFields = computed(() => {
            return fieldsInCollection.value.filter(field => {
                return field.schema?.foreign_key_table === props.collection;
            });
        })

        if (
            relationFields.value.length > 0 &&
            !relationFields.value.some(field => field.field === optParentField.value)
        ) {
            optParentField.value = relationFields.value[0].field;
        }

        const { sort, limit, page, fields } = useLayoutQuery();
        const {items, loading, error, totalPages, itemCount, totalCount, getItems, getTotalCount, getItemCount} =
            useItems(collection, {
                sort,
                limit,
                page,
                fields,
                filter,
                search,
            });
        watch(fields, () => getItems());

        function getLinkForItem(item: Record<string, any>) {
            if (!primaryKeyField.value) return;

            return `/content/${props.collection}/${item[primaryKeyField.value.field]}`;
        }

        function onItemClick({ item, event }: { item: Item; event: PointerEvent }) {
            if (props.readonly === true || !primaryKeyField.value) return;

            const primaryKey = item[primaryKeyField.value.field];

            if (props.selectMode || selection.value?.length > 0) {
                if (selection.value?.includes(primaryKey) === false) {
                    selection.value = selection.value.concat(primaryKey);
                } else {
                    selection.value = selection.value.filter((item) => item !== primaryKey);
                }
            } else {
                const route = `/content/${unref(collection)}/${primaryKey}`;

                if (event.ctrlKey || event.metaKey) window.open(router.resolve(route).href, '_blank');
                else router.push(route);
            }
        }
        return {
            onItemClick,
            name,
            relationFields,
            parentField,
            optParentField,
            optTitle,
            collection,

            selection,

            items,
            loading,
            error,
            totalPages,
            itemCount,
            totalCount,
            getItems,
            getTotalCount,
            getItemCount,
            getLinkForItem
        };
    },
});
