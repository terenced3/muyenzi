<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Features – Muyenzi' })

const coreFeatures = [
  {
    icon: 'i-lucide-qr-code',
    title: 'QR Code Check-In',
    desc: 'Visitors scan their unique QR code at the kiosk. Instant check-in with zero friction.',
    details: ['Unique per visit', 'Works offline', 'Mobile & tablet-friendly'],
  },
  {
    icon: 'i-lucide-shield',
    title: 'Access Codes',
    desc: 'Every visit gets a random 6-character backup code. No email needed, just type it in.',
    details: ['Simple 6-character format', 'Impossible to guess', 'Works with any input method'],
  },
  {
    icon: 'i-lucide-building-2',
    title: 'Multi-Site Support',
    desc: 'Manage unlimited premises from one dashboard. All your locations, one system.',
    details: ['Unlimited sites', 'Kanban kiosks per site', 'Centralized reporting'],
  },
  {
    icon: 'i-lucide-users',
    title: 'Role-Based Access Control',
    desc: 'Secure permissions system. Admins, site managers, receptionists, and hosts each see what they need.',
    details: ['4 role levels', 'Fine-grained permissions', 'Team management'],
  },
]

const analyticsFeatures = [
  {
    icon: 'i-lucide-bar-chart-3',
    title: 'Real-Time Analytics',
    desc: 'Live visitor trends, peak hours, site breakdown, and occupancy at a glance.',
    details: ['30-day trends', 'Hourly distribution', 'Like-for-like reports'],
  },
  {
    icon: 'i-lucide-bell',
    title: 'Instant Notifications',
    desc: 'Hosts get notified the second their guest arrives. No more waiting in reception.',
    details: ['Real-time alerts', 'In-app notifications', 'Visitor name included'],
  },
  {
    icon: 'i-lucide-file-text',
    title: 'Export & Reporting',
    desc: 'Download visitor logs as CSV or PDF. Perfect for compliance and audits.',
    details: ['CSV & PDF formats', 'Date range filtering', 'Bulk exports'],
  },
  {
    icon: 'i-lucide-inbox',
    title: 'Pre-Registration',
    desc: 'Invite visitors ahead of time. They receive their code by email or SMS.',
    details: ['Email delivery', 'Bulk invites', 'Custom fields support'],
  },
]

const advancedFeatures = [
  {
    icon: 'i-lucide-forms',
    title: 'Custom Fields',
    desc: 'Collect additional information: vehicle registration, allergies, company name, etc.',
    details: ['Text, number, dropdown', 'Conditional display', 'Required/optional fields'],
  },
  {
    icon: 'i-lucide-clock',
    title: 'Visit Tracking',
    desc: 'Timeline of every visitor. Check-in time, duration, who they visited, their purpose.',
    details: ['Full audit trail', 'Duration calculation', 'Status tracking'],
  },
  {
    icon: 'i-lucide-lock',
    title: 'Security & Compliance',
    desc: 'Enterprise-grade security. Role-based access, encryption, and audit logs.',
    details: ['RLS policies', 'Data encryption', 'Access logs'],
  },
  {
    icon: 'i-lucide-globe',
    title: 'Multi-Tenant',
    desc: 'One platform for teams. Each company is completely isolated and secure.',
    details: ['Company isolation', 'Shared users', 'Scalable infrastructure'],
  },
]
</script>

<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-20 px-6 bg-slate-50">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-5xl font-bold text-slate-900 mb-6">
          Built for modern<br>
          <span class="text-slate-400">visitor management</span>
        </h1>
        <p class="text-xl text-slate-500 max-w-2xl mx-auto">
          We've packed everything you need to run a professional visitor management operation. No compromises.
        </p>
      </div>
    </section>

    <!-- Core Features -->
    <section class="py-24 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-slate-900 mb-2">Check-In & Reception</h2>
          <p class="text-lg text-slate-500">Fast, frictionless visitor arrivals.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="feature in coreFeatures" :key="feature.title" class="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-slate-200 transition-colors">
            <div class="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
              <UIcon :name="feature.icon" class="h-6 w-6 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ feature.title }}</h3>
            <p class="text-slate-500 mb-6">{{ feature.desc }}</p>
            <ul class="space-y-2">
              <li v-for="detail in feature.details" :key="detail" class="flex items-center gap-2 text-sm text-slate-600">
                <UIcon name="i-lucide-check" class="h-4 w-4 text-emerald-500" />
                {{ detail }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Analytics & Notifications -->
    <section class="py-24 px-6 bg-slate-50">
      <div class="max-w-5xl mx-auto">
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-slate-900 mb-2">Overview & Insights</h2>
          <p class="text-lg text-slate-500">Real-time data to make better decisions.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="feature in analyticsFeatures" :key="feature.title" class="bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 transition-colors">
            <div class="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
              <UIcon :name="feature.icon" class="h-6 w-6 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ feature.title }}</h3>
            <p class="text-slate-500 mb-6">{{ feature.desc }}</p>
            <ul class="space-y-2">
              <li v-for="detail in feature.details" :key="detail" class="flex items-center gap-2 text-sm text-slate-600">
                <UIcon name="i-lucide-check" class="h-4 w-4 text-emerald-500" />
                {{ detail }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Advanced Features -->
    <section class="py-24 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-slate-900 mb-2">Advanced Capabilities</h2>
          <p class="text-lg text-slate-500">Designed for scale and compliance.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="feature in advancedFeatures" :key="feature.title" class="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-slate-200 transition-colors">
            <div class="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
              <UIcon :name="feature.icon" class="h-6 w-6 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ feature.title }}</h3>
            <p class="text-slate-500 mb-6">{{ feature.desc }}</p>
            <ul class="space-y-2">
              <li v-for="detail in feature.details" :key="detail" class="flex items-center gap-2 text-sm text-slate-600">
                <UIcon name="i-lucide-check" class="h-4 w-4 text-emerald-500" />
                {{ detail }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24 px-6 bg-slate-900">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-white mb-4">See it in action</h2>
        <p class="text-slate-400 mb-8 text-lg">Ready to replace your paper logbook?</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton size="xl" color="white" to="/signup">Start free trial</UButton>
          <UButton size="xl" variant="outline" class="border-slate-600 text-white hover:bg-slate-800" to="/contact">Schedule a demo</UButton>
        </div>
      </div>
    </section>
  </div>
</template>
