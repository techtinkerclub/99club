# 99 Club Studio analytics setup and event map

99 Club Studio uses two deliberately separate analytics layers:

1. **Google Analytics 4 (GA4)** for consented teacher-facing product analytics on the main Studio interfaces.
2. **First-party school usage telemetry** for organisation/source-site attribution on public school integrations and parent-practice links. This layer is currently disabled until a collection endpoint, retention policy and opt-out mechanism are finalised.

The design goal is to understand **which schools/sites use which resources and which product features are useful**, without creating pupil or parent profiles.

## 1. Google Analytics 4

The GA4 web stream is configured in assets/99club/analytics-config.js with Measurement ID G-844RPWD4HE.

Google Consent Mode starts with analytics storage denied. Analytics storage is granted only when the visitor chooses **Allow analytics**. Advertising-related consent/signals remain disabled.

GA4 is deliberately **not loaded inside the public embedded school widget** or the stripped parent-practice pages.

### Shared product-event context

Where available, teacher-facing events can include:

- school_key — stable opaque key derived from the school name entered in Studio; the school name itself is not sent to GA4
- source_origin — external referring website origin only, for example https://school.example; path/query/fragment are discarded
- app_mode — browser or pwa
- integration_id — non-personal widget integration ID when Online Play was opened from a school widget

Never send pupil names, parent names, teacher names, school names, uploaded logos, question text, answers, custom vocabulary text, seeds, recreation codes, full referring page URLs or contact-form text as GA4 event parameters.

## 2. GA4 event catalogue

### Main 99 Club

**studio_open**

- area = club
- shared school/source/PWA context

**challenge_selected**

- scheme_id
- challenge_id
- shared context

**worksheet_download**

- pdf_kind
- scheme_id
- challenge_id
- variant_count
- question_count
- orientation
- answer_qr
- shared context

**parent_share_open**

- area = club
- challenge_id
- scheme_id
- shared context

**parent_share_action**

Action values include:

- copy_link
- copy_card
- download_card
- copy_all_cards
- copy_all_links
- open_parent_view
- preview
- save_config
- restore_config
- download_website_pack
- open_widget_builder

club_id or club_count is included where relevant.

### Custom Worksheets

**studio_open**

- area = custom
- shared context

**custom_worksheet_download**

- pdf_kind
- variant_count
- question_count
- orientation
- topic_count
- curriculum_year
- shared context

### Printable Maths Games & Puzzles

**studio_open**

- area = games
- shared context

**game_pack_selection**

- game_id
- selection_action
- selection_source
- difficulty
- shared context

**game_difficulty_selected**

- game_id
- difficulty
- context
- shared context

**game_pack_download**

- pdf_kind
- sheet_count
- activity_count
- game_count
- worked_examples
- shared context

**game_in_download**

- game_id
- pdf_kind
- activity_count
- difficulty
- shared context

**puzzle_parent_share_open**

- game_count
- sheet_count
- shared context

**puzzle_parent_share_action**

Action values include copy_link, copy_card, open_parent_view, download_card, save_config, restore_config, download_website_pack and open_widget_builder.

### Widget Builder

The Widget Builder uses consented GA4 because it is a teacher-facing Studio interface. The public embedded widget itself does not.

Events:

- widget_builder_open
- widget_type_selected
- widget_existing_import
- widget_embed_copy
- widget_url_copy
- widget_setup_save
- widget_setup_restore

Useful parameters:

- entry_type
- widget_type
- school_key
- source_origin
- club_count
- puzzle_pack_count
- online_game_count
- has_school_name
- has_school_logo
- custom_vocabulary_count

widget_embed_copy is the strongest teacher-side indication that an embed is ready to publish.

### Online Play

**online_game_started**

- game_id
- difficulty
- play_mode
- integration_id when opened from a widget
- source_origin when opened directly from an external site
- app_mode

**online_hint_used**

- game_id
- difficulty
- play_mode
- hint_number
- attribution context

**online_game_completed**

- game_id
- difficulty
- play_mode
- hints_used
- duration_seconds
- personal_best
- attribution context

The widget integration ID is kept in memory for that play session even after the visible URL is normalised. It is not deliberately carried into ordinary copied challenge links.

### PWA

Events:

- pwa_install_prompt
- pwa_install_action with action install or dismiss
- pwa_installed
- pwa_update_available
- pwa_update_action with action refresh or dismiss

These events help distinguish installed-app issues from ordinary-browser issues and measure whether PWA adoption is material.

### Navigation

navigation_click target values include:

- club
- games
- play_online
- help
- integration_help
- widget_help
- widget_builder
- contact
- support

## 3. GA4 custom definitions to register

Recommended event-scoped custom dimensions:

- school_key
- source_origin
- app_mode
- integration_id
- area
- game_id
- difficulty
- pdf_kind
- challenge_id
- scheme_id
- play_mode
- selection_action
- selection_source
- context
- target
- source_area
- orientation
- action
- widget_type
- entry_type

Recommended custom metrics:

- variant_count
- question_count
- sheet_count
- activity_count
- game_count
- club_count
- puzzle_pack_count
- online_game_count
- topic_count
- custom_vocabulary_count
- hints_used
- hint_number
- duration_seconds

Do not register school name, vocabulary terms, question text, full URLs or recreation codes as custom definitions.

## 4. First-party school usage telemetry

Implementation:

- assets/99club/school-usage.js
- assets/99club/school-usage-config.js

Current configuration:

- enabled: false
- endpoint: empty
- schema version: 2

No school-usage network requests are currently sent.

This layer is independent of Google Analytics and is designed for **organisation/source-site analytics without visitor profiles**.

It uses:

- no cookie
- no localStorage/session visitor identity
- no persistent parent/pupil visitor ID
- no pupil/parent name
- no score/progress record
- no worksheet question/answer
- no seed/recreation code
- no full referring page URL

### Source attribution

source_origin is reduced to scheme + hostname/port only.

Kept:

https://oakfieldprimary.org.uk

Discarded:

/year-5/home-learning/?child=...#section

For links/cards, origin attribution is available only when the browser/site supplies a referrer.

Generated 99 Studio HTML cards request referrerpolicy=origin so the destination can receive the school site origin without receiving the page path.

For widgets, the generated iframe also requests referrerpolicy=origin. The public widget reads only the origin and never the full embedding page URL.

### Widget integration IDs

Published widgets carry a public, non-personal integration_id beginning wid_.

This allows the following events to be joined without identifying a parent or device:

widget_open → widget_item_open → practice_open → practice_download

An imported/updated widget keeps its integration ID when available. Older widgets without one get a safe fallback identifier at runtime until recreated.

## 5. First-party event schema v2

### school_register

Fields:

- schema_version
- event
- school_key
- school_name

Purpose: associate an opaque school key with the public organisation name entered by the teacher.

The school name belongs only in this first-party registration record, not GA4 product events.

### studio_use

Fields:

- schema_version
- event
- action, such as studio_open, worksheet_download, custom_worksheet_download, game_pack_download, parent_share_open, widget_builder_open or widget_embed_copy
- school_key when available
- area
- source_origin when available

An event can be retained with only source_origin when no school name/key was supplied.

### widget_open

Fields:

- schema_version
- event
- school_key when available
- source_origin
- source_kind = widget
- integration_id
- widget_type
- club_count
- puzzle_pack_count
- online_game_count

Teacher previews in the Widget Builder are explicitly excluded. A widget open is sent only when an external embedding origin is present.

### widget_item_open

Same widget context plus:

- item_type = club, puzzle or online_game
- item_id = Club ID, generated pack slot ID or game ID

### practice_open and practice_download

Fields include:

- school_key when available
- club_id
- scheme_id
- question_count
- mode
- orientation
- source_origin when available
- source_kind
- integration_id when opened through a widget

Teacher preview=1 traffic is explicitly excluded.

### puzzle_practice_open and puzzle_practice_download

Fields include:

- school_key when available
- game_ids
- game_count
- topic_ids
- game_difficulties
- min_year
- max_year
- sheet_count
- activities_per_sheet
- worked_examples
- custom_vocabulary_count
- source_origin when available
- source_kind
- integration_id when opened through a widget

Only the count of custom vocabulary entries is included. Vocabulary text is not.

## 6. Reports this design should support

### Who is using Studio?

Group studio_use by:

- registered school_key mapped to school name
- source_origin where no school key exists
- area
- action/date

### Which school websites have embedded our widgets?

Group widget_open by:

- source_origin
- school_key
- widget_type
- integration_id

### Where are parent link/card clicks coming from?

Group practice_open and puzzle_practice_open by:

- source_origin
- school_key
- source_kind

Referrer attribution is best-effort: a school CMS, browser or privacy tool can suppress it.

### Do widgets actually lead to practice?

Funnel by integration_id:

1. widget_open
2. widget_item_open
3. practice_open / puzzle_practice_open
4. practice_download / puzzle_practice_download

### Which publishing method do teachers prefer?

Use consented GA4:

- copied normal links
- copied HTML cards
- PNG card downloads
- website pack downloads
- widget builder opens
- widget embed copies

### Which parts of the product drive real use?

Combine consented teacher-side GA4 with first-party school-site/public-practice events. Do not attempt to join individual visitors between the two systems.

## 7. Requirements before enabling first-party school telemetry

Before changing enabled to true:

1. Deploy an HTTPS POST endpoint.
2. Decide the retention period.
3. Decide the school objection/opt-out route.
4. Update /privacy/ and /schools/ against the final active behaviour.
5. Confirm the endpoint does not persist request IP addresses or user-agent strings as analytics records.
6. Apply abuse/rate limiting separately from the analytics dataset.
7. Validate every payload server-side against the schema and discard unknown fields.
8. Do not log request bodies into a long-retention general-purpose debug log.
9. Store server receive time rather than trusting a client timestamp.
10. Keep parent/pupil identifiers out of the schema.
11. Test teacher previews are excluded.
12. Test source URLs are reduced to origin only.
13. Test custom vocabulary text cannot enter the payload.

### Sandboxed widget note

The public widget is intentionally sandboxed without allow-same-origin. Depending on the final endpoint/domain, requests from the iframe may present an opaque browser origin. The endpoint should therefore use strict payload validation and rate limiting rather than treating a CORS Origin header as its trust boundary.

Do not weaken the widget sandbox merely to simplify analytics.

## 8. Data-minimisation rule for future features

For every new feature decide at implementation time:

1. What question will this event answer?
2. Does it belong in consented GA4 or first-party school usage?
3. What is the minimum useful parameter set?
4. Could any parameter contain pupil, parent, teacher or free-text data?
5. Can a full URL be reduced to an origin or ID?
6. Is teacher preview/test traffic excluded?

Never add pupil names, parent names, teacher names, school names to GA4, uploaded logos, custom vocabulary text, worksheet question text, answers, contact-form contents, generated seeds, recreation codes or full page URLs to analytics product events.
