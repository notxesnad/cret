import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Session?', !!session)
  
  // Actually I don't have a user session for the script. 
  // Let me just look at the schema via an HTTP request or something?
}
run()
