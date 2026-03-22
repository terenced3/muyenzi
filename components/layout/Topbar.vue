<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()

const { notifications, unreadCount, markAllRead } = useNotifications()
</script>

<template>
  <header class="flex h-16 items-center justify-between px-6 bg-white shrink-0 border-b border-gray-100">
    <div>
      <h1 v-if="title" class="font-bold text-gray-900 text-lg leading-tight">{{ title }}</h1>
      <p v-if="description" class="text-xs text-gray-400 mt-0.5">{{ description }}</p>
    </div>

    <div class="flex items-center gap-2">
      <UPopover>
        <UButton variant="ghost" color="gray" icon="i-lucide-bell" size="sm" :ui="{ rounded: 'rounded-full' }">
          <template v-if="unreadCount > 0" #trailing>
            <UBadge
              :label="unreadCount > 9 ? '9+' : String(unreadCount)"
              color="red"
              size="xs"
              class="-top-1 -right-1 absolute"
            />
          </template>
        </UButton>

        <template #panel>
          <div class="w-80">
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span class="font-bold text-gray-900 text-sm">Notifications</span>
              <div v-if="unreadCount > 0" class="flex items-center gap-2">
                <UBadge :label="`${unreadCount} new`" color="primary" variant="soft" size="xs" />
                <button class="text-xs text-gray-400 hover:text-primary-500 transition-colors" @click="markAllRead">
                  Mark all read
                </button>
              </div>
            </div>

            <!-- Empty -->
            <div v-if="notifications.length === 0" class="py-8 text-center">
              <UIcon name="i-lucide-bell" class="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p class="text-sm text-gray-400">No notifications yet</p>
            </div>

            <!-- List -->
            <div v-else class="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              <div
                v-for="n in notifications.slice(0, 8)"
                :key="n.id"
                class="px-4 py-3"
                :class="{ 'bg-primary-50/40': !n.read }"
              >
                <div class="flex items-start gap-2">
                  <span v-if="!n.read" class="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                  <div :class="!n.read ? '' : 'pl-3.5'">
                    <p class="text-sm" :class="!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'">
                      {{ n.message }}
                    </p>
                    <p class="text-xs text-gray-300 mt-0.5">{{ formatRelative(n.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </header>
</template>
