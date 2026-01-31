const fs = require('fs');

// Create proper .env.local content with line breaks
const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://yceoyanyyvbpbqvbwjok.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZW95YW55eXZicGJxdmJ3am9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjIyODQsImV4cCI6MjA4NDMzODI4NH0.XuHmHBeSOa2_SZ-p1OCImY_vBURrgm2U2GEHXZ6bnL4`;

// Write to .env.local with proper line breaks
fs.writeFileSync('.env.local', envContent);
console.log('Created .env.local file with proper formatting');
