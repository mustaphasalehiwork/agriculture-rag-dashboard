module.exports = {
  apps: [{
    name: 'agriculture-rag-dashboard',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
      NEXT_PUBLIC_SUPABASE_URL: 'https://usdczcysugyjfywdrqrw.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGN6Y3lzdWd5amZ5d2RycXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDk1MjAsImV4cCI6MjA3NjYyNTUyMH0.0myp3XDlPVqFd2U32PBFN0rsiJ5RVVy6JgPYAmqJYGs',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGN6Y3lzdWd5amZ5d2RycXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA0OTUyMCwiZXhwIjoyMDc2NjI1NTIwfQ.ZxThZrJ4vwmMJHLKzsRi-tyrIM6806T-9Kok_-qYlD0',
      JWT_SECRET: '78981ee1ef0f0f653bf2c617f38fa74ff8f773e9260249839a570f8d2e39300f7e6a7fb7f4ac683b5b42e1b3f1f4d668c14df48cdf5ee6fdba18882bb8091861',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'admin',
      SESSION_SECRET: '9a5df49991116d7f9687e7f4de89d91ba3e1043829e2d35d9b0d0371b77055bb'
    }
  }]
};