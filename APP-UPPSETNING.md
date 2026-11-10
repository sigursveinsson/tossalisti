# Tossalisti — iOS/Android app (Capacitor)

Appið er sami vefkóðinn (dist/) pakkaður í innfædda skel. Allt sem snýr að appinu er feature-detect:
vefurinn virkar óbreyttur þótt app-pakkarnir séu ekki uppsettir.

Auðkenni: `is.tossalisti.app` · Nafn: Tossalisti · Stillingar: `capacitor.config.json` · Skýjabygging: `codemagic.yaml`

## Skref fyrir Sverri (í þessari röð)

### A. Reikningar (byrja strax — biðtíminn er lengstur hér)
1. **D-U-N-S númer** fyrir félagið (frítt, 1–2 vikur): https://developer.apple.com/enroll/duns-lookup/
2. **Apple Developer Program** sem fyrirtæki (99 USD/ár) — þarf D-U-N-S. Samþykki tekur daga til vikur.
3. **Google Play Console** (25 USD einu sinni). Nýir reikningar þurfa 12 prófendur í 14 daga í lokaðri prófun áður en appið má fara í almenna útgáfu — byrja snemma.
4. **Codemagic** reikningur (https://codemagic.io), tengja við GitHub-repo. Frítt 500 mín/mán dugar fyrir prófun.

### B. Kóði (þegar Node er til staðar á tölvunni)
```
cd C:\Users\sigur\Documents\korfan
npm run app:install      # sækir Capacitor + viðbætur
npm run app:init         # býr til ios/ og android/ möppur
npm run app:assets       # app-tákn og ræsiskjár úr assets/ (sjá neðar)
npm run app:sync         # vite build + afrita í ios/android
git add -A && git commit -m "Capacitor app" && git push
```
Fyrir `app:assets` þarf möppuna `assets/` með `icon.png` (1024×1024, án rúnnaðra horna) og `splash.png` (2732×2732, táknið í miðju á hvítu).
Ég get búið þessar til úr núverandi icon-512 þegar þú vilt.

### C. Djúptenglar (Universal Links / App Links)
Svo tossalisti.is/k/… og auðkennistenglar opnist í appinu:
- iOS: skrá `public/.well-known/apple-app-site-association` með Team ID (fæst eftir Apple-skráningu).
- Android: skrá `public/.well-known/assetlinks.json` með SHA-256 fingrafari undirritunarlykils (fæst úr Codemagic/Play Console).
Ég skrifa báðar skrár þegar Team ID og fingrafar liggja fyrir.

### D. Supabase
- Authentication → URL Configuration → Redirect URLs: bæta við `https://tossalisti.is/*` (er líklega þegar) og `is.tossalisti.app://*`.
- Push um APNs/FCM: send-reminders sleppir enn tókum úr appinu (`apns:`/`fcm:`). Þarf APNs-lykil (.p8) frá Apple og Firebase-verkefni fyrir FCM — sett upp þegar appið er komið í TestFlight.

### E. Codemagic
Í Codemagic-viðmótinu (aldrei í kóða): App Store Connect API-lykill (integration „Tossalisti ASC“), Google Play þjónustureikningur (hópur `google_play`), Android keystore (`tossalisti_keystore`), og umhverfishópur `vite` með VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY.
Bygging fer af stað með git-tagi: `git tag ios-0.1.0 && git push --tags` → TestFlight; `android-0.1.0` → Play internal.

## Hvað appið gerir öðruvísi en vefurinn
- **Skjalaskanni** (ML Kit á Android, VisionKit á iOS) í stað myndavélar: finnur brúnir, réttir og skerpir; löng kvittun = allt að 4 síður í einni lotu. `src/lib/native.js` + ReceiptScanner.
- **Push** um APNs/FCM í stað web-push (sama tafla, endpoint `apns:`/`fcm:`). `src/lib/push.js`.
- **Enginn service worker** í appinu; ræsiskjár falinn þegar React er komið upp; Android til-baka-takki lokar gluggum. `src/main.jsx`.
- **Eyða reikningi** (krafa Apple/Google): Listarnir mínir → Eyða reikningi → skrifa EYÐA. RPC `delete_my_account`, myndir eyddar úr storage fyrst. Persónuverndarstefna: `/personuvernd.html`.

## Tímalína
- Nóv: reikningar samþykktir, fyrsta TestFlight/internal-bygging, boðshópur prófar appið.
- Des: push um APNs/FCM, djúptenglar, skjáskot og verslunartextar.
- Jan: skil í App Store og Google Play (yfirferð 1–7 dagar).
