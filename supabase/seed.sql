-- Seed de demonstração (aplicado por `supabase db reset`).
-- Cria uma loja "demo" com alguns veículos para visualizar o site
-- público em /demo sem precisar criar conta. Roda como postgres
-- (RLS não se aplica ao owner), então não precisa de auth.users.

insert into public.tenants (id, slug, name, phone, whatsapp, email, template_id, colors, settings)
values (
  '11111111-1111-1111-1111-111111111111',
  'demo',
  'Auto Center Demo',
  '(11) 3333-4444',
  '11999998888',
  'contato@demo.com',
  'moderno',
  '{"primary":"#1d4ed8","accent":"#f59e0b"}'::jsonb,
  '{"slogan":"Os melhores seminovos da região","about":"Há 15 anos realizando o sonho do carro novo.","business_hours":"Seg a Sex 9h-18h\nSáb 9h-13h"}'::jsonb
)
on conflict (id) do nothing;

insert into public.vehicles
  (tenant_id, brand, model, version, year_fab, year_model, color, fuel, transmission, mileage, doors, price, featured, status, optionals, description)
values
  ('11111111-1111-1111-1111-111111111111', 'Honda', 'Civic', 'EXL 2.0', 2021, 2022, 'Prata', 'flex', 'automatico', 32000, 4, 132900, true,  'available', array['Ar-condicionado','Bancos de couro','Multimídia'], 'Único dono, revisões em concessionária.'),
  ('11111111-1111-1111-1111-111111111111', 'Toyota', 'Corolla', 'XEi 2.0', 2020, 2021, 'Branco', 'flex', 'cvt', 45000, 4, 124500, true, 'available', array['Ar-condicionado','Câmera de ré'], 'Muito conservado.'),
  ('11111111-1111-1111-1111-111111111111', 'Honda', 'HR-V', 'Touring', 2022, 2023, 'Preto', 'flex', 'cvt', 18000, 4, 158000, false, 'available', array['Teto solar','Faróis de LED'], null),
  ('11111111-1111-1111-1111-111111111111', 'Jeep', 'Compass', 'Limited', 2021, 2022, 'Cinza', 'diesel', 'automatico', 51000, 4, 149900, false, 'reserved', array['Couro','Rodas de liga leve'], null)
on conflict do nothing;
