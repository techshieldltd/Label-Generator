# TSL Label Generator

Web app to generate printable A4 product labels with IMEI barcode/QR support.

## User Instructions

1. Open `index.html` in a browser.
2. Set your label options in the left panel:
   - Label mode (`Big label`, `Small label`, or `Combo`)
   - Manufacturer, warranty, model, website
   - Label size, margin, gap, border
   - Logo files and logo sizes
   - Code display mode (`Barcode + QR`, `Barcode only`, or `QR only`)
3. Enter IMEIs in the `IMEIs` box (comma-separated or line-by-line).
4. Click `Generate` to preview labels.
5. Click `Print (A4)` to print.
6. Click `Reset` to clear and return to defaults.

## Logo Setup

1. Put logo image files inside `img/`.
2. Add those filenames to `img/manifest.js`.
3. Refresh the page, then select logos from:
   - `Main logo (from img folder)`
   - `Top-right logo (from img folder)`

## Notes

- Barcode format is `CODE128` (suitable for IMEI labels).
- `Installation Date` is intentionally blank on generated labels.
- If you need model auto-format like `Prefix + last 6 digits`, update `main.js`.
