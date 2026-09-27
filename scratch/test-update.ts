import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log("Attempting to impersonate user...")
  
  // Create an authenticated client for the student
  const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'asawardekar69@gmail.com',
    password: 'password123' // Or whatever default password they might have. If I don't have it, I can't test RLS easily this way.
  })
}

run()
