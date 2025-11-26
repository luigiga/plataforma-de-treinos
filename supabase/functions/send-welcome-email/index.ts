import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  email: string
  name: string
  username: string
}

export const onRequest = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, username } = (await req.json()) as WelcomeEmailRequest

    if (!email) {
      throw new Error('Email is required')
    }

    console.log(`[INFO] Starting welcome email process for: ${email}`)
    console.log(`[INFO] User details - Name: ${name}, Username: ${username}`)

    // In a real production environment, you would use an email service provider like Resend, SendGrid, or AWS SES.
    // Example with Resend (if RESEND_API_KEY was available):
    /*
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'FitPlatform <onboarding@fitplatform.com>',
        to: email,
        subject: 'Bem-vindo à FitPlatform!',
        html: `<h1>Olá ${name}!</h1><p>Estamos muito felizes em ter você conosco, @${username}.</p>`,
      }),
    });
    */

    // Simulating email sending delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log(`[SUCCESS] Welcome email successfully sent to ${email}`)

    return new Response(
      JSON.stringify({ message: 'Welcome email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error(`[ERROR] Failed to send welcome email:`, error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
