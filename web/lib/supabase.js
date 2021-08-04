import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sncjxquqyxhfzyafxhes.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMTUyNjkxMiwiZXhwIjoxOTI3MTAyOTEyfQ.rV5CqAiEe3Iihp90geJgyvEmy0pW8ZRmlETuQ36G4KU'
export const supabase = createClient(supabaseUrl, supabaseKey)
