# Project guidance

Read README.md and relevant sections of DECISIONS.md before substantial changes.
Consult FIXES.md when investigating previously documented issues.

## Delivery

After every feature or change, however small, commit the completed work, push
its feature branch, and open a pull request. Include the PR link in the final
response. Only skip or change this workflow when the user's current message
explicitly instructs otherwise. Do not treat implementation or local validation
alone as completion.

## Frontend

Use frontend-design for visual redesigns and substantial new UI.
Use web-design-guidelines when reviewing implemented UI.

Build on the existing components and design tokens.
Prioritize fast, one-handed workout logging on phones.
Support light and dark themes, accessible controls, and reduced motion.
Inspect the rendered interface at phone and desktop sizes when tools allow.
Keep offline behavior intact.

## Blender

Use blender for Blender Python, materials, rigging, animation, and exports.
Use blender-editable-3d for equipment built from independently editable parts.

Inspect existing assets and scripts before creating replacements.
Preserve source models and save revisions separately.
Use consistent units, object names, origins, and export axes.
Inspect renders and verify exported GLB files.
Follow existing asset licensing and Git exclusion rules.
Validate exercise animation loops and inspect representative poses.

## Validation

Run checks appropriate to the changed code.
Use the package.json scripts as the source of available check commands.
