# Baraza leader authentication deployment

The leader sign-in is served by the `baraza-leader-auth` Edge Function. Its database migration stores bcrypt hashes of the 17 access codes, enables database rate limiting, and restricts account-table access to the backend service role.

Deploy from the repository root after confirming the Supabase project reference:

```sh
supabase link --project-ref hvhpqvoizqsslbqwdymw
supabase secrets set BARAZA_SESSION_SECRET="$(openssl rand -hex 32)"
supabase db push
supabase functions deploy baraza-leader-auth
```

The Supabase Edge Function runtime provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Do not expose the service-role key or `BARAZA_SESSION_SECRET` in website files. The public sign-in page only uses the existing publishable key.

The shared leader sign-in name is `rsbaraza`; the five-digit code determines the assigned Baraza. The backend compares the name and code together and returns the same invalid-credentials response for every failed attempt.
