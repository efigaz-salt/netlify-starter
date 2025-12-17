<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-8">
            <!-- Logo -->
            <div class="flex-shrink-0">
              <NuxtLink to="/" class="text-xl font-bold text-gray-900">
                Netlify Site Simulation
              </NuxtLink>
            </div>
            
            <!-- Main Navigation -->
            <div class="hidden md:flex space-x-1">
              <NuxtLink to="/" class="nav-link" active-class="active">Dashboard</NuxtLink>
              <NuxtLink to="/analytics" class="nav-link" active-class="active">Analytics</NuxtLink>
              <NuxtLink to="/features" class="nav-link" active-class="active">Feature Flags</NuxtLink>
              <NuxtLink to="/test" class="nav-link" active-class="active">API Test</NuxtLink>
              <NuxtLink to="/akamai-test" class="nav-link" active-class="active">Akamai Test</NuxtLink>
              <NuxtLink to="/sse" class="nav-link" active-class="active">SSE Stream</NuxtLink>
              <NuxtLink to="/settings" class="nav-link" active-class="active">Settings</NuxtLink>
            </div>
          </div>
          
          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">{{ environment }}</span>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">U</span>
              </div>
              <span class="text-sm font-medium text-gray-900">Demo User</span>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <slot />
    </main>
    
    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-12">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-gray-500">
          Netlify Client Environment Simulation
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const environment = computed(() => config.public.environment?.toUpperCase() || 'DEV')
</script>