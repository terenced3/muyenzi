<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({
  title: 'Muyenzi – Modern Visitor Management',
  meta: [{ name: 'description', content: 'Replace paper logbooks with a professional digital visitor management system.' }],
})

const features = [
  { icon: 'i-lucide-qr-code', title: 'QR Code Check-In', desc: "Visitors receive a unique QR code with their invitation. One scan at the kiosk and they're checked in." },
  { icon: 'i-lucide-shield', title: 'Access Codes', desc: 'Every visit gets a random 6-character access code as backup. Simple to type, impossible to guess.' },
  { icon: 'i-lucide-building-2', title: 'Multi-Site Support', desc: 'Manage all your premises from one dashboard. Head office, warehouse, factory — all in one place.' },
  { icon: 'i-lucide-users', title: 'Role-Based Access', desc: 'Admins, site managers, receptionists, and hosts each see exactly what they need.' },
  { icon: 'i-lucide-bar-chart-3', title: 'Real-Time Analytics', desc: 'Visitor trends, peak hours, site reports, and live occupancy at a glance.' },
  { icon: 'i-lucide-bell', title: 'Instant Notifications', desc: 'Hosts are notified the moment their guest arrives, so no one is left waiting in reception.' },
]

const steps = [
  { step: '01', title: 'Create an invitation', desc: 'Pre-register your visitor with their details, visit date, and host.' },
  { step: '02', title: 'Visitor receives their pass', desc: 'They get a QR code and access code by email before they arrive.' },
  { step: '03', title: 'Frictionless arrival', desc: 'Visitor scans their QR or enters their code at the kiosk. Done in seconds.' },
  { step: '04', title: 'Host is notified instantly', desc: 'The host gets an immediate notification so they can greet their guest.' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="bg-gradient-to-b from-slate-50 to-white pt-20 pb-24 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5 text-sm text-slate-600 mb-8">
          <span class="h-2 w-2 rounded-full bg-emerald-500" />
          Modern visitor management
        </div>
        <h1 class="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
          Professional visitor<br>
          <span class="text-slate-400">management, simplified</span>
        </h1>
        <p class="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Replace paper logbooks and manual check-in processes with Muyenzi — a modern SaaS platform
          for managing visitors across all your premises.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton size="xl" to="/signup">
            Start free trial
            <UIcon name="i-lucide-arrow-right" class="ml-2 h-4 w-4" />
          </UButton>
          <UButton size="xl" variant="outline" to="/contact">Book a demo</UButton>
        </div>
        <p class="text-sm text-slate-400 mt-4">No credit card required · Free for up to 50 visits/month</p>
      </div>
    </section>

    <!-- Dashboard preview -->
    <section class="py-16 px-6 bg-white">
      <div class="max-w-5xl mx-auto">
        <div class="rounded-2xl border bg-slate-50 p-1 shadow-xl">
          <div class="rounded-xl bg-slate-900 h-8 flex items-center gap-2 px-4">
            <div class="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div class="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div class="h-2.5 w-2.5 rounded-full bg-green-400" />
            <div class="flex-1 mx-4 h-5 rounded-md bg-slate-700 max-w-xs" />
          </div>
          <div class="bg-white rounded-b-xl p-6 min-h-64 grid grid-cols-4 gap-4">
            <div class="col-span-1 bg-slate-50 rounded-xl p-4 space-y-3">
              <div
                v-for="item in ['Overview', 'Sites', 'Visitors', 'Invitations', 'Analytics']"
                :key="item"
                :class="['h-8 rounded-lg flex items-center px-3 text-xs font-medium', item === 'Overview' ? 'bg-slate-200 text-slate-900' : 'text-slate-500']"
              >
                {{ item }}
              </div>
            </div>
            <div class="col-span-3 space-y-4">
              <div class="grid grid-cols-4 gap-3">
                <div v-for="(label, i) in ['Visitors Today', 'Inside Now', 'Upcoming', 'This Week']" :key="label" class="bg-slate-50 rounded-xl p-3">
                  <p class="text-xs text-slate-500">{{ label }}</p>
                  <p class="text-2xl font-bold text-slate-900">{{ [24, 3, 8, 142][i] }}</p>
                </div>
              </div>
              <div class="bg-slate-50 rounded-xl p-4 h-24 flex items-center justify-center">
                <div class="flex items-end gap-1">
                  <div
                    v-for="(h, i) in [30, 55, 45, 70, 60, 80, 65, 90, 75, 85, 60, 70]"
                    :key="i"
                    class="w-4 bg-slate-800 rounded-sm"
                    :style="{ height: `${h * 0.6}px` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-24 px-6 bg-slate-50">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-slate-900 mb-4">Everything you need to manage visitors</h2>
          <p class="text-lg text-slate-500 max-w-xl mx-auto">Built for modern workplaces that care about security, efficiency, and first impressions.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="f in features" :key="f.title" class="bg-white rounded-2xl p-6 border hover:shadow-md transition-shadow">
            <div class="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <UIcon :name="f.icon" class="h-5 w-5 text-slate-700" />
            </div>
            <h3 class="font-semibold text-slate-900 mb-2">{{ f.title }}</h3>
            <p class="text-sm text-slate-500">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-24 px-6 bg-white">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-slate-900 mb-4">How it works</h2>
          <p class="text-lg text-slate-500">From invitation to check-in in four simple steps.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="s in steps" :key="s.step" class="flex gap-5">
            <div class="text-3xl font-bold text-slate-200 shrink-0 w-10">{{ s.step }}</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">{{ s.title }}</h3>
              <p class="text-sm text-slate-500">{{ s.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24 px-6 bg-slate-900">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-white mb-4">Ready to modernise your reception?</h2>
        <p class="text-slate-400 mb-8 text-lg">Join companies already using Muyenzi to manage thousands of visitors.</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton size="xl" color="white" to="/signup">Start free trial</UButton>
          <UButton size="xl" variant="outline" class="border-slate-600 text-white hover:bg-slate-800" to="/contact">Talk to sales</UButton>
        </div>
      </div>
    </section>
  </div>
</template>
