# Ahona — Google Play Store pack

Everything you need to list the Android app on Play Console.

## Upload these

| Play Console field | File | Size |
|---|---|---|
| High-res icon | `icon/play-icon-512.png` | 512×512 PNG |
| Feature graphic | `graphics/feature-graphic-1024x500.png` | 1024×500 PNG |
| Phone screenshot 1 | `screenshots/phone/01-home.png` | 1080×1920 |
| Phone screenshot 2 | `screenshots/phone/02-medicines.png` | 1080×1920 |
| Phone screenshot 3 | `screenshots/phone/03-product.png` | 1080×1920 |
| Phone screenshot 4 | `screenshots/phone/04-lab.png` | 1080×1920 |
| Phone screenshot 5 | `screenshots/phone/05-doctors.png` | 1080×1920 |

Listing copy (title, short & full description) is in `LISTING.txt`.

## Extra icons (device launcher)

`icon/ic_launcher-mdpi.png` … `xxxhdpi.png` — drop into `android/app/src/main/res/mipmap-*` if you want the store icon on the phone home screen.

Adaptive layers:

- `icon/adaptive-foreground-432.png`
- `icon/adaptive-background-432.png`

## Rebuild

From the repo:

```bash
node app/store-assets/generate-play-store.mjs
```

Requires Google Chrome (macOS) and the `web/` `sharp` package.
