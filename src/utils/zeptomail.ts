export async function sendZeptoMail(toEmail: string, subject: string, htmlBody: string) {
  const url = process.env.ZEPTOMAIL_API_URL
  const token = process.env.ZEPTOMAIL_SEND_TOKEN
  const fromAddress = process.env.ZEPTOMAIL_FROM_ADDRESS
  const fromName = process.env.ZEPTOMAIL_FROM_NAME

  if (!url || !token || !fromAddress) {
    console.error('Missing ZeptoMail environment variables')
    return { error: 'Email configuration missing' }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        from: {
          address: fromAddress,
          name: fromName || 'Placeme'
        },
        to: [
          {
            email_address: {
              address: toEmail
            }
          }
        ],
        subject: subject,
        htmlbody: htmlBody
      })
    })

    const result = await response.json()
    if (!response.ok) {
      console.error('ZeptoMail Error:', result)
      return { error: result.message || 'Failed to send email' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('ZeptoMail Fetch Error:', error)
    return { error: error.message }
  }
}
