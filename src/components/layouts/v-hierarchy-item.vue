<template>
	<draggable
		v-model="itemsRender"
		group="hierarchy"
		:class="children ? 'drag-container': 'root-drag-container'"
		class="v-forrest-item"
		item-key="id"
		handle=".drag-handle"
		:swap-threshold="0.3"
		v-bind="{ 'force-fallback': true }"
	>
		<template #item="{ element, index }">
			<v-hierarchy-wrap
				:item="element" :opt-title="optTitle"
				:collection="collection"
				:has-children="element.sub_items.length  > 0"
				:edit="edit"
				:selectMode="selectMode"
				:selection="selection"
				:optTitle="optTitle"
				:optParentField="optParentField"
			>
				<v-hierarchy-item
					:items="element.sub_items"
					children
					@delete="$emit('delete', $event)"
					:collection="collection"
					@update:items="updateItems"
					:parent="element.id"
					@edit="$emit('edit', $event)"
					:selectMode="selectMode"
					:selection="selection"

					:optTitle="optTitle"
					:optParentField="optParentField"
					:edit="edit"
				/>
			</v-hierarchy-wrap>
		</template>
	</draggable>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import {computed, ref} from "vue";
import VHierarchyWrap from "./v-hierarchy-wrap.vue";

const props = defineProps<{
	items: MenuItem[];
	children: boolean;
	parent: number | undefined;
	optTitle: string;
	optParentField: string;
	collection: string;
	selectMode: boolean;
	selection: Array<number | string>;
	edit: (item) => void;
}>();

const emit = defineEmits(['edit', 'delete', 'update:items'])

const updateItems = (value) => {
	emit('update:items', {
		...value
	});
}

const itemsRender = computed({
	set: (value) => {
		value.forEach((item, index) => {
			item.sort = index;
		})
		emit('update:items', {
			parent: props.parent,
			items: value
		});

	},

	get: () => {
		return props.items.sort((a, b) => a.sort - b.sort);
	}
})
</script>
