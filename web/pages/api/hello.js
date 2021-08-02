// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { OAuth2Client } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'
const open = require('open')
const url = require('url')

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
      'http://localhost:3000/api/hello'
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

export default async function helloAPI(req, res) {
  const oAuth2Client = await getAuthenticatedClient()
  const doc = new GoogleSpreadsheet(
    '1K48zEbYbgA8s1srNVLw46NXquN5sfhfUamHIUrPmPKk'
  )
  doc.useOAuth2Client(oAuth2Client)
  console.log(oAuth2Client)
  await doc.loadInfo() // loads document properties and worksheets
  console.log(doc.title)

  res.status(200).json({ name: 'John Doe' })
}

function getAuthenticatedClient() {
  return new Promise((resolve, reject) => {
    // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
    // which should be downloaded from the Google Developers Console.

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/spreadsheets'
    })

    open(authorizeUrl, { wait: true }).then(cp => cp.unref())

    resolve()
  })
}

export default async function callback(req, res) {
  try {
    console.log('callback')
    // acquire the code from the querystring, and close the web server.
    const qs = new url.URL(req.url, 'http://localhost:3000').searchParams
    const code = qs.get('code')
    console.log(`Code is ${code}`)
    const r = await oAuth2Client.getToken(code)
    // Make sure to set the credentials on the OAuth2 client.
    oAuth2Client.setCredentials(r.tokens)
    console.info('Tokens acquired.')
    //console.log(oAuth2Client)
    return res.status(200).json({
      name: 'Authentication successful! Please return to the console.'
    })
    // Now that we have the code, use that to acquire tokens.
  } catch (e) {
    console.error(e)
    res.status(500).json({ name: e.message })
  }

  //res.status(200).json({ name: 'John Doe' })
}

