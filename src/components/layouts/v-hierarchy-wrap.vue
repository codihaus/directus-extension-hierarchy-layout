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

			<div class="title" style="flex-grow: 1">
				<render-template
					v-if="ownTitle"
					:collection="collection"
					:item="item"
					:template="ownTitle"/>
				<render-template
					v-if="parentTitle"
					class="parent"
					:collection="collection"
					:item="item"
					:template="parentTitle"/>
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
	optParentField: string;
	collection: string;
	hasChildren: boolean;
	selectMode: boolean;
	selection: Array<number | string>;
	edit: (item) => void;
}>();

/**
 * The title is rendered in two halves: the row's own, and the part that reads
 * the parent relation — `{{name}}` and `({{parent.name}})` — so the second can
 * be subdued, and so a row at the top level can leave it out altogether,
 * brackets and all. `{{name}} ({{parent.name}})` reads "Home (--)" otherwise,
 * because `render-template` prints a null value as `--` and a Directus template
 * has no conditionals.
 *
 * Neither half is reachable through a display option: the field store resolves
 * `parent.name` to the very same field as `name`, so a colour or a prefix set
 * there would apply to the row's own name just as much.
 */
const titleParts = computed(() => {
	const placeholder = `{{\\s*${props.optParentField}(\\.[^}]*)?\\s*}}`;
	const pattern = new RegExp(`\\s*[([{]?\\s*${placeholder}\\s*[)\\]}]?`, 'g');

	return {
		own: props.optTitle.replace(pattern, '').trim(),
		parent: (props.optTitle.match(pattern) ?? []).join(' ').trim(),
	};
});

const ownTitle = computed(() => titleParts.value.own);

/**
 * A drop writes the new parent's bare key into the row (`updateItems`), so a
 * part that reads *through* the relation has nothing to resolve until the list
 * has been read back, and `render-template` would print `--`. Treat that as
 * unknown and leave the part out; a part that prints the key itself is
 * unaffected.
 */
const parentResolved = computed(() => {
	const parent = props.item[props.optParentField];

	if (!parent) return false;

	const readsRelation = new RegExp(`{{\\s*${props.optParentField}\\.`).test(titleParts.value.parent);

	return !readsRelation || typeof parent === 'object';
});

const parentTitle = computed(() => (parentResolved.value ? titleParts.value.parent : ''));

const checkedIcon = computed(() => {
	return props.selection?.indexOf(props.item.id) >= 0 ? 'check_circle' : 'radio_button_unchecked';
});

const selectedClass = computed(() => {
	return props.selection?.indexOf(props.item.id) >= 0 ? 'selected' : '';
});

</script>

<style scoped>
.title {
	display: flex;
	align-items: center;
	gap: 4px;
	min-width: 0;
}

.title .parent {
	color: var(--theme--foreground-subdued);
}

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
