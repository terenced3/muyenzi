<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Pricing – Muyenzi' })
</script>

<template>
  <div class="py-24 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h1>
      <p class="text-lg text-slate-500 mb-12">Start free, scale as you grow.</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UCard v-for="plan in [
          { name: 'Free', price: '$0', desc: 'Up to 50 visits/month', features: ['1 site', '2 team members', 'QR & access codes', 'Basic analytics'] },
          { name: 'Pro', price: '$29', desc: 'Per month, billed monthly', features: ['Unlimited sites', 'Unlimited team members', 'Advanced analytics', 'CSV & PDF export', 'Email support'] },
          { name: 'Enterprise', price: 'Custom', desc: 'For large organisations', features: ['Everything in Pro', 'SSO / SAML', 'SLA guarantee', 'Dedicated onboarding'] },
        ]" :key="plan.name" :ui="{ divide: '' }">
          <div class="space-y-4">
            <div>
              <h3 class="font-bold text-slate-900 text-lg">{{ plan.name }}</h3>
              <p class="text-3xl font-bold text-slate-900 mt-1">{{ plan.price }}<span v-if="plan.price !== 'Custom'" class="text-sm font-normal text-slate-500">/mo</span></p>
              <p class="text-sm text-slate-500 mt-1">{{ plan.desc }}</p>
            </div>
            <ul class="space-y-2">
              <li v-for="f in plan.features" :key="f" class="flex items-center gap-2 text-sm text-slate-600">
                <UIcon name="i-lucide-check" class="h-4 w-4 text-emerald-500 shrink-0" />
                {{ f }}
              </li>
            </ul>
            <UButton block variant="outline" to="/signup">Get started</UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
