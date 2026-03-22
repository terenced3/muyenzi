<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const { user, can } = useUser()

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'i-lucide-layout-dashboard', exact: true },
  { href: '/dashboard/sites', label: 'Sites', icon: 'i-lucide-building-2' },
  { href: '/dashboard/visitors', label: 'Visitors', icon: 'i-lucide-users' },
  { href: '/dashboard/invitations', label: 'Invitations', icon: 'i-lucide-calendar-check' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'i-lucide-bar-chart-3', permission: 'view_analytics' },
  { href: '/dashboard/users', label: 'Team', icon: 'i-lucide-user-cog', permission: 'manage_users' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'i-lucide-settings' },
]

function isActive(item: { href: string; exact?: boolean }) {
  return item.exact ? route.path === item.href : route.path.startsWith(item.href)
}

const initials = computed(() => {
  return user.value?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'
})

async function handleSignOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <aside
    class="flex h-full w-64 flex-col shrink-0"
    style="background: linear-gradient(180deg, #13131f 0%, #0f0f1c 100%); border-right: 1px solid rgba(255,255,255,0.06)"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 px-5" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
      <div
        class="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
        style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); box-shadow: 0 0 20px rgba(99,102,241,0.4)"
      >
        <span class="text-white font-bold text-sm">M</span>
      </div>
      <div class="min-w-0">
        <p class="font-bold text-white text-sm tracking-tight">muyenzi</p>
        <p class="text-xs truncate max-w-[140px]" style="color: rgba(232,234,255,0.45)">
          {{ user?.company?.name }}
        </p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
      <p class="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest" style="color: rgba(232,234,255,0.3)">
        Main Menu
      </p>

      <template v-for="item in navItems" :key="item.href">
        <NuxtLink
          v-if="!item.permission || can(item.permission)"
          :to="item.href"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
          :style="isActive(item)
            ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(129,140,248,0.15) 100%)', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.3)', color: '#c7d2fe' }
            : { color: 'rgba(232,234,255,0.5)' }"
        >
          <UIcon
            :name="item.icon"
            class="h-4 w-4 shrink-0"
            :style="{ color: isActive(item) ? '#818cf8' : 'rgba(232,234,255,0.4)' }"
          />
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="isActive(item)" class="h-1.5 w-1.5 rounded-full" style="background: #818cf8" />
        </NuxtLink>
      </template>

      <div class="pt-4 mt-4" style="border-top: 1px solid rgba(255,255,255,0.06)">
        <p class="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest" style="color: rgba(232,234,255,0.3)">
          Kiosk
        </p>
        <a
          href="/kiosk"
          target="_blank"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
          style="color: rgba(232,234,255,0.5)"
        >
          <UIcon name="i-lucide-qr-code" class="h-4 w-4 shrink-0" style="color: rgba(232,234,255,0.4)" />
          Kiosk Mode
        </a>
      </div>
    </nav>

    <!-- User footer -->
    <div style="border-top: 1px solid rgba(255,255,255,0.06); padding: 12px">
      <div
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-default"
        style="background: rgba(255,255,255,0.04)"
      >
        <UAvatar
          :alt="initials"
          size="sm"
          class="shrink-0 bg-primary-900/30 text-primary-400 ring-1 ring-primary-500/30"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-white truncate">{{ user?.full_name }}</p>
          <p class="text-xs capitalize" style="color: rgba(232,234,255,0.4)">
            {{ user?.role?.replace('_', ' ') }}
          </p>
        </div>
        <button
          class="p-1.5 rounded-lg transition-colors"
          style="color: rgba(232,234,255,0.3)"
          title="Sign out"
          @click="handleSignOut"
          @mouseenter="($event.target as HTMLElement).style.color = 'rgba(232,234,255,0.8)'"
          @mouseleave="($event.target as HTMLElement).style.color = 'rgba(232,234,255,0.3)'"
        >
          <UIcon name="i-lucide-log-out" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </aside>
</template>
