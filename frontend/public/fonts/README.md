# Söhne font files

The app's UI font is **Söhne** (the typeface ChatGPT uses). Söhne is a
commercial font licensed from [Klim Type Foundry](https://klim.co.nz/retail-fonts/soehne/)
and cannot be committed to this repo.

Once you have purchased a web license, export the `.woff2` files and place them
here with these exact names (referenced by `@font-face` in `src/app/globals.css`):

| File                                | Weight | Söhne name        |
| ----------------------------------- | ------ | ----------------- |
| `soehne-buch.woff2`                 | 400    | Buch (Regular)    |
| `soehne-kraftig.woff2`              | 500    | Kräftig (Medium)  |
| `soehne-halbfett.woff2`             | 600    | Halbfett (Semibold) |
| `soehne-dreiviertelfett.woff2`      | 700    | Dreiviertelfett (Bold) |

No code changes are needed — drop the files in and they load automatically.

Until the files are present, the app falls back to the same system font stack
ChatGPT uses (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica…`),
which looks nearly identical.
