import { GoogleSpreadsheet } from 'google-spreadsheet'
let url = require('url')
import { oAuth2Client } from './hello'
import { supabase } from '../../lib/supabase'

export default async function callback(req, res) {
  try {
    let { code, state } = req.query
    console.log(`Code is ${code}`)
    console.log(`State is ${state}`)

    let r = await oAuth2Client.getToken(code)

    const { data, error } = await supabase
      .from('googleAuth')
      .insert([{ state, tokens: r.tokens }])

    if (error) {
      throw new Error(error)
    }

    // const { data: usersData, error: usersError } = await supabase
    //   .from('users')
    //   .insert([{ state, tokens: r.tokens }])
    //   .eq(id, userId)

    // if (usersError) {
    //   throw new Error(usersError)
    // }

    //console.log(oAuth2Client)
    return res.status(200).json({
      name: 'Authentication successful! Please return to the console.'
    })
    // Now that we have the code, use that to acquire tokens.
  } catch (e) {
    console.error(e)
    res.status(500).json({ name: e.message })
  }
}
