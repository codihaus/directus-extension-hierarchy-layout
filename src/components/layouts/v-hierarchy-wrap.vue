<template>
	<div class="forest-view-wrap">
		<v-list-item
			block
			dense
			clickable
			class="group"
			:class="selectedClass"
			@click="edit({item, event: $event})"
		>
			<v-list-item-icon>
				<v-icon v-if="selectMode" :name="checkedIcon"></v-icon>
				<v-icon v-else class="drag-handle" name="drag_handle"/>
			</v-list-item-icon>

			<div class="" style="flex-grow: 1">
				<render-template
					:collection="collection"
					:item="item"
					:template="optTitle"/>
			</div>

			<div>
				<v-icon
					v-if="hasChildren"
					v-tooltip="expand ? t('collapse') : t('expand')"
					:name="expand ? 'unfold_less' : 'unfold_more'"
					:class="expand ? 'unfold_less' : 'unfold_more'"
					clickable
					class="collapse-toggle"
					@click.stop.prevent="expand= !expand"
				/>
			</div>
		</v-list-item>

		<template v-if="expand">
			<slot></slot>
		</template>

	</div>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from 'vue-i18n';

const {t} = useI18n();
const expand = ref(true);

const props = defineProps<{
	item: any;
	optTitle: string;
	collection: string;
	hasChildren: boolean;
	selectMode: boolean;
	selection: Array<number | string>;
	edit: (item) => void;
}>();

const checkedIcon = computed(() => {
	return props.selection?.indexOf(props.item.id) >= 0 ? 'check_circle' : 'radio_button_unchecked';
});

const selectedClass = computed(() => {
	return props.selection?.indexOf(props.item.id) >= 0 ? 'selected' : '';
});

</script>

<style scoped>
.collection-item {
	margin-top: 8px;
}

.unfold_less {
	opacity: 0.4;
}

.forest-view-wrap .group.selected {
	background-color: var(--theme--background-normal) !important;
	border-color: var(--theme--primary-subdued) !important;
}
</style>
