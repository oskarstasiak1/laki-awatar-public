# LAKI — awatar holograficzny

Prywatny projekt awatara LAKI. Aktualny prototyp 2.5D wyświetla niebiesko-bursztynową twarz holograficzną i synchronizuje ruch ust z polskim nagraniem testowym.

## Uruchomienie

```bash
python3 -m http.server 8000 --directory dist
```

Otwórz `http://localhost:8000` i kliknij **Odtwórz test**. Dźwięk wymaga interakcji użytkownika w przeglądarce. Mikrofon wymaga `localhost` albo HTTPS.

## Co działa

- Portret w WebGL, subtelne ruchy twarzy oraz animacja ust i żuchwy.
- Polskie zdanie „Cześć, jestem Laki. Jak mogę Ci pomóc?” wraz z czasami 50 głosek.
- Odtwórz, pauza, wznów, stop i zmiana tempa bez utraty synchronizacji.
- Awaryjny nieruchomy portret, gdy WebGL jest niedostępny.
- Panel interfejsu z opcjonalnym adapterem `/health`, `/status`, `/chat`.

## Granice obecnej wersji

Portret jest animowaną powierzchnią 2.5D, a nie modelem 3D. Synchronizacja głosek działa dla dołączonego nagrania. Dowolne odpowiedzi agenta wykorzystują syntezę przeglądarki i przybliżony ruch ust. Backend LAKI nie jest skonfigurowany ani dostępny z tej paczki. Nie umieszczaj tokenów ani adresów prywatnego API w repozytorium.

## Architektura

- `dist/presence-portrait.js` — deformacja portretu w WebGL.
- `dist/speech-demo.js` — odtwarzanie i mapowanie głosek na kształty ust.
- `dist/media/laki-welcome.wav` i `.json` — nagranie i czasy głosek.
- `tools/build_speech_demo.py` — odtwarzalna generacja pary WAV/JSON za pomocą Piper, przy użyciu zewnętrznego modelu głosu.
- `dist/app.js` — interfejs oraz adapter API.
- `dist/presence.js` — wcześniejsza eksperymentalna twarz proceduralna (nie jest obecnie ładowana).

## Pochodzenie i licencje

Oryginalny kod UI integruje elementy VoiceOrbs Halo i JARVIS UI na licencjach MIT. Informacje o źródłach: `dist/sources.html`; teksty licencji: `dist/licenses`. Model głosu nie jest dołączony, a karta modelu opisuje licencję danych CC0. Portret to wygenerowany zasób projektu LAKI.

## Następny etap

Zastąpić deformację powierzchni faktyczną siatką 3D twarzy z blendshape dla warg, szczęki i powiek; następnie dodać generację mowy dla każdej odpowiedzi LAKI z nowymi czasami głosek i bezpieczny dostęp do backendu.
