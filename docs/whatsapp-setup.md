# Daily WhatsApp to the cook: setup

Every evening at about **8 pm India time**, Rasoi Planner sends each opted-in cook tomorrow's menu and tonight's soaking reminders in Hindi from **Rasoi Planner's own WhatsApp number**.

The code is ready. It does nothing until the steps below are done. Nothing is sent until **all** of the following are true:
- The four secret keys are in Vercel.
- The message template is approved by Meta.
- A family is signed in, has turned it on, filled in the cook's number and ticked "My cook has agreed".

## What it costs (India, late 2026)
- **Meta** charges per message. A "utility" message to an Indian number costs about **₹0.12 to ₹0.15**. One cook for a month (30 messages) costs about **₹4–5**.
- Meta's own Cloud API has **no extra monthly fee**. Providers such as AiSensy, Interakt or Gupshup add a monthly plan, but give you an easier dashboard. This code uses Meta's Cloud API directly.
- **Vercel's free (Hobby) plan** allows this once-a-day job. Hobby is for non-commercial use, so move to Vercel Pro (about $20 a month) once you start charging customers.

## Step 1: a WhatsApp number for Rasoi Planner
1. Get a **new phone number** (a fresh SIM is fine) that is **not** on WhatsApp or WhatsApp Business. Once it is linked to the API it can't be used in the normal WhatsApp app.
2. Go to **business.facebook.com** and create a Meta Business account for Rasoi Planner.
3. In **Business settings → Security centre**, start **Business verification**. You need a business document (for example GST, Udyam or a shop licence) and a matching website or email. This can take a few days. You can test before it's done, but only with up to 5 numbers you add by hand.

## Step 2: the Meta app and number
1. Go to **developers.facebook.com → My apps → Create app**. Choose **Business**, then add the **WhatsApp** product.
2. Under **WhatsApp → API setup**, add your phone number and verify it with the SMS code.
3. Copy the **Phone number ID**. This is `WHATSAPP_PHONE_NUMBER_ID`.
4. Make a **permanent token**:
   - In **Business settings → Users → System users**, add a system user (Admin).
   - Give it your app and your WhatsApp account.
   - Click **Generate token**, tick `whatsapp_business_messaging` and `whatsapp_business_management`, and choose **Never expire**.
   - This token is `WHATSAPP_TOKEN`. Treat it like a password.

## Step 3: the message template (Meta must approve it)
In **WhatsApp Manager → Message templates → Create template**:
- **Category:** Utility
- **Name:** `rasoi_kal_ka_khana`
- **Language:** Hindi
- **Body**: type it exactly as below. The {{1}} to {{7}} parts are filled in by the app every day.

```
नमस्ते {{1}} जी 🙏
कल {{2}} का खाना:
नाश्ता: {{3}}
दोपहर: {{4}}
शाम: {{5}}
रात: {{6}}
आज रात की तैयारी: {{7}}
– रसोई प्लानर
```

- **Footer** (optional): `बंद करने के लिए STOP लिखें`
- **Samples** (Meta asks for them): Sunita / बुधवार, 18 नवंबर / पोहा / दाल तड़का, जीरा आलू, रोटी / भेल पूरी / पालक पनीर, रोटी / राजमा – रात भर भिगो दें

Approval usually takes from a few minutes to a day.

## Step 4: the secret keys in Vercel
In **vercel.com → rasoi-planner → Settings → Environment Variables**, add these four for **Production**:

| Name | Value |
| --- | --- |
| `CRON_SECRET` | Any long random text, at least 16 characters. Vercel sends it with each scheduled call, so no one else can trigger the job. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API keys → the **secret** key (`sb_secret_…`). Server only; never put it in the app code. |
| `WHATSAPP_TOKEN` | The permanent token from step 2 |
| `WHATSAPP_PHONE_NUMBER_ID` | The phone number ID from step 2 |

Then **redeploy**: Vercel → Deployments → the latest one → ⋯ → Redeploy.

## Step 5: test it
1. Sign in to the app, turn on **Family → Daily WhatsApp to the cook**, type **your own** number and tick the box.
2. For a **dry run** (sends nothing, shows what it would send), open a terminal and run:
   `curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://rasoi-planner-eta.vercel.app/api/cook-daily?dry=1"`
3. To send for real once, run the same command **without** `?dry=1`, or use **Vercel → Settings → Cron Jobs → Run**.
4. After that, Vercel runs it every evening by itself. The schedule is in `vercel.json` (14:30 UTC = 8:00 pm IST; the free plan may run it any time within that hour).

## Voice note (next step)
The app already has **Listen in Hindi**, which reads the day's menu aloud on the phone for free. To send a **voice note on WhatsApp**:
- A Hindi text-to-speech service (for example Google Cloud TTS or Sarvam AI) has to make the audio.
- WhatsApp only lets a business send audio after the cook has replied in the last 24 hours. The plan is to add a "सुनें" (listen) button to the template. When the cook taps it, Rasoi Planner replies with the voice note.

This needs a webhook and a TTS account, so it comes after the text message is working.

## Where the code is
- `src/engine/cook.ts` fills the template values (`cookTemplateParams`) and writes the read-aloud text (`cookSpeech`).
- `server/cook-daily.ts` is the daily job. Run `npm run api` to bundle it into `api/cook-daily.js`, and commit both.
- `vercel.json` holds the schedule.
