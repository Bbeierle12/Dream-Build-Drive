-- Dream Build Drive - Platform-Specific Spec Templates
-- ============================================================
-- Adds spec templates for classic-muscle, modern-efi, and diesel-truck platforms.

-- ============================================================
-- CLASSIC MUSCLE (SBC / BBC era)
-- ============================================================

INSERT INTO public.spec_templates (vehicle_platform, spec_type, category_name, label, default_value, unit) VALUES
  -- Engine
  ('classic-muscle', 'torque', 'Engine', 'Intake Manifold Bolts (SBC)', '25', 'ft-lbs'),
  ('classic-muscle', 'torque', 'Engine', 'Intake Manifold Bolts (BBC)', '30', 'ft-lbs'),
  ('classic-muscle', 'torque', 'Engine', 'Main Cap Bolts (SBC)', '65-75', 'ft-lbs'),
  ('classic-muscle', 'torque', 'Engine', 'Connecting Rod Bolts (SBC)', '45', 'ft-lbs'),
  ('classic-muscle', 'torque', 'Engine', 'Cylinder Head Bolts (SBC)', '65', 'ft-lbs'),
  ('classic-muscle', 'clearance', 'Engine', 'Piston-to-Wall Clearance (SBC)', '0.003-0.005', 'in'),
  ('classic-muscle', 'clearance', 'Engine', 'Rod Bearing Clearance (SBC)', '0.001-0.0025', 'in'),
  ('classic-muscle', 'fluid', 'Engine', 'Engine Oil (Flat Tappet Cam)', '10W-30 ZDDP', ''),
  ('classic-muscle', 'pressure', 'Engine', 'Oil Pressure (Hot Idle)', '25-35', 'psi'),
  -- Suspension
  ('classic-muscle', 'torque', 'Suspension', 'Leaf Spring U-Bolts', '45-65', 'ft-lbs'),
  -- Brakes
  ('classic-muscle', 'pressure', 'Brakes', 'Drum Brake Shoe Clearance', '0.010-0.015', 'in'),
  -- Electrical
  ('classic-muscle', 'wire_gauge', 'Electrical', 'Points Ignition Primary', '14-16', 'AWG'),
  ('classic-muscle', 'custom', 'Electrical', 'Point Gap', '0.019', 'in'),
  -- Fuel
  ('classic-muscle', 'pressure', 'Fuel', 'Holley Carb Fuel Pressure', '5-7', 'psi'),
  ('classic-muscle', 'custom', 'Fuel', 'Idle Mixture (Holley)', '1-1.5 turns out', ''),
  -- Cooling
  ('classic-muscle', 'custom', 'Cooling', 'Thermostat Rating', '180', 'F');

-- ============================================================
-- MODERN EFI (LS / LT and late-model platforms)
-- ============================================================

INSERT INTO public.spec_templates (vehicle_platform, spec_type, category_name, label, default_value, unit) VALUES
  -- Engine
  ('modern-efi', 'torque', 'Engine', 'LS Head Bolts (Short)', '22 + 90°', 'ft-lbs + angle'),
  ('modern-efi', 'torque', 'Engine', 'LS Intake Manifold Bolts', '44', 'in-lbs'),
  ('modern-efi', 'torque', 'Engine', 'LS Exhaust Manifold Bolts', '18', 'ft-lbs'),
  ('modern-efi', 'torque', 'Engine', 'LS Main Cap Bolts (Inner)', '15 + 80°', 'ft-lbs + angle'),
  ('modern-efi', 'clearance', 'Engine', 'LS Piston Ring End Gap (Top)', '0.014-0.022', 'in'),
  ('modern-efi', 'fluid', 'Engine', 'Engine Oil (LS)', '5W-30 Dexos', ''),
  ('modern-efi', 'pressure', 'Engine', 'Fuel Rail Pressure (LS)', '58', 'psi'),
  -- Suspension
  ('modern-efi', 'torque', 'Suspension', 'Coilover Mount Bolts', '40-55', 'ft-lbs'),
  -- Brakes
  ('modern-efi', 'torque', 'Brakes', 'Caliper Bracket Bolts (Brembo)', '85-100', 'ft-lbs'),
  -- Electrical
  ('modern-efi', 'wire_gauge', 'Electrical', 'ECU Power/Ground', '10', 'AWG'),
  ('modern-efi', 'wire_gauge', 'Electrical', 'Injector Harness', '18-20', 'AWG'),
  ('modern-efi', 'custom', 'Electrical', 'CAN Bus Termination Resistance', '60', 'ohms'),
  -- Fuel
  ('modern-efi', 'pressure', 'Fuel', 'Returnless Fuel System Pressure', '55-62', 'psi'),
  -- Cooling
  ('modern-efi', 'custom', 'Cooling', 'LS Thermostat Rating', '195', 'F'),
  ('modern-efi', 'torque', 'Cooling', 'LS Water Pump Bolts', '11', 'ft-lbs');

-- ============================================================
-- DIESEL TRUCK (Cummins / Duramax / Powerstroke)
-- ============================================================

INSERT INTO public.spec_templates (vehicle_platform, spec_type, category_name, label, default_value, unit) VALUES
  -- Engine
  ('diesel-truck', 'torque', 'Engine', '5.9 Cummins Head Bolts', '89 + 90° + 90°', 'ft-lbs + angle'),
  ('diesel-truck', 'torque', 'Engine', 'Duramax LBZ Main Cap Bolts', '22 + 155°', 'ft-lbs + angle'),
  ('diesel-truck', 'torque', 'Engine', '7.3 Powerstroke Intake Y-Pipe', '35', 'ft-lbs'),
  ('diesel-truck', 'fluid', 'Engine', 'Engine Oil (6.7 Cummins)', '15W-40 CK-4', ''),
  ('diesel-truck', 'fluid', 'Engine', 'Oil Capacity (6.6 Duramax)', '10', 'quarts'),
  ('diesel-truck', 'pressure', 'Engine', 'Turbo Boost Pressure (Stock 5.9)', '25-30', 'psi'),
  -- Suspension
  ('diesel-truck', 'torque', 'Suspension', 'Track Bar Bolt (Dodge)', '125-175', 'ft-lbs'),
  ('diesel-truck', 'torque', 'Suspension', 'Leaf Spring Center Bolt', '110-150', 'ft-lbs'),
  -- Brakes
  ('diesel-truck', 'torque', 'Brakes', 'Caliper Bracket Bolts (3/4 Ton)', '148-178', 'ft-lbs'),
  -- Fuel
  ('diesel-truck', 'pressure', 'Fuel', 'Common Rail Pressure (Idle)', '5000-6000', 'psi'),
  ('diesel-truck', 'pressure', 'Fuel', 'HPOP Pressure (7.3L)', '500-3000', 'psi'),
  -- Exterior
  ('diesel-truck', 'torque', 'Exterior', 'Exhaust Downpipe V-Band Clamp', '80-90', 'in-lbs'),
  -- Cooling
  ('diesel-truck', 'custom', 'Cooling', 'Thermostat Rating (Diesel)', '190-200', 'F'),
  ('diesel-truck', 'torque', 'Cooling', 'Intercooler Boot Clamps', '80-95', 'in-lbs');
