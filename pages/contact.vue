<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Contact – Muyenzi' })
</script>

<template>
  <div class="py-24 px-6">
    <div class="max-w-lg mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-slate-900 mb-4">Get in touch</h1>
        <p class="text-lg text-slate-500">We'd love to hear from you. Book a demo or ask us anything.</p>
      </div>
      <UCard>
        <div class="space-y-4">
          <UFormGroup label="Name">
            <UInput placeholder="Jane Smith" />
          </UFormGroup>
          <UFormGroup label="Work email">
            <UInput type="email" placeholder="jane@acme.com" />
          </UFormGroup>
          <UFormGroup label="Company">
            <UInput placeholder="Acme Corp" />
          </UFormGroup>
          <UFormGroup label="Message">
            <UTextarea placeholder="Tell us about your use case…" :rows="4" />
          </UFormGroup>
          <UButton block>Send message</UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
