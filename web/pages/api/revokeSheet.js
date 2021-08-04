import { oAuth2Client } from './hello'

export default async function index(req, res) {
  oAuth2Client.revokeCredentials(function (err, body) {
    if (err) {
      return res.status(500).json({ message: err.message })
    } else {
      console.log(body)
      return res.status(200).json({ message: 'Revoked tokens!' })
    }
  })
}
