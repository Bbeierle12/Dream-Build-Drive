-- Demo seed: 1972 Datsun 240Z full restoration build
-- Run with: npx supabase db execute --project-ref svstuvcuwwqzxlyguvzz -f supabase/seed-demo.sql

DO $$
DECLARE
  v_user_id uuid;
  v_project_id uuid;
  -- category IDs
  cat_engine uuid;
  cat_suspension uuid;
  cat_brakes uuid;
  cat_electrical uuid;
  cat_interior uuid;
  cat_exterior uuid;
  cat_fuel uuid;
  cat_cooling uuid;
  -- part IDs (for linking tasks/specs)
  part_engine_rebuild uuid;
  part_carbs uuid;
  part_coilovers uuid;
  part_big_brake uuid;
  part_ecu uuid;
  part_seats uuid;
  part_paint uuid;
  part_radiator uuid;
  part_fuel_pump uuid;
  part_exhaust uuid;
  part_wheels uuid;
  part_harness uuid;
  part_headlights uuid;
  part_carpet uuid;
  part_steering uuid;
  -- task IDs (for dependencies)
  task_teardown uuid;
  task_engine_rebuild uuid;
  task_carb_tune uuid;
  task_suspension_install uuid;
  task_brake_install uuid;
  task_wiring uuid;
  task_bodywork uuid;
  task_paint uuid;
  task_interior uuid;
  task_final_assembly uuid;
  task_alignment uuid;
  task_dyno uuid;
BEGIN
  -- Get the most recent user (the one who just signed up)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Sign up first.';
  END IF;

  -- Create project
  INSERT INTO projects (user_id, name, year, make, model, trim, vin, color, budget, notes)
  VALUES (
    v_user_id,
    '240Z Restoration',
    1972,
    'Datsun',
    '240Z',
    'Series 1',
    'HLS30-71945',
    'Safari Gold 117',
    25000.00,
    'Full rotisserie restoration of a 1972 Datsun 240Z. Goal: period-correct street/canyon carver with tasteful upgrades. Keeping the L24 but rebuilding to E88 head spec with triple Mikuni carbs.'
  )
  RETURNING id INTO v_project_id;

  -- Get auto-created category IDs
  SELECT id INTO cat_engine FROM categories WHERE project_id = v_project_id AND name = 'Engine';
  SELECT id INTO cat_suspension FROM categories WHERE project_id = v_project_id AND name = 'Suspension';
  SELECT id INTO cat_brakes FROM categories WHERE project_id = v_project_id AND name = 'Brakes';
  SELECT id INTO cat_electrical FROM categories WHERE project_id = v_project_id AND name = 'Electrical';
  SELECT id INTO cat_interior FROM categories WHERE project_id = v_project_id AND name = 'Interior';
  SELECT id INTO cat_exterior FROM categories WHERE project_id = v_project_id AND name = 'Exterior';
  SELECT id INTO cat_fuel FROM categories WHERE project_id = v_project_id AND name = 'Fuel';
  SELECT id INTO cat_cooling FROM categories WHERE project_id = v_project_id AND name = 'Cooling';

  -- ==================== PARTS ====================

  -- Engine parts
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_engine, 'L24 Engine Rebuild Kit', 'RB-L24-KIT', 'Z Car Source', 1800.00, 1650.00, 'received', 'Pistons, rings, bearings, gasket set. Going 0.5mm over.')
  RETURNING id INTO part_engine_rebuild;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_engine, 'Mikuni PHH 44mm Triple Carbs', 'PHH44-TRIPLE', 'Mikuni Power', 2200.00, 2350.00, 'installed', 'Rebuilt set with velocity stacks. Jetted for L24 E88.')
  RETURNING id INTO part_carbs;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, vendor_url, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_engine, 'Stainless Header 6-into-1', 'MSA-HDR-6-1', 'Motorsport Auto', 'https://motorsportauto.com', 850.00, 850.00, 'installed', '6-into-1 collector, ceramic coated')
  RETURNING id INTO part_exhaust;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_engine, 'E88 Cylinder Head - Rebuilt', 'E88-HEAD-R', 'Rebello Racing', 1400.00, 1550.00, 'received', 'Ported, 3-angle valve job, new guides and seals');

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_engine, 'MSD 6AL Ignition Box', '6425', 'MSD', 320.00, 'ordered', 'CDI ignition upgrade for cleaner spark with triples');

  -- Suspension parts
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_suspension, 'BC Racing BR Coilovers (240Z)', 'BC-ZG-02-BR', 'BC Racing', 1200.00, 1150.00, 'installed', '30-way adjustable, 8k/6k spring rates. 1.5" drop.')
  RETURNING id INTO part_coilovers;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_suspension, 'Techno Toy Tuning Tension Rods', 'TTT-TR-S30', 'Techno Toy Tuning', 280.00, 280.00, 'installed', 'Adjustable front tension rods');

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_suspension, 'Whiteline Rear Sway Bar 22mm', 'BSR33Z', 'Whiteline', 220.00, 195.00, 'received', 'Adjustable 2-position rear sway bar');

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_suspension, 'Polyurethane Bushing Kit (Full)', 'POLY-S30-FULL', 'Energy Suspension', 350.00, 'planned', 'Complete front + rear bushing replacement')
  RETURNING id INTO part_steering;

  -- Wheels
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_suspension, 'Watanabe RS8 15x8 -7 (set of 4)', 'RS8-15x8-4', 'RS Watanabe', 2800.00, 3100.00, 'received', 'Type R, polished lip. 15x8 ET-7 with 205/50R15 Bridgestone RE-71RS.')
  RETURNING id INTO part_wheels;

  -- Brake parts
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_brakes, 'Wilwood Dynalite 4-Piston Front Kit', 'WIL-140-S30', 'Wilwood', 1100.00, 1050.00, 'received', '11.75" rotors, red calipers, braided lines included')
  RETURNING id INTO part_big_brake;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_brakes, 'Rear Drum-to-Disc Conversion', 'DDC-S30-REAR', 'Z Car Garage', 650.00, 680.00, 'shipped', 'Uses 280ZX rear calipers, vented rotors');

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_brakes, 'Wilwood Proportioning Valve', '260-13190', 'Wilwood', 85.00, 'planned', 'Adjustable bias valve for front/rear balance');

  -- Electrical
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_electrical, 'Pertronix Ignitor III', '71381A', 'Pertronix', 220.00, 215.00, 'installed', 'Electronic ignition conversion, replaces points')
  RETURNING id INTO part_ecu;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_electrical, 'Complete Rewire Harness', 'WH-S30-COMP', 'Z Harness', 1800.00, 'researching', 'Full chassis rewire with modern fuse block, labeled connectors')
  RETURNING id INTO part_harness;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_electrical, 'Hella H4 Headlight Conversion', 'H4-HELLA-S30', 'Hella', 180.00, 165.00, 'received', '7" H4 conversion with relay harness, 100/80W bulbs')
  RETURNING id INTO part_headlights;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_electrical, 'Odyssey PC680 Battery', 'PC680MJ', 'Odyssey', 200.00, 'planned', 'Lightweight AGM, mounts in stock tray');

  -- Interior parts
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_interior, 'Bride Zeta III Seats (Pair)', 'ZETA3-BLK-PR', 'Bride', 2400.00, 2200.00, 'received', 'FRP shell, black gradation fabric. With Planted brackets.')
  RETURNING id INTO part_seats;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_interior, 'Replacement Carpet Kit - Black', 'CK-S30-BLK', 'Classic Datsun', 450.00, 'planned', 'Molded loop carpet, full interior set with jute padding')
  RETURNING id INTO part_carpet;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_interior, 'Nardi Classic 360mm Steering Wheel', 'NARDI-360-BLK', 'Nardi', 350.00, 340.00, 'installed', 'Wood grain with polished spokes, includes hub adapter');

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_interior, 'Restored Gauge Cluster', 'GAUGE-S30-REST', 'White Post Restorations', 500.00, 'ordered', 'Full restore: new internals, correct font faces, LED backlighting');

  -- Exterior parts
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_exterior, 'Full Respray - Safari Gold 117', 'PAINT-SG117', 'Maaco Custom', 5500.00, 4800.00, 'ordered', 'Basecoat/clearcoat, full rust repair, seam sealer, epoxy primer. Color-matched to original 117.')
  RETURNING id INTO part_paint;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_exterior, 'Reproduction Fender Mirrors (Pair)', 'FM-S30-CHR', 'Datsun Parts', 160.00, 145.00, 'received', 'Chrome bullet-style fender mirrors');

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_exterior, 'OEM Tail Light Gaskets + Lenses', 'TL-S30-KIT', 'Z Car Source', 220.00, 'ordered', 'Reproduction gaskets, NOS lenses');

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_exterior, 'New Weatherstripping Kit (Full)', 'WS-S30-FULL', 'Classic Datsun', 600.00, 'planned', 'Door, hatch, windshield, quarter window seals');

  -- Fuel parts
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_fuel, 'Walbro 255 LPH Fuel Pump', 'GSS342', 'Walbro', 120.00, 110.00, 'installed', 'In-tank, feeds triple carbs at adequate pressure')
  RETURNING id INTO part_fuel_pump;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_fuel, 'Stainless Fuel Line Kit', 'FL-S30-SS', 'Classic Tube', 280.00, 'ordered', '-6AN braided stainless from tank to carbs with inline filter');

  -- Cooling parts
  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, actual_cost, status, notes)
  VALUES (v_project_id, cat_cooling, 'Koyo Aluminum Radiator', 'KOYO-HH020252', 'Koyo', 380.00, 365.00, 'received', '36mm dual-core, direct fit S30')
  RETURNING id INTO part_radiator;

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_cooling, 'Mishimoto Slim Fan + Shroud', 'MISH-FAN-S30', 'Mishimoto', 200.00, 'planned', '12" slim electric fan with aluminum shroud');

  INSERT INTO parts (project_id, category_id, name, part_number, vendor, estimated_cost, status, notes)
  VALUES (v_project_id, cat_cooling, 'Silicone Radiator Hose Kit - Blue', 'SRH-S30-BLU', 'Samco Sport', 120.00, 'ordered', 'Upper + lower + heater hoses');

  -- ==================== TASKS ====================

  -- Phase 1: Teardown (DONE)
  INSERT INTO tasks (project_id, category_id, title, description, status, priority, start_date, due_date, is_milestone, time_estimate_min, time_actual_min)
  VALUES (v_project_id, NULL, 'Complete Teardown to Bare Shell', 'Strip everything: engine, interior, glass, wiring, suspension, fuel system. Tag and bag all hardware. Photograph everything.', 'done', 'high', '2025-11-01', '2025-11-15', true, 2400, 2880)
  RETURNING id INTO task_teardown;

  -- Phase 2: Engine (IN PROGRESS)
  INSERT INTO tasks (project_id, category_id, part_id, title, description, status, priority, start_date, due_date, time_estimate_min, time_actual_min)
  VALUES (v_project_id, cat_engine, part_engine_rebuild, 'Engine Rebuild - L24 with E88 Head', 'Machine shop work: bore +0.5mm, deck head, valve job. Assemble bottom end, torque to spec. Install E88 head with new cam.', 'in_progress', 'urgent', '2025-12-01', '2026-01-15', 3600, 2400)
  RETURNING id INTO task_engine_rebuild;

  INSERT INTO tasks (project_id, category_id, part_id, title, description, status, priority, start_date, due_date, time_estimate_min)
  VALUES (v_project_id, cat_engine, part_carbs, 'Triple Carb Setup & Tune', 'Mount intake manifold, install Mikuni PHH 44s, sync carbs with Uni-Syn, jet for E88 cam profile. Target 14:1 AFR cruise, 12.5:1 WOT.', 'todo', 'high', '2026-01-16', '2026-02-01', 960)
  RETURNING id INTO task_carb_tune;

  -- Phase 3: Chassis (TODO / BACKLOG)
  INSERT INTO tasks (project_id, category_id, part_id, title, description, status, priority, start_date, due_date, time_estimate_min, time_actual_min)
  VALUES (v_project_id, cat_suspension, part_coilovers, 'Install Coilovers + Suspension Refresh', 'BC Racing coilovers, new tension rods, all new bushings. Set initial ride height at 1.5" drop. Torque all bolts to spec.', 'done', 'high', '2025-12-15', '2026-01-05', 960, 1080)
  RETURNING id INTO task_suspension_install;

  INSERT INTO tasks (project_id, category_id, part_id, title, description, status, priority, start_date, due_date, time_estimate_min)
  VALUES (v_project_id, cat_brakes, part_big_brake, 'Wilwood Big Brake Kit Install', 'Front: Dynalite 4-piston with 11.75" rotors. Rear: drum-to-disc conversion. Bleed system, bed pads.', 'todo', 'high', '2026-02-01', '2026-02-10', 720)
  RETURNING id INTO task_brake_install;

  INSERT INTO tasks (project_id, category_id, title, description, status, priority, start_date, due_date, time_estimate_min, is_milestone)
  VALUES (v_project_id, cat_suspension, 'Corner Balance & Alignment', 'Professional 4-corner weight, camber/caster/toe setup. Target: -1.5° front camber, -1° rear, 1/16" toe-in.', 'backlog', 'medium', '2026-03-15', '2026-03-20', 180, true)
  RETURNING id INTO task_alignment;

  -- Phase 4: Electrical
  INSERT INTO tasks (project_id, category_id, part_id, title, description, status, priority, start_date, due_date, time_estimate_min)
  VALUES (v_project_id, cat_electrical, part_harness, 'Complete Rewire', 'Remove all old wiring. Install new harness with labeled connectors, modern relay block, weatherproof connectors. Test every circuit.', 'todo', 'urgent', '2026-02-10', '2026-03-01', 2400)
  RETURNING id INTO task_wiring;

  -- Phase 5: Body & Paint
  INSERT INTO tasks (project_id, category_id, part_id, title, description, status, priority, start_date, due_date, time_estimate_min, time_actual_min)
  VALUES (v_project_id, cat_exterior, part_paint, 'Bodywork - Rust Repair & Prep', 'Cut and patch floor pans, battery tray, rear quarters. Seam seal entire underside. Epoxy prime bare shell.', 'done', 'urgent', '2025-11-20', '2025-12-15', 4800, 5400)
  RETURNING id INTO task_bodywork;

  INSERT INTO tasks (project_id, category_id, part_id, title, description, status, priority, start_date, due_date, time_estimate_min)
  VALUES (v_project_id, cat_exterior, part_paint, 'Paint - Safari Gold 117 Respray', 'Block sand to 400, shoot basecoat Safari Gold, 3 coats clear. Color sand and buff. Door jambs and engine bay included.', 'in_progress', 'high', '2026-01-10', '2026-02-15', 3600)
  RETURNING id INTO task_paint;

  -- Phase 6: Interior
  INSERT INTO tasks (project_id, category_id, part_id, title, description, status, priority, start_date, due_date, time_estimate_min)
  VALUES (v_project_id, cat_interior, part_seats, 'Interior Assembly', 'Install carpet, door panels, dash pad, Bride seats with Planted brackets. Reconnect gauges, install Nardi wheel.', 'backlog', 'medium', '2026-03-01', '2026-03-15', 1440)
  RETURNING id INTO task_interior;

  -- Phase 7: Final
  INSERT INTO tasks (project_id, category_id, title, description, status, priority, start_date, due_date, time_estimate_min, is_milestone)
  VALUES (v_project_id, NULL, 'Final Assembly & First Start', 'Drop engine/trans, connect everything, fill fluids, set timing. First start, break-in idle, check for leaks.', 'backlog', 'urgent', '2026-03-15', '2026-03-25', 2400, true)
  RETURNING id INTO task_final_assembly;

  INSERT INTO tasks (project_id, category_id, title, description, status, priority, start_date, due_date, time_estimate_min, is_milestone)
  VALUES (v_project_id, cat_engine, 'Dyno Tune', 'Baseline pulls, jet/timing adjustments, final AFR verification. Target: 160whp / 150wtq.', 'backlog', 'high', '2026-04-01', '2026-04-05', 240, true)
  RETURNING id INTO task_dyno;

  -- Extra tasks for variety
  INSERT INTO tasks (project_id, category_id, title, status, priority, due_date, time_estimate_min)
  VALUES
    (v_project_id, cat_fuel, 'Install Stainless Fuel Lines', 'backlog', 'medium', '2026-02-20', 480),
    (v_project_id, cat_cooling, 'Radiator + Fan Install', 'backlog', 'medium', '2026-03-10', 360),
    (v_project_id, cat_exterior, 'Install Weatherstripping', 'backlog', 'low', '2026-03-20', 480),
    (v_project_id, cat_electrical, 'Headlight H4 Conversion Install', 'todo', 'low', '2026-02-25', 120),
    (v_project_id, cat_interior, 'Restore Gauge Cluster', 'in_review', 'medium', '2026-02-15', 60);

  -- ==================== TASK DEPENDENCIES ====================

  -- Engine rebuild must be done before carb tune
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_carb_tune, task_engine_rebuild);
  -- Brake install after suspension
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_brake_install, task_suspension_install);
  -- Paint after bodywork
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_paint, task_bodywork);
  -- Wiring after paint (don't want overspray)
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_wiring, task_paint);
  -- Interior after paint and wiring
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_interior, task_paint);
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_interior, task_wiring);
  -- Final assembly after carb tune, brakes, interior, wiring
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_final_assembly, task_carb_tune);
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_final_assembly, task_brake_install);
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_final_assembly, task_interior);
  -- Alignment after final assembly
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_alignment, task_final_assembly);
  -- Dyno after final assembly
  INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (task_dyno, task_final_assembly);

  -- ==================== SPECIFICATIONS ====================

  -- Engine specs
  INSERT INTO specifications (project_id, category_id, part_id, spec_type, label, value, unit, notes) VALUES
    (v_project_id, cat_engine, part_engine_rebuild, 'torque', 'Main Bearing Cap Torque', '55-60', 'ft-lbs', 'L24 7-bearing main, tighten in sequence from center out'),
    (v_project_id, cat_engine, part_engine_rebuild, 'torque', 'Rod Bearing Cap Torque', '33-37', 'ft-lbs', 'Use assembly lube on threads'),
    (v_project_id, cat_engine, part_engine_rebuild, 'torque', 'Head Bolt Torque', '54-61', 'ft-lbs', '3-stage tighten: 25, 40, final. Re-torque after first heat cycle.'),
    (v_project_id, cat_engine, part_engine_rebuild, 'clearance', 'Main Bearing Clearance', '0.0020-0.0028', 'in', 'Plastigage check all 7 mains'),
    (v_project_id, cat_engine, part_engine_rebuild, 'clearance', 'Rod Bearing Clearance', '0.0015-0.0024', 'in', 'Plastigage each rod journal'),
    (v_project_id, cat_engine, part_engine_rebuild, 'clearance', 'Piston Ring End Gap (Top)', '0.012-0.018', 'in', 'File-fit to spec per bore'),
    (v_project_id, cat_engine, part_engine_rebuild, 'clearance', 'Valve Lash - Intake', '0.010', 'in', 'Set cold, E88 head spec'),
    (v_project_id, cat_engine, part_engine_rebuild, 'clearance', 'Valve Lash - Exhaust', '0.012', 'in', 'Set cold, E88 head spec'),
    (v_project_id, cat_engine, NULL, 'fluid', 'Engine Oil', '20W-50', NULL, 'Valvoline VR1 racing, 4.4 quarts with filter'),
    (v_project_id, cat_engine, NULL, 'torque', 'Spark Plug Torque', '15-20', 'ft-lbs', 'NGK BP6ES, gapped at 0.032"');

  -- Brake specs
  INSERT INTO specifications (project_id, category_id, part_id, spec_type, label, value, unit, notes) VALUES
    (v_project_id, cat_brakes, part_big_brake, 'torque', 'Caliper Bracket Bolts', '75-80', 'ft-lbs', 'Wilwood Dynalite, use blue Loctite'),
    (v_project_id, cat_brakes, NULL, 'torque', 'Lug Nut Torque', '80-90', 'ft-lbs', 'Star pattern, re-torque after 50 miles'),
    (v_project_id, cat_brakes, NULL, 'fluid', 'Brake Fluid', 'DOT 4', NULL, 'Motul RBF 600, bleed order: RR-LR-RF-LF'),
    (v_project_id, cat_brakes, NULL, 'pressure', 'Brake Line Pressure (Front)', '900-1100', 'psi', 'Measure at caliper during hard stop');

  -- Suspension specs
  INSERT INTO specifications (project_id, category_id, part_id, spec_type, label, value, unit, notes) VALUES
    (v_project_id, cat_suspension, part_coilovers, 'custom', 'Front Spring Rate', '8', 'kg/mm', 'BC Racing BR, 30-way damping'),
    (v_project_id, cat_suspension, part_coilovers, 'custom', 'Rear Spring Rate', '6', 'kg/mm', 'BC Racing BR, 30-way damping'),
    (v_project_id, cat_suspension, NULL, 'clearance', 'Front Camber', '-1.5', 'degrees', 'Target for street/canyon use'),
    (v_project_id, cat_suspension, NULL, 'clearance', 'Rear Camber', '-1.0', 'degrees', 'Shim-adjustable'),
    (v_project_id, cat_suspension, NULL, 'clearance', 'Front Toe (total)', '1/16 toe-in', NULL, 'Measured at tire tread face'),
    (v_project_id, cat_suspension, NULL, 'torque', 'Strut Tower Nut Torque', '30-35', 'ft-lbs', 'Top mount nuts, do not overtighten');

  -- Cooling specs
  INSERT INTO specifications (project_id, category_id, part_id, spec_type, label, value, unit, notes) VALUES
    (v_project_id, cat_cooling, part_radiator, 'fluid', 'Coolant', '50/50 Ethylene Glycol', NULL, 'Total system capacity: 7.4 quarts'),
    (v_project_id, cat_cooling, NULL, 'pressure', 'Radiator Cap Pressure', '13', 'psi', 'OEM spec, do not exceed 16 psi'),
    (v_project_id, cat_cooling, NULL, 'custom', 'Thermostat Opening Temp', '180', '°F', 'Stant SuperStat low-temp thermostat');

  -- Electrical specs
  INSERT INTO specifications (project_id, category_id, part_id, spec_type, label, value, unit, notes) VALUES
    (v_project_id, cat_electrical, part_ecu, 'custom', 'Ignition Timing (Base)', '10', '° BTDC', 'Pertronix III, set with timing light at idle 800rpm'),
    (v_project_id, cat_electrical, NULL, 'wire_gauge', 'Main Power Feed', '4', 'AWG', 'Battery to fuse block, OFC copper'),
    (v_project_id, cat_electrical, NULL, 'wire_gauge', 'Headlight Circuit', '12', 'AWG', 'With relay harness for H4 conversion'),
    (v_project_id, cat_electrical, NULL, 'wire_gauge', 'Ignition Circuit', '14', 'AWG', 'Pertronix and coil feed');

  -- Fuel specs
  INSERT INTO specifications (project_id, category_id, part_id, spec_type, label, value, unit, notes) VALUES
    (v_project_id, cat_fuel, part_fuel_pump, 'pressure', 'Fuel Pressure (at carbs)', '3.0-3.5', 'psi', 'Walbro 255 with regulator. Do NOT exceed 4 psi with Mikunis.'),
    (v_project_id, cat_fuel, NULL, 'fluid', 'Fuel Type', '91+ Octane', NULL, 'Premium unleaded, no ethanol preferred for carbs');

  RAISE NOTICE 'Demo project created: 240Z Restoration (project_id: %)', v_project_id;
END $$;
