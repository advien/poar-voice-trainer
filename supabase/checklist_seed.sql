-- ────────────────────────────────────────────────────────────────
-- The checklists themselves. Run after checklists.sql, and again after every
-- reseed of `questions` (seed.sql truncates it, which wipes checklists too).
--
-- Each checklist is attached by the exact prompt text of its question, never by
-- uuid. Re-running is safe: an existing checklist for the question is replaced.
--
-- Rules for every entry:
--   * facts, in our own words — no wording or ready-made lists copied from a
--     source (a list is a selection, and a selection can be protected);
--   * `source` and `source_licence` filled in, and logged in research/sources.md;
--   * review_status stays 'derived_from_source' until a clinician has read it.
--
-- Template (copy, fill in, remove the leading dashes):
--
-- insert into public.question_checklists
--   (question_id, items, source, source_licence, review_status)
-- select q.id,
--        '[{"key": "item_key", "label": "What the answer should cover"}]'::jsonb,
--        'Document name and link',
--        'Licence of that document',
--        'derived_from_source'
--   from public.questions q
--  where q.prompt = 'The exact question text'
-- on conflict (question_id) do update
--   set items = excluded.items,
--       source = excluded.source,
--       source_licence = excluded.source_licence,
--       review_status = excluded.review_status;
--
-- Sets so far (all from the VA/DoD lower-limb amputation guideline, 2025):
--   residual limb care and skin health (4 questions), phantom limb pain (3),
--   socket fit and comfort (2), assessing a patient for a prosthesis (1).
-- Questions that share a topic share item keys on purpose, so a gap such as
-- "daily skin checks" adds up across different questions on the account page.
-- A statement `select count(*) from public.question_checklists;` after running
-- should return 10; fewer means a question's prompt text no longer matches.
-- ────────────────────────────────────────────────────────────────

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "daily_skin_checks", "label": "Checking the skin of the limb every day, especially the places that take pressure"}, {"key": "skin_hygiene", "label": "Keeping the skin clean and looking after the liner and sleeve hygiene"}, {"key": "sock_ply", "label": "Adjusting sock ply so the limb stays comfortably fitted as it changes"}, {"key": "wear_schedule", "label": "Building up the time in the prosthesis gradually"}, {"key": "limb_shaping_when_out", "label": "Using compression or a shrinker when the prosthesis is off, to control swelling and shape the limb"}, {"key": "when_to_get_help", "label": "What to watch for and when to get it checked: redness that does not settle, blisters, open skin, signs of infection"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'Discuss the best practices for residual limb care and maintaining skin health to ensure the success of prosthetic use.'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "daily_skin_checks", "label": "Checking the skin of the limb every day, especially the places that take pressure"}, {"key": "skin_hygiene", "label": "Keeping the skin clean and looking after the liner and sleeve hygiene"}, {"key": "sock_ply", "label": "Adjusting sock ply so the limb stays comfortably fitted as it changes"}, {"key": "wear_schedule", "label": "Building up the time in the prosthesis gradually"}, {"key": "limb_shaping_when_out", "label": "Using compression or a shrinker when the prosthesis is off, to control swelling and shape the limb"}, {"key": "when_to_get_help", "label": "What to watch for and when to get it checked: redness that does not settle, blisters, open skin, signs of infection"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'Outline key practices for residual limb care and maintaining skin health, ensuring the explanation is accessible to a non-specialist.'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "daily_skin_checks", "label": "Checking the skin of the limb every day, especially the places that take pressure"}, {"key": "skin_hygiene", "label": "Keeping the skin clean and looking after the liner and sleeve hygiene"}, {"key": "sock_ply", "label": "Adjusting sock ply so the limb stays comfortably fitted as it changes"}, {"key": "wear_schedule", "label": "Building up the time in the prosthesis gradually"}, {"key": "limb_shaping_when_out", "label": "Using compression or a shrinker when the prosthesis is off, to control swelling and shape the limb"}, {"key": "when_to_get_help", "label": "What to watch for and when to get it checked: redness that does not settle, blisters, open skin, signs of infection"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'What protocols do you recommend for ensuring proper residual limb care and skin health in patients using prosthetics?'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "daily_skin_checks", "label": "Checking the skin of the limb every day, especially the places that take pressure"}, {"key": "skin_hygiene", "label": "Keeping the skin clean and looking after the liner and sleeve hygiene"}, {"key": "sock_ply", "label": "Adjusting sock ply so the limb stays comfortably fitted as it changes"}, {"key": "wear_schedule", "label": "Building up the time in the prosthesis gradually"}, {"key": "limb_shaping_when_out", "label": "Using compression or a shrinker when the prosthesis is off, to control swelling and shape the limb"}, {"key": "when_to_get_help", "label": "What to watch for and when to get it checked: redness that does not settle, blisters, open skin, signs of infection"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'A patient with a recent amputation is unsure how to care for their residual limb to maintain skin health; how do you empathize with their worries while providing clear self-care tips?'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "pain_types", "label": "Telling phantom limb pain, phantom sensation and pain in the residual limb apart, since they are managed differently"}, {"key": "non_drug_options", "label": "Non-drug options such as desensitisation, compression, wearing the prosthesis, and TENS"}, {"key": "mirror_therapy", "label": "Mirror therapy as something worth referring for"}, {"key": "medication_with_team", "label": "Medication as a decision for the medical team, not something the speaker promises"}, {"key": "psychological_support", "label": "Mood and psychological support alongside the pain management"}, {"key": "reassess_over_time", "label": "Reviewing the pain again over time and changing the plan if it is not working"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'Explain strategies for managing phantom limb pain, making the discussion clear and approachable for a non-expert audience.'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "pain_types", "label": "Telling phantom limb pain, phantom sensation and pain in the residual limb apart, since they are managed differently"}, {"key": "non_drug_options", "label": "Non-drug options such as desensitisation, compression, wearing the prosthesis, and TENS"}, {"key": "mirror_therapy", "label": "Mirror therapy as something worth referring for"}, {"key": "medication_with_team", "label": "Medication as a decision for the medical team, not something the speaker promises"}, {"key": "psychological_support", "label": "Mood and psychological support alongside the pain management"}, {"key": "reassess_over_time", "label": "Reviewing the pain again over time and changing the plan if it is not working"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'What techniques are effective for managing phantom limb pain in patients with limb loss?'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "pain_types", "label": "Telling phantom limb pain, phantom sensation and pain in the residual limb apart, since they are managed differently"}, {"key": "non_drug_options", "label": "Non-drug options such as desensitisation, compression, wearing the prosthesis, and TENS"}, {"key": "mirror_therapy", "label": "Mirror therapy as something worth referring for"}, {"key": "medication_with_team", "label": "Medication as a decision for the medical team, not something the speaker promises"}, {"key": "psychological_support", "label": "Mood and psychological support alongside the pain management"}, {"key": "reassess_over_time", "label": "Reviewing the pain again over time and changing the plan if it is not working"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'A patient is experiencing phantom limb pain and feels discouraged; how can you offer empathy and discuss management strategies to help improve their situation?'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "skin_pressure_signs", "label": "Examining the limb for signs of excess pressure or rubbing: redness, blisters, callus, sore spots"}, {"key": "pistoning_suspension", "label": "Checking whether the limb moves up and down in the socket and whether suspension holds"}, {"key": "sock_liner_check", "label": "Checking the sock ply and liner, including whether they are worn or wrong"}, {"key": "donning_technique", "label": "Watching how the patient puts the prosthesis on"}, {"key": "alignment", "label": "Assessing alignment, standing and walking"}, {"key": "wear_time_limit", "label": "Cutting wear time when redness does not settle, then re-checking"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'During a follow-up, a patient complains that their prosthetic socket feels uncomfortable; how do you acknowledge their discomfort while guiding them through potential solutions?'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "skin_pressure_signs", "label": "Examining the limb for signs of excess pressure or rubbing: redness, blisters, callus, sore spots"}, {"key": "pistoning_suspension", "label": "Checking whether the limb moves up and down in the socket and whether suspension holds"}, {"key": "sock_liner_check", "label": "Checking the sock ply and liner, including whether they are worn or wrong"}, {"key": "donning_technique", "label": "Watching how the patient puts the prosthesis on"}, {"key": "alignment", "label": "Assessing alignment, standing and walking"}, {"key": "wear_time_limit", "label": "Cutting wear time when redness does not settle, then re-checking"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'Describe the assessment process you would use to determine if a prosthetic socket fit is appropriate for a patient.'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;

insert into public.question_checklists
  (question_id, items, source, source_licence, review_status)
select q.id,
       '[{"key": "prosthesis_candidacy", "label": "Whether the person is likely to be able to use a prosthesis, and what that depends on"}, {"key": "limb_condition", "label": "The residual limb itself: length, level, skin, swelling and sensation"}, {"key": "medical_factors", "label": "Health conditions and other injuries that affect function and rehabilitation"}, {"key": "goals_activity", "label": "What the patient wants to do and their activity level"}, {"key": "psychosocial_support", "label": "Mood, coping and who is around to help"}, {"key": "home_environment", "label": "Home and equipment needs"}]'::jsonb,
       'VA/DoD Clinical Practice Guideline for Rehabilitation of Individuals with Lower Limb Amputation (2025): Residual Limb Management and Pain Management tools, Clinician Summary. https://www.healthquality.va.gov/guidelines/rehab/amp/',
       'US federal government work (public domain in the US). The page carries no copyright statement; not independently verified, and not assumed to hold outside the US.',
       'derived_from_source'
  from public.questions q
 where q.prompt = 'Walk me through how you would assess a patient for a lower-limb prosthesis.'
on conflict (question_id) do update
  set items = excluded.items,
      source = excluded.source,
      source_licence = excluded.source_licence,
      review_status = excluded.review_status;
