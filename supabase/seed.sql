-- ────────────────────────────────────────────────────────────────
-- POAR Voice Trainer — question bank seed
--
-- Run AFTER schema.sql. Safe to re-run: it clears the table first.
-- Each question belongs to one practice mode and carries one or more
-- POAR area tags. Cross-cutting questions list multiple areas.
-- ────────────────────────────────────────────────────────────────

truncate table public.questions restart identity cascade;

insert into public.questions (mode, areas, prompt) values

-- ── Explain Term ────────────────────────────────────────────────
('explain-term', array['prosthetics']::poar_area[],
  'Explain what a myoelectric prosthesis is, as if teaching a new colleague.'),
('explain-term', array['prosthetics']::poar_area[],
  'Explain the difference between a transtibial and a transfemoral prosthesis.'),

('explain-term', array['orthotics']::poar_area[],
  'Explain what an ankle-foot orthosis (AFO) does and who typically needs one.'),
('explain-term', array['orthotics']::poar_area[],
  'Explain the purpose of a spinal orthosis in managing scoliosis.'),

('explain-term', array['robotics']::poar_area[],
  'Explain what a powered exoskeleton is and how it assists a person''s gait.'),
('explain-term', array['robotics']::poar_area[],
  'Explain the role of sensors and actuators in an assistive robotic device.'),

-- Cross-cutting: robotics + prosthetics.
('explain-term', array['robotics','prosthetics']::poar_area[],
  'Explain how a bionic (robotic) prosthesis differs from a conventional body-powered one.'),

-- ── Patient Communication ───────────────────────────────────────
('patient-communication', array['prosthetics']::poar_area[],
  'A patient is anxious before their first prosthetic fitting. Reassure them and explain what to expect.'),
('patient-communication', array['prosthetics']::poar_area[],
  'Explain to a patient how to care for their residual limb and prosthetic socket day to day.'),

('patient-communication', array['orthotics']::poar_area[],
  'A patient finds their new AFO uncomfortable. Respond with empathy and explain the adjustment period.'),
('patient-communication', array['orthotics']::poar_area[],
  'Explain to a parent why their child needs to wear a scoliosis brace, and how to support adherence.'),

('patient-communication', array['robotics']::poar_area[],
  'A patient is skeptical about using a robotic exoskeleton in rehab. Address their concerns.'),
('patient-communication', array['robotics']::poar_area[],
  'Explain to a patient how an assistive robotic arm can help with everyday activities.'),

-- Cross-cutting: orthotics + robotics.
('patient-communication', array['orthotics','robotics']::poar_area[],
  'Explain to a patient how a robotic (powered) orthosis differs from their current passive brace.'),

-- ── Interview Practice ──────────────────────────────────────────
('interview', array['prosthetics']::poar_area[],
  'Walk me through how you would assess a patient for a lower-limb prosthesis.'),
('interview', array['prosthetics']::poar_area[],
  'How do you decide between different prosthetic foot types for an active patient?'),

('interview', array['orthotics']::poar_area[],
  'Describe your approach to fabricating and fitting a custom AFO.'),
('interview', array['orthotics']::poar_area[],
  'How would you manage a patient whose orthosis is causing skin breakdown?'),

('interview', array['robotics']::poar_area[],
  'How would you evaluate whether a patient is a good candidate for an exoskeleton-assisted gait program?'),
('interview', array['robotics']::poar_area[],
  'What safety considerations are most important when introducing assistive robotics into rehabilitation?'),

-- Cross-cutting: prosthetics + orthotics + robotics.
('interview', array['prosthetics','orthotics','robotics']::poar_area[],
  'How do you keep up with advances across prosthetics, orthotics, and assistive robotics in your practice?');
