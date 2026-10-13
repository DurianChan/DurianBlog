# Installed components

Vendored upstream sources (downloaded 2026-10-13):

- `shortcode-mmt-netease`: https://github.com/hugo-fixit/shortcode-mmt-netease at `e93f68d9b63c42b4366bf332384c4e3061f824c7`.
- `plugins-live2d`: https://github.com/fixit-theme/hugo-shortcode-plugins-live2d at `0713a7a496552f22f09b046bec15afcc7e82b4c5`.

Project overrides in root `layouts/` and `static/` adapt the original components for FixIt 0.4.5 and GitHub Pages project URLs. Live2D uses the component's bundled widget/runtime/models rather than the old jQuery remote loader. The NetEase comment endpoint uses the upstream's official mirror, `cell-api.vercel.app`. Comments are rendered as text and time out after 15 seconds. Music playback is optional (`player="true"`); the default is comments only because the upstream Meting playlist service may be unavailable.

APlayer 1.10.1 and Meting 2.0.1 browser distributions are included under `static/mmt-netease/`; their upstream licenses are retained alongside them. Original model attribution and usage notes are retained in `plugins-live2d/static/live2d-widget/README.md`.
