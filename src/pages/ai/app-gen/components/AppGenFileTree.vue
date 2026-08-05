<script setup lang="ts">
/**
 * 应用生成工程的递归文件树：目录可折叠，点击文件向父组件抛出 path。
 * 树数据由 buildFileTree(files) 生成；展开状态在 tree 变化时重置为默认展开关键目录。
 */
import { ref, watch } from 'vue'
import { defaultExpandedDirs } from '@/modules/app-gen/fileTree'
import type { FileTreeNode } from '@/modules/app-gen/types'

const props = defineProps<{
  tree: FileTreeNode[]
  selectedPath: string
}>()

const emit = defineEmits<{
  select: [path: string]
}>()

/** 当前展开的目录 path 集合（仅 type=dir 的节点） */
const expanded = ref<Set<string>>(new Set())

/** 工程文件变化时（如新生成一批文件）按约定默认展开 src 等目录 */
watch(
  () => props.tree,
  (tree) => {
    expanded.value = defaultExpandedDirs(tree)
  },
  { immediate: true },
)

function toggle(path: string) {
  const next = new Set(expanded.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expanded.value = next
}

function isOpen(path: string) {
  return expanded.value.has(path)
}
</script>

<template>
  <ul class="ftree">
    <li v-for="node in tree" :key="node.path" class="ftree__item">
      <template v-if="node.type === 'dir'">
        <button type="button" class="ftree__row ftree__row--dir" @click="toggle(node.path)">
          <span class="ftree__caret" :class="{ 'ftree__caret--open': isOpen(node.path) }">▸</span>
          <span class="ftree__icon">📁</span>
          <span class="ftree__name">{{ node.name }}</span>
        </button>
        <div v-if="isOpen(node.path) && node.children?.length" class="ftree__children">
          <AppGenFileTree
            :tree="node.children"
            :selected-path="selectedPath"
            @select="emit('select', $event)"
          />
        </div>
      </template>
      <button
        v-else
        type="button"
        class="ftree__row ftree__row--file"
        :class="{ 'ftree__row--active': node.path === selectedPath }"
        @click="emit('select', node.path)"
      >
        <span class="ftree__caret ftree__caret--spacer" />
        <span class="ftree__icon">📄</span>
        <span class="ftree__name">{{ node.name }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.ftree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ftree__children {
  padding-left: 12px;
}

.ftree__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 8px;
  text-align: left;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.ftree__row:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-primary);
}

.ftree__row--active {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-weight: 600;
}

.ftree__caret {
  width: 12px;
  display: inline-flex;
  justify-content: center;
  font-size: 10px;
  transition: transform 0.15s ease;
  color: var(--color-text-muted);
}

.ftree__caret--open {
  transform: rotate(90deg);
}

.ftree__caret--spacer {
  visibility: hidden;
}

.ftree__icon {
  font-size: 12px;
  line-height: 1;
}

.ftree__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
