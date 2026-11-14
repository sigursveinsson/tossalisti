# Innskráning með Google – uppsetning (um 10 mínútur)

Kóðinn er tilbúinn. Hnapparnir „Halda áfram með Google“ (upphafssíða) og „Vista með Google“ (prufuaðgangur)
virka um leið og Google er virkjað í Supabase. Þangað til fær notandinn kurteisleg skilaboð.
„Allow manual linking“ er þegar komið á í Supabase (þarf til að tengja Google við prufuaðgang).

## 1. Google Cloud – OAuth-lykill
1. Opnaðu https://console.cloud.google.com og búðu til verkefni: **Tossalisti**.
2. **APIs & Services → OAuth consent screen** (eða „Google Auth Platform“):
   - User type: **External**
   - App name: **Tossalisti** · Support email: tossalisti@tossalisti.is
   - App logo: public/icon-512.png (valfrjálst)
   - Authorized domain: **tossalisti.is**
   - Privacy policy: **https://tossalisti.is/personuvernd.html**
   - Developer contact: tossalisti@tossalisti.is
   - Scopes: aðeins sjálfgefnu (email, profile, openid)
   - Ýttu á **Publish app** (annars geta aðeins prófunarnotendur skráð sig inn)
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application** · Name: Tossalisti vefur
   - Authorized JavaScript origins: `https://tossalisti.is`
   - Authorized redirect URIs: `https://butgofssgsmlfxtwylgf.supabase.co/auth/v1/callback`
   - Smelltu Create → afritaðu **Client ID** og **Client secret**.

## 2. Supabase – virkja Google
1. https://supabase.com/dashboard/project/butgofssgsmlfxtwylgf/auth/providers
2. Neðar: **Auth Providers → Google** → kveikja (Enable).
3. Límdu inn **Client ID** og **Client secret** → Save.

(Ekki deila lyklinum með öðrum, og ekki líma hann í spjallið.)

## 3. Prófa
- Opnaðu https://tossalisti.is í **huliðsglugga í Chrome eða Safari** (ekki inni í Facebook/Instagram).
- „Halda áfram með Google“ → velja aðgang → þú lendir í appinu og nafnið er forútfyllt.
- Prufuaðgangur: „Vista aðgang“ → „Vista með Google“ → listarnir fylgja.

## Athugið
- Inni í Facebook- og Instagram-vafranum er Google-hnappurinn falinn (Google leyfir það ekki).
- Fyrir iOS-appið í janúar þarf einnig **Sign in with Apple** (krafa Apple þegar Google-innskráning er í boði).
