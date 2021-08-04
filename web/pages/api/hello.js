// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const { OAuth2Client } = require('google-auth-library')

let keys = {
  web: {
    client_id:
      '147618948536-2repapelooer1bbblta94dh516e8jkav.apps.googleusercontent.com',
    project_id: 'exalted-splicer-226818',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_secret: 'k-RiKK7_HX41ow9WtNphvjG6',
    redirect_uris: [
      //'https://google-sheets.sambarrowclough.repl.co/callback',
      'http://localhost:3000/api/callback'
    ],
    javascript_origins: [
      //'https://google-sheets.sambarrowclough.repl.co',
      'http://localhost:3000'
    ]
  }
}

export const oAuth2Client = new OAuth2Client(
  keys.web.client_id,
  keys.web.client_secret,
  keys.web.redirect_uris[0]
)

export default async function hello(req, res) {
  let url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/spreadsheets'
  })
  console.log(url)
  res.status(200).json({ url })
}
