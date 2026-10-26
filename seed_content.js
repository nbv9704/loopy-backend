// Retired: legacy SQL seeding could recreate CMS aliases and overwrite authored copy.
// Import reviewed docs/seeds/cms_content_seed_{vi,en}.json through Admin CMS instead.
console.error(
  'Legacy CMS seed is disabled. Use the reviewed JSON import in Admin CMS; see ../docs/CMS_CLEANUP.md.'
)
process.exitCode = 1
