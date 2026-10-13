# Blog mascot generation

Created with the built-in image_gen tool, using the user's existing sprite atlas only as an identity/style reference. Original pet source: `C:/Users/DurianChan/.codex/pets/deepseek/spritesheet.webp` (left unchanged).

The new atlas is 4 columns × 4 rows, with idle/blink, wave, happy, and rest actions. It is a frame animation asset, not a Live2D model. A second pass corrects transparent margins and frame alignment.

## Initial prompt

Create a production-ready transparent sprite atlas for a small blog mascot based closely on the referenced pet. Identity reference: the attached sheet, NOT an edit target. Preserve the character: cute chibi blue-haired maid, blue eyes, long wavy dark-blue hair with cyan tips, whale-tail-like side hair ornaments and small blue bows, white lace maid headband, navy dress with gold trims, white apron bearing a small blue whale motif, white stockings and dark shoes. Hand-painted anime game sprite look, matching original proportions and face. Output EXACTLY a regular 4 columns x 4 rows grid, 16 equal square cells, square canvas. Every cell contains ONE complete full-body front-facing character, identical scale, feet at the same baseline, centered horizontally, no cropping, generous transparent margins. Row 1 (4 frames): idle breathing and a blink sequence, eyes open, half closed, closed, open. Row 2 (4 frames): cheerful right-hand wave, arm raise, wave one way, wave other way, arm lower. Row 3 (4 frames): happy reaction, small smile, closed-eye joyful smile with hands together, tiny excited bounce, settle. Row 4 (4 frames): sleepy resting, sleepy half eyes, eyes closed head slightly tilted, soft sleep, return slightly. Keep silhouette height and x/y position consistent, allow only gentle motion. Genuine transparent alpha background; NO black/white/checkerboard background, NO ground shadows, NO text, labels, cell borders or separators, NO props, NO extra characters. This atlas will be split mathematically into equal cells, so accurate alignment and no frame bleeding are essential.

## Refinement prompt

undefined

