<template>
	<div ref="layoutElement" class="layout-hierarchy">

		<v-list class="draggable-list">
			<v-hierarchy-item
				:items="itemsRenders"
				@update:items="updateItems"
				@delete="$emit('delete', $event)"
				:optTitle="optTitle"
				:optParentField="optParentField"
				:collection="collection"
				:parent="null"
				:edit="onItemClick"
				:selectMode="selectMode"
				:selection="selection"
				children
			/>
		</v-list>
	</div>
</template>

<script lang="ts" setup>
import type {Item} from '@directus/types';
import {computed} from "vue";
import VHierarchyItem from "./components/layouts/v-hierarchy-item.vue";
import {useBuildForest} from "./composables/use.forest.tree";
import {useApi} from "@directus/extensions-sdk";

const props = defineProps<{
	collection: string;
	name: string;
	items: Item[];
	optParentField: string,
	optTitle: string,
	getLinkForItem: (item: Record<string, any>) => string | undefined;
	onItemClick: (item: Record<string, any>) => string | undefined;

	selection: (number | string)[];
	selectMode: boolean;

	parentField: any;
	relationFields: any;
	getItems: any;
	getTotalCount: any;
	getItemCount: any;
	layoutProps: any;
	filter: any;
	filterSystem: any;
	showSelect: any;
	resetPreset: any;
	clearFilters: any;
}>();

const itemsRenders = computed({
	get: () => useBuildForest(props.items, props.optParentField),
	set: (value) => {
		console.log(value)
	}
});

const api = useApi()
const updateItems = async (vl) => {
	const {parent, items}  = vl;
	for (let vlItem of items) {
		const item = props.items.find((item) => item.id === vlItem.id);
		item.sort = vlItem.sort;
		item[props.optParentField] = parent

		api.patch(`/items/${props.collection}/${item.id}`, {
			sort: item.sort,
			[props.optParentField]: item.parent
		}).then(res => res)
	}
}


</script>

<style scoped>
.layout-hierarchy {
	padding: var(--content-padding);
	padding-top: 0;
}

.layout-hierarchy .v-forrest-item {
	margin-bottom: 8px;
}

.layout-hierarchy :deep(.root-drag-container) {
	padding: 8px 0;
	overflow: hidden;
}

.layout-hierarchy :deep(.drag-container) {
	margin-top: 8px;
	margin-left: 20px;
}

.draggable-list :deep(.sortable-ghost) {
	.v-list-item {
		--v-list-item-background-color: var(--theme--primary-background);
		--v-list-item-border-color: var(--theme--primary);
		--v-list-item-background-color-hover: var(--theme--primary-background);
		--v-list-item-border-color-hover: var(--theme--primary);

		> * {
			opacity: 0;
		}
	}
}

</style>
